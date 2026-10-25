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

  // Development-only dummy OTP
  async sendOtp(token: string, email: string) {
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      throw new BadRequestException('Email is required');
    }

    const link = await this.prisma.registrationLink.findUnique({
      where: { token },
    });

    if (!link || !link.active) {
      throw new NotFoundException(
        'Registration link is invalid or inactive',
      );
    }

    const code = '123456';
    const codeHash = createHash('sha256')
      .update(code)
      .digest('hex');

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.emailOtp.create({
      data: {
        email: cleanEmail,
        codeHash,
        linkId: link.id,
        expiresAt,
        attempts: 0,
        verifiedAt: null,
      },
    });

    return {
      message: 'Development OTP generated successfully',
      // For local testing only; remove before production.
      otp: code,
      expiresInMinutes: 5,
    };
  }

  // Development-only OTP verification
  async verifyOtp(token: string, email: string, otp: string) {
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail || !otp) {
      throw new BadRequestException('Email and OTP are required');
    }

    const link = await this.prisma.registrationLink.findUnique({
      where: { token },
    });

    if (!link || !link.active) {
      throw new NotFoundException(
        'Registration link is invalid or inactive',
      );
    }

    const otpRecord = await this.prisma.emailOtp.findFirst({
      where: {
        linkId: link.id,
        email: cleanEmail,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException(
        'OTP expired or not requested. Please request a new OTP.',
      );
    }

    const expectedHash = createHash('sha256')
      .update('123456')
      .digest('hex');

    if (otp !== '123456' || otpRecord.codeHash !== expectedHash) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.emailOtp.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    return { message: 'OTP verified successfully' };
  }

  // Create or reuse the registration link
  async createLink() {
    const existingLink = await this.prisma.registrationLink.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const frontendUrl = (
      process.env.FRONTEND_URL ??
      'https://event-registration-ochre.vercel.app'
    ).replace(/\/+$/, '');

    if (existingLink) {
      return {
        message: 'Using existing registration link',
        registrationUrl: `${frontendUrl}/register/${existingLink.token}`,
        link: {
          id: existingLink.id,
          token: existingLink.token,
          active: existingLink.active,
          maxRegistrations: existingLink.maxRegistrations,
          createdAt: existingLink.createdAt,
        },
      };
    }

    const token = randomBytes(16).toString('hex');
    const ownerSecret = randomBytes(32).toString('hex');

    const ownerSecretHash = createHash('sha256')
      .update(ownerSecret)
      .digest('hex');

    const link = await this.prisma.registrationLink.create({
      data: {
        token,
        ownerSecretHash,
        maxRegistrations: 100,
      },
      select: {
        id: true,
        token: true,
        active: true,
        maxRegistrations: true,
        createdAt: true,
      },
    });

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
      throw new NotFoundException(
        'Registration link is invalid or inactive',
      );
    }

    if (link.registrations.length >= link.maxRegistrations) {
      throw new BadRequestException('Registration link is full');
    }

    return {
      message: 'Registration link is available',
      remainingSlots:
        link.maxRegistrations - link.registrations.length,
    };
  }

  // Register a participant
  async registerParticipant(
    token: string,
    name: string,
    email: string,
  ) {
    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      throw new BadRequestException('Name and email are required');
    }

    const link = await this.prisma.registrationLink.findUnique({
      where: { token },
      include: { registrations: true },
    });

    if (!link || !link.active) {
      throw new NotFoundException(
        'Registration link is invalid or inactive',
      );
    }

    if (link.registrations.length >= link.maxRegistrations) {
      throw new BadRequestException('Registration link is full');
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
      throw new BadRequestException(
        'This email is already registered',
      );
    }

    const verifiedOtp = await this.prisma.emailOtp.findFirst({
      where: {
        linkId: link.id,
        email: cleanEmail,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verifiedOtp) {
      throw new BadRequestException(
        'Please verify your email with OTP before registering',
      );
    }

    await this.prisma.emailOtp.update({
      where: { id: verifiedOtp.id },
      data: { verifiedAt: null },
    });

    await this.prisma.registration.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        linkId: link.id,
      },
    });

    await this.prisma.emailOtp.delete({
      where: { id: verifiedOtp.id },
    });

    const total = await this.prisma.registration.count({
      where: { linkId: link.id },
    });

    return {
      message: 'Registration successful',
      totalRegistrations: total,
      remainingSlots: Math.max(
        link.maxRegistrations - total,
        0,
      ),
    };
  }

  // Cancel only when both name and email match
  async cancelRegistration(
    token: string,
    name: string,
    email: string,
  ) {
    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      throw new BadRequestException(
        'Registered name and email are required',
      );
    }

    const link = await this.prisma.registrationLink.findUnique({
      where: { token },
    });

    if (!link || !link.active) {
      throw new NotFoundException(
        'Registration link is invalid or inactive',
      );
    }

    const registration = await this.prisma.registration.findFirst({
      where: {
        linkId: link.id,
        name: { equals: cleanName, mode: 'insensitive' },
        email: { equals: cleanEmail, mode: 'insensitive' },
      },
    });

    if (!registration) {
      throw new NotFoundException(
        'No registration found matching both name and email',
      );
    }

    await this.prisma.registration.delete({
      where: { id: registration.id },
    });

    const totalRegistrations =
      await this.prisma.registration.count({
        where: { linkId: link.id },
      });

    return {
      message: 'Registration cancelled successfully',
      totalRegistrations,
      remainingSlots: Math.max(
        link.maxRegistrations - totalRegistrations,
        0,
      ),
    };
  }
}