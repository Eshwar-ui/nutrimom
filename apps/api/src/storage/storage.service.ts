import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Env } from '../config/env.validation';

// Only real photo formats a phone camera produces. Kept small on purpose.
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Thin wrapper over the Supabase Storage REST API (no SDK dependency).
 * Uploads go through the API with the service-role key so the secret never
 * reaches the browser; the bucket is public-read so listing images render
 * straight from Supabase's CDN.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseUrl: string;
  private readonly serviceKey: string;
  private readonly bucket: string;

  constructor(config: ConfigService<Env, true>) {
    this.baseUrl = config
      .get('SUPABASE_URL', { infer: true })
      .replace(/\/$/, '');
    this.serviceKey = config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });
    this.bucket = config.get('SUPABASE_STORAGE_BUCKET', { infer: true });
  }

  /** Store one image and return its public URL. */
  async uploadImage(
    userId: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const ext = ALLOWED[contentType];
    if (!ext) {
      throw new BadRequestException(
        'Only JPEG, PNG or WebP images are allowed',
      );
    }
    const path = `${userId}/${randomUUID()}.${ext}`;
    const res = await fetch(
      `${this.baseUrl}/storage/v1/object/${this.bucket}/${path}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.serviceKey}`,
          'Content-Type': contentType,
          'cache-control': 'public, max-age=31536000, immutable',
        },
        // Buffer → plain Uint8Array view so it satisfies fetch's BodyInit type.
        body: new Uint8Array(buffer),
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.error(`Supabase upload failed (${res.status}): ${detail}`);
      throw new InternalServerErrorException('Image upload failed');
    }
    return this.publicUrl(path);
  }

  /**
   * Best-effort delete of images we host, given their public URLs. Never throws
   * — orphaned blobs are cheap; a failed listing delete because of storage is not.
   */
  async removeByUrls(urls: string[]): Promise<void> {
    const prefix = `${this.baseUrl}/storage/v1/object/public/${this.bucket}/`;
    const paths = urls
      .filter((u) => u.startsWith(prefix))
      .map((u) => u.slice(prefix.length));
    if (paths.length === 0) return;
    try {
      const res = await fetch(
        `${this.baseUrl}/storage/v1/object/${this.bucket}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefixes: paths }),
        },
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.warn(`Supabase delete failed (${res.status}): ${detail}`);
      }
    } catch (err) {
      this.logger.warn(`Supabase delete threw: ${String(err)}`);
    }
  }

  private publicUrl(path: string): string {
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${path}`;
  }
}
