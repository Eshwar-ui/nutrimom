import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { AdminContactController } from './admin-contact.controller';

@Module({
  providers: [ContactService],
  controllers: [ContactController, AdminContactController],
})
export class ContactModule {}
