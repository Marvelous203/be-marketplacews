import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { OrderStatus, PaymentStatus } from '../marketplace-orders.types.js';

export class QueryOrdersDto {
  @ApiProperty({
    description: 'Lọc theo trạng thái đơn hàng',
    enum: ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'CANCELLED'])
  status?: OrderStatus;

  @ApiProperty({
    description: 'Lọc theo trạng thái thanh toán',
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'])
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    description: 'Tìm kiếm theo mã đơn (ORD-XXXX), tên khách hàng hoặc email',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Trang hiện tại (1-based)', example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ description: 'Số lượng mục trên mỗi trang', example: 20, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
