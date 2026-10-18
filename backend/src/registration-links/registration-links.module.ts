import { Module } from '@nestjs/common';
import { RegistrationLinksController } from './registration-links.controller';
import { RegistrationLinksService } from './registration-links.service';

@Module({
  controllers: [RegistrationLinksController],
  providers: [RegistrationLinksService],
})
export class RegistrationLinksModule {}