import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  listingInputSchema,
  listingUpdateSchema,
  type ListingInput,
  type ListingUpdateInput,
} from '@nutrimom/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ListingsService } from './listings.service';
import type { Env } from '../config/env.validation';

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxImageBytes = 5 * 1024 * 1024;

@Controller('seller/listings')
@UseGuards(JwtAuthGuard)
export class SellerListingsController {
  constructor(
    private readonly listings: ListingsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get()
  mine(@CurrentUser() user: RequestUser) {
    return this.listings.listMine(user.id);
  }

  @Get('stats')
  stats(@CurrentUser() user: RequestUser) {
    return this.listings.sellerStats(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(listingInputSchema)) dto: ListingInput,
  ) {
    return this.listings.create(user.id, dto);
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(@UploadedFiles() files: UploadedImage[] = []) {
    if (!files.length) throw new BadRequestException('Upload at least one image');

    const urls = await Promise.all(
      files.map(async (file) => {
        if (!allowedImageTypes.has(file.mimetype)) {
          throw new BadRequestException('Only JPG, PNG, and WebP images are allowed');
        }
        if (file.size > maxImageBytes) {
          throw new BadRequestException('Each image must be 5 MB or smaller');
        }

        const objectPath = `listings/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extensionFor(file)}`;
        await this.uploadToSupabase(objectPath, file);
        return this.publicStorageUrl(objectPath);
      }),
    );

    return { urls };
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(listingUpdateSchema)) dto: ListingUpdateInput,
  ) {
    return this.listings.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.listings.remove(user.id, id);
  }

  private async uploadToSupabase(objectPath: string, file: UploadedImage) {
    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    const serviceRoleKey = this.config.get('SUPABASE_SERVICE_ROLE_KEY', {
      infer: true,
    });
    const bucket = this.config.get('SUPABASE_STORAGE_BUCKET', { infer: true });
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodePath(bucket)}/${encodePath(objectPath)}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'cache-control': '31536000',
        'content-type': file.mimetype,
        'x-upsert': 'false',
      },
      body: file.buffer.buffer.slice(
        file.buffer.byteOffset,
        file.buffer.byteOffset + file.buffer.byteLength,
      ) as ArrayBuffer,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new BadRequestException(
        detail || 'Could not upload image to Supabase Storage',
      );
    }
  }

  private publicStorageUrl(objectPath: string) {
    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    const bucket = this.config.get('SUPABASE_STORAGE_BUCKET', { infer: true });
    return `${supabaseUrl}/storage/v1/object/public/${encodePath(bucket)}/${encodePath(objectPath)}`;
  }
}

function extensionFor(file: UploadedImage) {
  if (file.mimetype === 'image/jpeg') return '.jpg';
  if (file.mimetype === 'image/png') return '.png';
  if (file.mimetype === 'image/webp') return '.webp';
  return extname(file.originalname).toLowerCase();
}

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}
