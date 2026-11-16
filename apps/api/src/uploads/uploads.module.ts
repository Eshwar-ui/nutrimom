import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { AdminUploadsController } from './admin-uploads.controller';

// StorageService comes from the global StorageModule; no imports needed.
@Module({
  controllers: [UploadsController, AdminUploadsController],
})
export class UploadsModule {}
