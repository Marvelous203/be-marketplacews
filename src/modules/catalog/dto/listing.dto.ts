import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ListingKind,
  ListingStatus,
  FulfillmentType,
  PricingModel,
  SellerType,
} from '../catalog.types.js';
import { CategoryDto } from './category.dto.js';
import { TagDto } from './tag.dto.js';
import { OfferResponseDto, CreateOfferDto } from './offer.dto.js';
import { ListingFeatureValueDto } from './feature.dto.js';

export class ListingMediaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' })
  url: string;

  @ApiProperty({ example: 'Ảnh xem trước trang chủ' })
  altText: string;

  @ApiProperty({ enum: ['IMAGE', 'VIDEO'], example: 'IMAGE' })
  mediaType: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;
}

export class PriceSummaryDto {
  @ApiProperty({ example: 'Từ' })
  label: string;

  @ApiProperty({ example: 3500000 })
  amountMinor: number;

  @ApiProperty({ example: '3.500.000 ₫' })
  formattedPrice: string;

  @ApiProperty({ example: 'VND' })
  currency: string;
}

export class ListingSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'restaurant-pro' })
  slug: string;

  @ApiProperty({ example: 'Restaurant Pro — Mẫu Website Nhà hàng & Đặt bàn' })
  title: string;

  @ApiProperty({ example: 'Giải pháp website tối ưu cho nhà hàng, quán ăn, tích hợp đặt bàn và menu điện tử.' })
  shortDescription: string;

  @ApiProperty({ enum: ListingKind })
  listingKind: ListingKind;

  @ApiProperty({ enum: ListingStatus })
  status: ListingStatus;

  @ApiProperty({ type: CategoryDto })
  category: CategoryDto;

  @ApiProperty({ example: { id: 'plat-1', name: 'Platform Official', slug: 'platform', sellerType: SellerType.PLATFORM } })
  seller: { id: string; name: string; slug: string; sellerType: SellerType };

  @ApiProperty({ type: ListingMediaDto, nullable: true })
  coverImage?: ListingMediaDto | null;

  @ApiProperty({ type: [TagDto] })
  tags: TagDto[];

  @ApiProperty({ enum: FulfillmentType, isArray: true })
  availableFulfillmentTypes: FulfillmentType[];

  @ApiPropertyOptional({ type: PriceSummaryDto })
  priceSummary?: PriceSummaryDto;

  @ApiProperty()
  featured: boolean;
}

export class ListingDetailDto extends ListingSummaryDto {
  @ApiProperty({ example: '<p>Chi tiết giải pháp website nhà hàng cao cấp...</p>' })
  description: string;

  @ApiPropertyOptional({ example: 'https://demo.restaurant-pro.example.com' })
  demoUrl?: string;

  @ApiProperty({ enum: ['EXTERNAL_LINK', 'APPROVED_EMBED', 'SCREENSHOTS'] })
  previewMode: string;

  @ApiProperty({ type: [ListingMediaDto] })
  gallery: ListingMediaDto[];

  @ApiProperty({ type: [ListingFeatureValueDto] })
  features: ListingFeatureValueDto[];

  @ApiProperty({ type: [OfferResponseDto] })
  offers: OfferResponseDto[];

  @ApiPropertyOptional()
  publishedAt?: string;
}

export class ListingFilterQueryDto {
  @ApiPropertyOptional({ example: 'food-beverage', description: 'Category slug' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'nextjs', description: 'Tag slug' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ enum: FulfillmentType })
  @IsEnum(FulfillmentType)
  @IsOptional()
  fulfillment?: FulfillmentType;

  @ApiPropertyOptional({ enum: PricingModel })
  @IsEnum(PricingModel)
  @IsOptional()
  pricing?: PricingModel;

  @ApiPropertyOptional({ example: 'nhà hàng', description: 'Tìm kiếm theo từ khóa' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 24;
}

export class CreateListingDto {
  @ApiProperty({ example: 'Restaurant Pro — Mẫu Website Nhà hàng' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'restaurant-pro' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Giải pháp website tối ưu cho nhà hàng...' })
  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @ApiProperty({ example: '<p>Mô tả chi tiết giải pháp...</p>' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'food-beverage' })
  @IsString()
  @IsNotEmpty()
  categorySlug: string;

  @ApiProperty({ enum: ListingKind, default: ListingKind.BUSINESS_WEBSITE })
  @IsEnum(ListingKind)
  listingKind: ListingKind;

  @ApiPropertyOptional({ example: 'https://demo.example.com' })
  @IsString()
  @IsOptional()
  demoUrl?: string;

  @ApiPropertyOptional({ type: [CreateOfferDto] })
  @IsArray()
  @IsOptional()
  offers?: CreateOfferDto[];
}

export class SuspendListingDto {
  @ApiProperty({ example: 'Phát hiện khiếu nại bản quyền hình ảnh.' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
