import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { OrderStatus } from '../marketplace-orders.types.js';

export class TransitionOrderStatusDto {
  @ApiProperty({
    description: 'Trạng thái đích cần chuyển sang',
    enum: ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'CANCELLED'],
    example: 'PROCESSING',
  })
  @IsEnum(['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'COMPLETED', 'CANCELLED'], {
    message: 'Trạng thái đơn hàng không hợp lệ',
  })
  toStatus: OrderStatus;

  @ApiProperty({
    description: 'Lý do hoặc ghi chú chuyển trạng thái',
    example: 'Đã nhận đủ thanh toán đợt 1, chuyển giao cho kỹ thuật bắt đầu dựng web',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Người thực hiện chuyển trạng thái (Admin, Staff, Kỹ thuật)',
    example: 'Admin Kỹ Thuật Trần C',
    required: false,
  })
  @IsOptional()
  @IsString()
  actor?: string;
}
