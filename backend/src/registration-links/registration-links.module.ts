import { Module } from '@nestjs/common';
import { RegistrationLinksController } from './registration-links.controller';
import { RegistrationLinksService } from './registration-links.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RegistrationLinksController],
  providers: [RegistrationLinksService, PrismaService],
})
export class RegistrationLinksModule {}