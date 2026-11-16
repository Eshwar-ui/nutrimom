import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StorageService } from '../storage/storage.service';

// Same hard cap as the seller endpoint — the client compresses well below it.
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Where site imagery (hero, founders, gallery, partner logos, testimonial
 * photos) is stored in the bucket. The seller endpoint files uploads under the
 * seller's own user id; site imagery belongs to no user, so it gets one fixed
 * folder — which also keeps it separable from listing photos.
 */
export const SITE_UPLOAD_PREFIX = 'site';

@Controller('admin/uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUploadsController {
  constructor(private readonly storage: StorageService) {}

  /**
   * Accepts one image, stores it under `site/`, returns its public URL. The
   * format check is StorageService's magic-byte sniff (JPEG/PNG/WebP only),
   * identical to the seller endpoint. A looser rate limit than sellers get
   * (60/min vs 20) because filling the gallery is one burst of many photos.
   */
  @Post()
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('No image was uploaded');
    const url = await this.storage.uploadImage(SITE_UPLOAD_PREFIX, file.buffer);
    return { url };
  }
}
