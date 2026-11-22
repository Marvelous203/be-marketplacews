import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
} from 'class-validator';
import {
  FulfillmentType,
  PricingModel,
  BillingInterval,
  OfferStatus,
} from '../catalog.types.js';

export class DeliveryScopeDto {
  @ApiProperty({ example: ['Giao diện responsive', 'Bàn giao source code Next.js'] })
  @IsArray()
  included: string[];

  @ApiProperty({ example: ['Hosting cao cấp', 'Viết bài chuẩn SEO'] })
  @IsArray()
  excluded: string[];

  @ApiProperty({ example: ['Toàn bộ source code repository', 'File hướng dẫn README'] })
  @IsArray()
  deliverables: string[];
}

export class OfferPriceResponseDto {
  @ApiProperty({ example: 'VND' })
  currency: string;

  @ApiProperty({ example: 3500000, description: 'Integer minor units (VND: đồng)' })
  amountMinor: number;

  @ApiProperty({ example: '3.500.000 ₫' })
  formattedPrice: string;

  @ApiProperty({ enum: BillingInterval, example: BillingInterval.ONE_TIME })
  billingInterval: BillingInterval;
}

export class OfferResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'SOURCE_LICENSE' })
  code: string;

  @ApiProperty({ example: 'Bản quyền Mã nguồn' })
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: FulfillmentType })
  fulfillmentType: FulfillmentType;

  @ApiProperty({ enum: PricingModel })
  pricingModel: PricingModel;

  @ApiProperty({ enum: OfferStatus })
  status: OfferStatus;

  @ApiProperty()
  requiresConsultation: boolean;

  @ApiPropertyOptional()
  licenseSummary?: string;

  @ApiProperty({ type: DeliveryScopeDto })
  deliveryScope: DeliveryScopeDto;

  @ApiPropertyOptional({ enum: BillingInterval })
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({ type: OfferPriceResponseDto })
  price?: OfferPriceResponseDto;
}

export class CreateOfferDto {
  @ApiProperty({ example: 'SOURCE_LICENSE' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Bản quyền Mã nguồn (Source Code)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Khách hàng nhận full source code Next.js và hướng dẫn tự triển khai.' })
  @IsString()
  description: string;

  @ApiProperty({ enum: FulfillmentType })
  @IsEnum(FulfillmentType)
  fulfillmentType: FulfillmentType;

  @ApiProperty({ enum: PricingModel })
  @IsEnum(PricingModel)
  pricingModel: PricingModel;

  @ApiPropertyOptional({ example: 3500000, description: 'Số tiền integer minor unit' })
  @IsInt()
  @IsOptional()
  amountMinor?: number;

  @ApiPropertyOptional({ default: 'VND' })
  @IsString()
  @IsOptional()
  currency?: string = 'VND';

  @ApiPropertyOptional({ enum: BillingInterval })
  @IsEnum(BillingInterval)
  @IsOptional()
  billingInterval?: BillingInterval;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requiresConsultation?: boolean = false;

  @ApiPropertyOptional({ example: 'Single Domain Standard Commercial License' })
  @IsString()
  @IsOptional()
  licenseSummary?: string;

  @ApiPropertyOptional({ type: DeliveryScopeDto })
  @IsOptional()
  deliveryScope?: DeliveryScopeDto;
}
