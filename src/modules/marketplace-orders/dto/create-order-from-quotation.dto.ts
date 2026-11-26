import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateOrderFromQuotationDto {
  @ApiProperty({
    description: 'Số điện thoại khách hàng cập nhật khi lên đơn',
    example: '0912345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({
    description: 'Ghi chú đơn hàng của khách',
    example: 'Cần bàn giao sớm trước ngày 15 tháng tới',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
