import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

// Global so ListingsService (orphan cleanup) and UploadsController can both
// inject StorageService without re-importing the module everywhere.
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
