import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  name!: string;

  @ApiProperty({ example: 'khachhang@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+84912345678' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Cửa hàng Gốm Xưa' })
  company?: string;
}

export class BudgetDto {
  @ApiPropertyOptional({ example: 10000000 })
  minMinor?: number;

  @ApiPropertyOptional({ example: 30000000 })
  maxMinor?: number;

  @ApiProperty({ example: 'VND', default: 'VND' })
  currency!: string;

  @ApiPropertyOptional({ enum: ['STRICT', 'NEGOTIABLE', 'NOT_SURE'], default: 'NEGOTIABLE' })
  flexibility?: 'STRICT' | 'NEGOTIABLE' | 'NOT_SURE';
}

export class RequirementsDto {
  @ApiPropertyOptional({ example: '5_TO_10' })
  estimatedPages?: string;

  @ApiProperty({ example: ['CMS', 'CONTACT_FORM', 'BOOKING'] })
  features!: string[];

  @ApiPropertyOptional({ example: ['EMAIL', 'ZALO'] })
  integrations?: string[];

  @ApiPropertyOptional({ example: ['https://example.com/ref'] })
  designReferenceUrls?: string[];

  @ApiPropertyOptional({ enum: ['KNOW_EXACTLY', 'NEED_CONSULTATION', 'NO_PREFERENCE'], default: 'NEED_CONSULTATION' })
  technicalConfidence?: 'KNOW_EXACTLY' | 'NEED_CONSULTATION' | 'NO_PREFERENCE';

  @ApiPropertyOptional()
  rawAnswers?: Record<string, unknown>;
}

export class ConsentDto {
  @ApiProperty({ example: '2026-11-01' })
  privacyPolicyVersion!: string;

  @ApiPropertyOptional({ default: false })
  marketingOptIn?: boolean;
}

export class CreateRequestDto {
  @ApiPropertyOptional({ example: 'a3d0d7ef-2f06-41d7-80f0-e13b157d0321' })
  relatedListingId?: string;

  @ApiPropertyOptional({ example: 'f8d3c1a2-4b5e-49c7-9a1b-3e5f7a9c1b3d' })
  relatedOfferId?: string;

  @ApiProperty({ example: 'Website cho chuỗi nhà hàng Phố Cổ' })
  title!: string;

  @ApiPropertyOptional({ example: 'food-beverage' })
  industryCategoryId?: string;

  @ApiProperty({ example: 'BUSINESS_WEBSITE' })
  solutionType!: string;

  @ApiProperty({ example: 'Giới thiệu thực đơn món ăn, đặt bàn trực tuyến và tích hợp mã QR tại bàn.' })
  goal!: string;

  @ApiProperty({ type: () => BudgetDto })
  budget!: BudgetDto;

  @ApiPropertyOptional({ example: '2027-01-15' })
  targetDate?: string;

  @ApiProperty({ type: () => RequirementsDto })
  requirements!: RequirementsDto;

  @ApiProperty({ type: () => ContactDto })
  contact!: ContactDto;

  @ApiProperty({ type: () => ConsentDto })
  consent!: ConsentDto;
}
