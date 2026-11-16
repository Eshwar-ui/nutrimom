import { BadRequestException } from '@nestjs/common';
import {
  AdminUploadsController,
  SITE_UPLOAD_PREFIX,
} from './admin-uploads.controller';

// StorageService is mocked: the real one writes to the shared live Supabase
// bucket, and its format sniffing is the same code the seller endpoint uses.
function makeController() {
  const storage = {
    uploadImage: jest
      .fn()
      .mockResolvedValue(
        'https://x.supabase.co/storage/v1/object/public/listing-images/site/abc.jpg',
      ),
  };
  const controller = new AdminUploadsController(storage as any);
  return { controller, storage };
}

const file = (buffer: Buffer) => ({ buffer }) as Express.Multer.File;

describe('AdminUploadsController', () => {
  it('stores site imagery under the site/ prefix, not a user id', async () => {
    const { controller, storage } = makeController();
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

    const result = await controller.upload(file(buffer));

    expect(SITE_UPLOAD_PREFIX).toBe('site');
    expect(storage.uploadImage).toHaveBeenCalledWith('site', buffer);
    expect(result).toEqual({
      url: 'https://x.supabase.co/storage/v1/object/public/listing-images/site/abc.jpg',
    });
  });

  it('refuses a request with no file', async () => {
    const { controller, storage } = makeController();

    await expect(controller.upload(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('passes the storage rejection of a non-image through', async () => {
    const { controller, storage } = makeController();
    storage.uploadImage.mockRejectedValue(
      new BadRequestException('Only JPEG, PNG or WebP images are allowed'),
    );

    await expect(
      controller.upload(file(Buffer.from('not an image'))),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
