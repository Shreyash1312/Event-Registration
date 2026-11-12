
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Razorpay from 'razorpay';
import {
  createHmac,
  timingSafeEqual,
} from 'crypto';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;
  private amount: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const keyId = this.config.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.config.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are missing');
    }

    this.amount = Number(
      this.config.get<string>('RAZORPAY_AMOUNT') || 10000,
    );

    if (!Number.isInteger(this.amount) || this.amount <= 0) {
      throw new Error('Invalid Razorpay amount');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  // Create Razorpay order
  async createOrder(
    token: string,
    name: string,
    email: string,
  ) {
    const cleanName = name?.trim();
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      throw new BadRequestException(
        'Name and email are required',
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
        'Please verify your email with OTP first',
      );
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

    const now = new Date();

    // Reuse an existing unexpired pending order
    const pending = await this.prisma.payment.findFirst({
      where: {
        linkId: link.id,
        email: cleanEmail,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });

    if (pending) {
      return {
        orderId: pending.orderId,
        amount: pending.amount,
        currency: pending.currency,
        keyId: this.config.get<string>('RAZORPAY_KEY_ID'),
      };
    }

    const order = await this.razorpay.orders.create({
      amount: this.amount,
      currency: 'INR',
      receipt: `reg_${Date.now()}`,
      notes: {
        linkId: link.id,
        email: cleanEmail,
      },
    });

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    // Count successful registrations and active pending orders
    await this.prisma.$transaction(
      async (tx) => {
        const currentLink =
          await tx.registrationLink.findUnique({
            where: { id: link.id },
          });

        if (!currentLink || !currentLink.active) {
          throw new BadRequestException(
            'Registration link is inactive',
          );
        }

        const registered =
          await tx.registration.count({
            where: { linkId: link.id },
          });

        const reserved =
          await tx.payment.count({
            where: {
              linkId: link.id,
              status: 'PENDING',
              expiresAt: { gt: now },
            },
          });

        if (
          registered + reserved >=
          currentLink.maxRegistrations
        ) {
          throw new BadRequestException(
            'Registration link is full',
          );
        }

        await tx.payment.create({
          data: {
            linkId: link.id,
            name: cleanName,
            email: cleanEmail,
            orderId: order.id,
            amount: this.amount,
            currency: 'INR',
            status: 'PENDING',
            expiresAt,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    return {
      orderId: order.id,
      amount: this.amount,
      currency: 'INR',
      keyId: this.config.get<string>('RAZORPAY_KEY_ID'),
    };
  }

  // Verify payment and confirm registration
  async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
  ) {
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      throw new BadRequestException(
        'Payment verification details are required',
      );
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: razorpay_order_id },
      include: { link: true },
    });

    if (!payment) {
      throw new NotFoundException(
        'Payment order not found',
      );
    }

    if (payment.status === 'SUCCESS') {
      if (payment.paymentId !== razorpay_payment_id) {
        throw new BadRequestException(
          'Payment ID does not match',
        );
      }

      return { message: 'Registration already confirmed' };
    }

    if (
      payment.status !== 'PENDING' ||
      payment.expiresAt <= new Date() ||
      !payment.link.active
    ) {
      throw new BadRequestException(
        'Payment order has expired or registration link is inactive',
      );
    }

    if (
      payment.paymentId &&
      payment.paymentId !== razorpay_payment_id
    ) {
      throw new BadRequestException(
        'Payment ID does not match',
      );
    }

    const secret =
      this.config.get<string>('RAZORPAY_KEY_SECRET')!;

    const expectedSignature = createHmac(
      'sha256',
      secret,
    )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`,
      )
      .digest('hex');

    const expected = Buffer.from(
      expectedSignature,
      'hex',
    );
    const received = Buffer.from(
      razorpay_signature,
      'hex',
    );

    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new BadRequestException(
        'Invalid payment signature',
      );
    }

    // Confirm the payment directly with Razorpay
    let razorpayPayment =
      await this.razorpay.payments.fetch(
        razorpay_payment_id,
      );

    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      Number(razorpayPayment.amount) !== payment.amount ||
      razorpayPayment.currency !== payment.currency
    ) {
      throw new BadRequestException(
        'Payment details do not match the order',
      );
    }

    // Capture an authorized payment if automatic capture
    // has not already captured it.
    if (razorpayPayment.status === 'authorized') {
      razorpayPayment =
        await this.razorpay.payments.capture(
          razorpay_payment_id,
          payment.amount,
          payment.currency,
        );
    }

    if (razorpayPayment.status !== 'captured') {
      throw new BadRequestException(
        'Payment is not captured successfully',
      );
    }

    // Confirm registration in the database
    await this.prisma.$transaction(
      async (tx) => {
        const currentPayment =
          await tx.payment.findUnique({
            where: { orderId: razorpay_order_id },
          });

        if (!currentPayment) {
          throw new NotFoundException(
            'Payment record not found',
          );
        }

        if (currentPayment.status === 'SUCCESS') {
          if (
            currentPayment.paymentId !==
            razorpay_payment_id
          ) {
            throw new BadRequestException(
              'Payment ID does not match',
            );
          }
          return;
        }

        if (
          currentPayment.status !== 'PENDING' ||
          currentPayment.expiresAt <= new Date()
        ) {
          throw new BadRequestException(
            'Payment order has expired',
          );
        }

        const existing =
          await tx.registration.findUnique({
            where: {
              linkId_email: {
                linkId: payment.linkId,
                email: payment.email,
              },
            },
          });

        if (existing) {
          throw new BadRequestException(
            'This email is already registered',
          );
        }

        const registered =
          await tx.registration.count({
            where: { linkId: payment.linkId },
          });

        if (registered >= payment.link.maxRegistrations) {
          throw new BadRequestException(
            'Registration limit reached',
          );
        }

        await tx.registration.create({
          data: {
            name: payment.name,
            email: payment.email,
            linkId: payment.linkId,
          },
        });

        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentId: razorpay_payment_id,
            status: 'SUCCESS',
          },
        });

        await tx.emailOtp.deleteMany({
          where: {
            linkId: payment.linkId,
            email: payment.email,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    return {
      message: 'Payment successful and registration confirmed',
      paymentId: razorpay_payment_id,
    };
  }
}
