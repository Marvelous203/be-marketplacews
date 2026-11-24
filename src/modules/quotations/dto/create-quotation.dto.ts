import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuotationLineDto {
  @ApiProperty({ enum: ['SERVICE', 'LICENSE', 'HOSTING', 'MAINTENANCE'], example: 'SERVICE' })
  lineType!: 'SERVICE' | 'LICENSE' | 'HOSTING' | 'MAINTENANCE';

  @ApiProperty({ example: 'Phát triển website đặt món & menu QR chuẩn Phố Nghề' })
  description!: string;

  @ApiProperty({ example: 1, default: 1 })
  quantity!: number;

  @ApiProperty({ example: 'GÓI', default: 'GÓI' })
  unit!: string;

  @ApiProperty({ example: 18000000, description: 'Đơn giá dạng integer minor units (VND)' })
  unitPriceMinor!: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  discountMinor?: number;

  @ApiPropertyOptional({ example: 'STANDARD' })
  taxCode?: string;
}

export class QuotationScopeDto {
  @ApiProperty({ example: ['Giao diện responsive đa thiết bị', 'Hệ thống quản trị thực đơn CMS', 'Tích hợp mã QR bàn'] })
  deliverables!: string[];

  @ApiProperty({ example: ['Thiết kế theo nhận diện Phố Nghề', 'Hỗ trợ cấu hình tên miền và máy chủ 12 tháng'] })
  included!: string[];

  @ApiProperty({ example: ['Phí cổng thanh toán bên thứ ba', 'Nội dung bài viết tự nhập'] })
  excluded!: string[];

  @ApiPropertyOptional({ example: ['Khách hàng cung cấp hình ảnh món ăn và logo gốc'] })
  assumptions?: string[];
}

export class PaymentScheduleItemDto {
  @ApiProperty({ example: 'Đặt cọc khởi động dự án' })
  label!: string;

  @ApiProperty({ example: 50, description: 'Phần trăm' })
  percent!: number;
}

export class QuotationTermsDto {
  @ApiProperty({ type: () => [PaymentScheduleItemDto] })
  paymentSchedule!: PaymentScheduleItemDto[];

  @ApiProperty({ example: 30, description: 'Số ngày bảo hành' })
  warrantyDays!: number;

  @ApiProperty({ example: 'Hỗ trợ kỹ thuật 24/7 trong suốt thời gian bảo hành và vận hành' })
  supportSummary!: string;

  @ApiPropertyOptional({ example: 'QUOTE-TERMS-1.0', default: 'QUOTE-TERMS-1.0' })
  termsVersion?: string;
}

export class CreateQuotationDto {
  @ApiProperty({ example: 'req-001-phoco' })
  quoteRequestId!: string;

  @ApiProperty({ example: 'org-platform-studio' })
  sellerOrganizationId!: string;

  @ApiPropertyOptional({ example: 'Platform Studio & Nghệ Nhân Web' })
  sellerName?: string;

  @ApiProperty({ example: 'VND', default: 'VND' })
  currency!: string;

  @ApiProperty({ example: '2026-12-15T23:59:59Z' })
  validUntil!: string;

  @ApiProperty({ type: () => QuotationScopeDto })
  scope!: QuotationScopeDto;

  @ApiProperty({ type: () => QuotationTermsDto })
  terms!: QuotationTermsDto;

  @ApiProperty({ type: () => [QuotationLineDto] })
  lines!: QuotationLineDto[];
}
