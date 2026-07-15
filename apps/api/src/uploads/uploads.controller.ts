import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../common/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';

// Hard cap at the API boundary — the client compresses well below this, but a
// server-side limit is the one that actually protects the box.
const MAX_BYTES = 8 * 1024 * 1024;

@Controller('seller/uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  /** Accepts one image, stores it, returns its public URL. */
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_BYTES } }))
  async upload(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('No image was uploaded');
    const url = await this.storage.uploadImage(
      user.id,
      file.buffer,
      file.mimetype,
    );
    return { url };
  }
}
