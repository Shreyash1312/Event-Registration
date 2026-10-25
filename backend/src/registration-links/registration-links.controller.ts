import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
} from '@nestjs/common';

import { RegistrationLinksService } from './registration-links.service';

@Controller('registration-links')
export class RegistrationLinksController {
  constructor(
    private readonly registrationLinksService: RegistrationLinksService,
  ) {}

  @Post()
  createLink() {
    return this.registrationLinksService.createLink();
  }

  @Post(':token/send-otp')
  sendOtp(
    @Param('token') token: string,
    @Body() body: { email: string },
  ) {
    return this.registrationLinksService.sendOtp(
      token,
      body.email,
    );
  }

  @Post(':token/verify-otp')
  verifyOtp(
    @Param('token') token: string,
    @Body() body: { email: string; otp: string },
  ) {
    return this.registrationLinksService.verifyOtp(
      token,
      body.email,
      body.otp,
    );
  }

  @Get(':token')
  checkLink(@Param('token') token: string) {
    return this.registrationLinksService.getLink(token);
  }

  @Post(':token/register')
  registerParticipant(
    @Param('token') token: string,
    @Body() body: { name: string; email: string },
  ) {
    return this.registrationLinksService.registerParticipant(
      token,
      body.name,
      body.email,
    );
  }

  @Delete(':token/register')
  cancelRegistration(
    @Param('token') token: string,
    @Body() body: { name: string; email: string },
  ) {
    return this.registrationLinksService.cancelRegistration(
      token,
      body.name,
      body.email,
    );
  }
}