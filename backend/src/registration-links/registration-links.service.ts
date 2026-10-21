
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegistrationLinksService {
  constructor(private prisma: PrismaService) {}

  // Create a registration link
  async createLink() {
    const token = randomBytes(16).toString('hex');
    const ownerSecret = randomBytes(32).toString('hex');

    const ownerSecretHash = createHash('sha256')
      .update(ownerSecret)
      .digest('hex');

    const link = await this.prisma.registrationLink.create({
      data: {
        token,
        ownerSecretHash,
        maxRegistrations: 5,
      },
      select: {
        id: true,
        token: true,
        active: true,
        maxRegistrations: true,
        createdAt: true,
      },
    });

    const frontendUrl = (
      process.env.FRONTEND_URL ?? 'https://event-registration-ochre.vercel.app'
    ).replace(/\/+$/, '');

    return {
      message: 'Registration link created successfully',
      registrationUrl: `${frontendUrl}/register/${link.token}`,
      ownerSecret,
      link,
    };
  }

  // Check registration link status
  async getLink(token: string) {
    const link = await this.prisma.registrationLink.findUnique({
      where: { token },
      include: { registrations: true },
    });

    if (!link || !link.active) {
      throw new NotFoundException('Registration link is invalid or inactive');
    }

    if (link.registrations.length >= link.maxRegistrations) {
      throw new BadRequestException('Registration link is full');
    }

    return {
      message: 'Registration link is available',
      remainingSlots: link.maxRegistrations - link.registrations.length,
    };
  }

  // Register a participant
  async registerParticipant(token: string, name: string, email: string) {
    const link = await this.prisma.registrationLink.findUnique({
      where: { token },
      include: { registrations: true },
    });

    if (!link || !link.active) {
      throw new NotFoundException('Registration link is invalid or inactive');
    }

    if (link.registrations.length >= link.maxRegistrations) {
      throw new BadRequestException('Registration link is full');
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      throw new BadRequestException('Name and email are required');
    }

    const existing = await this.prisma.registration.findUnique({
      where: {
        linkId_email: {
          linkId: link.id,
          email: cleanEmail,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('This email is already registered');
    }

    await this.prisma.registration.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        linkId: link.id,
      },
    });

    const total = await this.prisma.registration.count({
      where: { linkId: link.id },
    });

    return {
      message: 'Registration successful',
      totalRegistrations: total,
      remainingSlots: link.maxRegistrations - total,
    };
  }
}
