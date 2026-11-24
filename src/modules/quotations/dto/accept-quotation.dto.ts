import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptQuotationDto {
  @ApiProperty({ example: 'qv-001' })
  quotationVersionId!: string;

  @ApiProperty({ example: 'Trần Đình Trọng' })
  acceptanceName!: string;

  @ApiPropertyOptional({ example: 'Tôi đồng ý với phạm vi công việc và tiến độ thanh toán nêu trên.' })
  acceptanceNote?: string;

  @ApiPropertyOptional({ example: 'QUOTE-TERMS-1.0', default: 'QUOTE-TERMS-1.0' })
  termsVersion?: string;
}

export class RejectQuotationDto {
  @ApiProperty({ example: 'qv-001' })
  quotationVersionId!: string;

  @ApiProperty({ example: 'Ngân sách vượt quá dự kiến ban đầu của chúng tôi.' })
  rejectionReason!: string;
}
