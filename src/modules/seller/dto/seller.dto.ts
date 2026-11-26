import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import type { SellerFulfillmentType } from '../seller.types.js';

export class CreateSellerListingDto {
  @ApiProperty({ example: 'Website Đặt Bàn & Thực Đơn QR Cho Quán Phở' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'cat-food' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({ example: 'Nhà hàng & Ẩm thực' })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiProperty({ example: 'Giao diện mộc mạc Phố Nghề, hỗ trợ đặt bàn realtime và xuất thực đơn QR.' })
  @IsString()
  @IsNotEmpty()
  summary!: string;

  @ApiProperty({ example: 'https://demo.phonghe.vn/pho-xua' })
  @IsUrl({ require_tld: false })
  demoUrl!: string;

  @ApiProperty({ enum: ['SOURCE_CODE', 'MANAGED_SERVICE', 'SUBSCRIPTION'], example: 'MANAGED_SERVICE' })
  @IsEnum(['SOURCE_CODE', 'MANAGED_SERVICE', 'SUBSCRIPTION'])
  fulfillmentType!: SellerFulfillmentType;

  @ApiProperty({ example: 18000000, description: 'Giá niêm yết (VND integer minor units)' })
  @IsInt()
  @Min(100000)
  priceMinor!: number;
}

export class ModerateSellerListingDto {
  @ApiProperty({ enum: ['PUBLISHED', 'REJECTED'] })
  @IsEnum(['PUBLISHED', 'REJECTED'])
  decision!: 'PUBLISHED' | 'REJECTED';

  @ApiPropertyOptional({ enum: ['title', 'demoUrl', 'priceMinor', 'summary', 'fulfillmentType'] })
  @IsOptional()
  @IsEnum(['title', 'demoUrl', 'priceMinor', 'summary', 'fulfillmentType'])
  fieldKey?: 'title' | 'demoUrl' | 'priceMinor' | 'summary' | 'fulfillmentType';

  @ApiPropertyOptional({ example: 'Link demo chưa phản hồi trên thiết bị di động, vui lòng kiểm tra lại.' })
  @IsOptional()
  @IsString()
  comment?: string;
}
