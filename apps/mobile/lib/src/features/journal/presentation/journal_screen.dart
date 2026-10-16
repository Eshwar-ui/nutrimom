import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../contracts/enums.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/async_view.dart';
import '../../catalog/presentation/widgets/listing_image.dart';
import '../application/journal_providers.dart';
import '../data/journal_repository.dart';

/// The Nurture Journal (brief §11), with its ten categories.
class JournalScreen extends ConsumerWidget {
  const JournalScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final theme = Theme.of(context);
    final selected = ref.watch(journalCategoryProvider);
    final posts = ref.watch(journalPostsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('The Nurture Journal')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(journalPostsProvider);
          await ref.read(journalPostsProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
              child: Text(
                'Practical reads for pregnancy, postpartum, first foods and everything after.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: t.mutedForeground,
                ),
              ),
            ),
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  ChoiceChip(
                    label: const Text('All'),
                    selected: selected == null,
                    onSelected: (_) =>
                        ref.read(journalCategoryProvider.notifier).select(null),
                  ),
                  for (final c in BlogCategory.values) ...[
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: Text(c.label),
                      selected: selected == c,
                      onSelected: (_) =>
                          ref.read(journalCategoryProvider.notifier).select(c),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),
            AsyncView(
              value: posts,
              onRetry: () => ref.invalidate(journalPostsProvider),
              data: (page) => page.items.isEmpty
                  ? EmptyView(
                      title: selected == null
                          ? 'No posts yet'
                          : 'Nothing in ${selected.label} yet',
                      body: selected == null
                          ? 'New writing appears here as soon as it is published.'
                          : 'Try another category, or see everything.',
                      icon: Icons.menu_book_outlined,
                      action: selected == null
                          ? null
                          : OutlinedButton(
                              onPressed: () => ref
                                  .read(journalCategoryProvider.notifier)
                                  .select(null),
                              child: const Text('Show all posts'),
                            ),
                    )
                  : Column(
                      children: [
                        for (final post in page.items)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                            child: _PostCard(post: post),
                          ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  const _PostCard({required this.post});

  final BlogPost post;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final theme = Theme.of(context);
    return InkWell(
      onTap: () => context.push('/journal/${post.slug}'),
      borderRadius: BorderRadius.circular(NmTokens.radius2xl),
      child: Container(
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(NmTokens.radius2xl),
          border: Border.all(color: t.border, width: 2),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (post.coverImageUrl != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: ListingImage(
                  url: post.coverImageUrl,
                  semanticLabel: post.title,
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (post.category != null)
                    Text(
                      post.category!.label.toUpperCase(),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: t.accentText,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.1,
                      ),
                    ),
                  if (post.category != null) const SizedBox(height: 6),
                  Text(post.title, style: theme.textTheme.headlineSmall),
                  if ((post.excerpt ?? '').trim().isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      post.excerpt!,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: t.mutedForeground,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
