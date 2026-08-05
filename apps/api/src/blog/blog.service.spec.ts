import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';

type Tx = {
  blogPost: { create: jest.Mock; update: jest.Mock };
  blogPostSlug: { deleteMany: jest.Mock; upsert: jest.Mock };
};

function makeService() {
  const tx: Tx = {
    blogPost: { create: jest.fn(), update: jest.fn() },
    blogPostSlug: { deleteMany: jest.fn(), upsert: jest.fn() },
  };
  const prisma = {
    blogPost: { findUnique: jest.fn() },
    blogPostSlug: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (t: Tx) => unknown) => fn(tx)),
  };
  const svc = new BlogService(prisma as any);
  return { svc, prisma, tx };
}

const row = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'p1',
  title: 'A post',
  slug: 'a-post',
  excerpt: null,
  bodyMarkdown: 'Body text here.',
  coverImageUrl: null,
  published: true,
  publishedAt: new Date('2026-01-01'),
  authorName: 'Team',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...over,
});

const input = {
  title: 'A post',
  slug: 'a-post',
  bodyMarkdown: 'Body text here.',
  authorName: 'Team',
};

const prismaError = (code: string) => Object.assign(new Error('db'), { code });

describe('BlogService — retired slugs keep resolving', () => {
  it('falls back to a retired slug and reports the current one', async () => {
    const { svc, prisma } = makeService();
    prisma.blogPost.findUnique.mockResolvedValue(null);
    prisma.blogPostSlug.findUnique.mockResolvedValue({
      slug: 'old-name',
      post: row({ slug: 'new-name' }),
    });

    const post = await svc.getPublishedBySlug('old-name');

    // The caller redirects on this mismatch, which is what keeps one canonical
    // URL instead of serving the post at every name it ever had.
    expect(post.slug).toBe('new-name');
  });

  it('prefers a live post over a retired slug of the same name', async () => {
    const { svc, prisma } = makeService();
    prisma.blogPost.findUnique.mockResolvedValue(row({ slug: 'shared' }));

    const post = await svc.getPublishedBySlug('shared');

    expect(post.slug).toBe('shared');
    expect(prisma.blogPostSlug.findUnique).not.toHaveBeenCalled();
  });

  it('does not leak an unpublished post through its old slug', async () => {
    const { svc, prisma } = makeService();
    prisma.blogPost.findUnique.mockResolvedValue(null);
    prisma.blogPostSlug.findUnique.mockResolvedValue({
      slug: 'old-name',
      post: row({ published: false }),
    });

    await expect(svc.getPublishedBySlug('old-name')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('records the old slug when a post is renamed', async () => {
    const { svc, prisma, tx } = makeService();
    prisma.blogPost.findUnique.mockResolvedValue(row({ slug: 'old-name' }));
    tx.blogPost.update.mockResolvedValue(row({ slug: 'new-name' }));

    await svc.update('p1', { ...input, slug: 'new-name' });

    expect(tx.blogPostSlug.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'old-name' } }),
    );
    // The incoming slug must stop being a redirect the moment it goes live,
    // or the history row would shadow the post now sitting there.
    expect(tx.blogPostSlug.deleteMany).toHaveBeenCalledWith({
      where: { slug: 'new-name' },
    });
  });

  it('records nothing when the slug is unchanged', async () => {
    const { svc, prisma, tx } = makeService();
    prisma.blogPost.findUnique.mockResolvedValue(row({ slug: 'a-post' }));
    tx.blogPost.update.mockResolvedValue(row());

    await svc.update('p1', input);

    expect(tx.blogPostSlug.upsert).not.toHaveBeenCalled();
  });

  it('frees a retired slug when a new post claims it', async () => {
    const { svc, tx } = makeService();
    tx.blogPost.create.mockResolvedValue(row());

    await svc.create(input);

    expect(tx.blogPostSlug.deleteMany).toHaveBeenCalledWith({
      where: { slug: 'a-post' },
    });
  });
});

describe('BlogService — failures are reported accurately', () => {
  it('calls a duplicate slug a duplicate slug', async () => {
    const { svc, tx } = makeService();
    tx.blogPost.create.mockRejectedValue(prismaError('P2002'));

    await expect(svc.create(input)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not blame the slug for an unrelated database failure', async () => {
    const { svc, tx } = makeService();
    tx.blogPost.create.mockRejectedValue(prismaError('P1001'));

    // Used to surface as "That slug is already in use", which sends the admin
    // renaming a post to fix a problem that has nothing to do with the slug.
    await expect(svc.create(input)).rejects.not.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('404s an update against a missing post', async () => {
    const { svc, prisma } = makeService();
    prisma.blogPost.findUnique.mockResolvedValue(null);

    await expect(svc.update('gone', input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
