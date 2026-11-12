
import {
  Controller,
  Post,
  Param,
  Body,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  // Create payment order
  @Post(':token/create-order')
  createOrder(
    @Param('token') token: string,
    @Body()
    body: {
      name: string;
      email: string;
    },
  ) {
    return this.paymentsService.createOrder(
      token,
      body.name,
      body.email,
    );
  }

  // Verify payment
  @Post('verify')
  verifyPayment(
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.paymentsService.verifyPayment(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
    );
  }
}
