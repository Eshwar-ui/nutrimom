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
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Sniffs the actual file format from its magic bytes. The client-supplied
 * mimetype is just a header the caller sets — never trust it to decide what
 * gets stored and served as an image. Returns null for anything that isn't
 * one of the three formats we accept.
 */
function detectImageType(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

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

  /**
   * Store one image and return its public URL. The format is determined by
   * sniffing the file's magic bytes, not the client-supplied mimetype —
   * that header is trivially spoofable and would otherwise let arbitrary
   * bytes get hosted on our domain labeled (and served) as an image.
   */
  async uploadImage(userId: string, buffer: Buffer): Promise<string> {
    const contentType = detectImageType(buffer);
    if (!contentType) {
      throw new BadRequestException(
        'Only JPEG, PNG or WebP images are allowed',
      );
    }
    const ext = EXTENSIONS[contentType];
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
