import { ApiProperty } from '@nestjs/swagger';

export class OrderResponseDto {
  @ApiProperty({ description: 'Unique order identifier', example: 'vell-ord-1700000000-a1b2' })
  orderId: string;

  @ApiProperty({ description: 'Order status', example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Subtotal before discount and shipping (VND)', example: 950000 })
  subtotalVND: number;

  @ApiProperty({ description: 'Discount applied (VND)', example: 95000 })
  discountVND: number;

  @ApiProperty({ description: 'Estimated shipping fee (VND)', example: 30000 })
  estimatedShippingVND: number;

  @ApiProperty({ description: 'Final total payable (VND)', example: 885000 })
  totalVND: number;

  @ApiProperty({ description: 'Chosen payment method', example: 'cod' })
  paymentMethod: string;

  @ApiProperty({ description: 'ISO 8601 creation timestamp', example: '2026-11-13T03:52:11.000Z' })
  createdAt: string;
}
