
import {
  Controller,
  Post,
  Get,
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
}
