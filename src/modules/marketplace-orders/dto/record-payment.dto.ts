import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import type { OfflinePaymentMethod } from '../marketplace-orders.types.js';

export class RecordPaymentDto {
  @ApiProperty({
    description: 'Số tiền thanh toán tính bằng integer minor units (VND: 1 VND = 1 đơn vị)',
    example: 22000000,
  })
  @IsInt({ message: 'amountMinor phải là số nguyên integer' })
  @IsPositive({ message: 'amountMinor phải lớn hơn 0' })
  @Type(() => Number)
  amountMinor: number;

  @ApiProperty({
    description: 'Phương thức thanh toán ngoại tuyến',
    enum: ['BANK_TRANSFER', 'VIETQR', 'CASH', 'CREDIT_NOTE'],
    example: 'BANK_TRANSFER',
  })
  @IsEnum(['BANK_TRANSFER', 'VIETQR', 'CASH', 'CREDIT_NOTE'], {
    message: 'paymentMethod phải là BANK_TRANSFER, VIETQR, CASH hoặc CREDIT_NOTE',
  })
  paymentMethod: OfflinePaymentMethod;

  @ApiProperty({
    description: 'Mã giao dịch ngân hàng / số biên lai thu tiền',
    example: 'FT260241920842',
    required: false,
  })
  @IsOptional()
  @IsString()
  referenceCode?: string;

  @ApiProperty({
    description: 'Đường dẫn ảnh chứng từ / ủy nhiệm chi',
    example: 'https://example.com/receipts/rec-001.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiProperty({
    description: 'Ghi chú thêm về đợt thanh toán (ví dụ: Thanh toán đợt 1 - 50% khởi động dự án)',
    example: 'Thanh toán đợt 1 (50% giá trị hợp đồng)',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Tên hoặc mã định danh của nhân sự / thu ngân ghi nhận',
    example: 'Kế toán trưởng Nguyễn Thị B',
    required: false,
  })
  @IsOptional()
  @IsString()
  recordedBy?: string;

  @ApiProperty({
    description: 'Thời điểm thanh toán thực tế (ISO string)',
    example: '2026-11-24T10:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  paidAt?: string;
}
