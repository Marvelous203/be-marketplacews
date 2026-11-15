import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum LayerCategory {
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  DRESS = 'DRESS',
  OUTERWEAR = 'OUTERWEAR',
  SHOES = 'SHOES',
  ACCESSORY = 'ACCESSORY',
}

export const CATEGORY_Z_INDEX_MAP: Record<LayerCategory, number> = {
  [LayerCategory.TOP]: 30,
  [LayerCategory.BOTTOM]: 20,
  [LayerCategory.DRESS]: 25,
  [LayerCategory.OUTERWEAR]: 40,
  [LayerCategory.SHOES]: 50,
  [LayerCategory.ACCESSORY]: 60,
};

export class CreateProductLayerDto {
  @ApiProperty({ description: 'Product name', example: 'Ribbed Crop Tank' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Product category layer',
    enum: LayerCategory,
    example: LayerCategory.TOP,
  })
  @IsEnum(LayerCategory)
  category: LayerCategory;

  @ApiProperty({
    description: 'Layer Z-Index (TOP=30, BOTTOM=20, DRESS=25, OUTERWEAR=40, SHOES=50, ACCESSORY=60)',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  layerZIndex?: number;

  @ApiProperty({ description: 'Price in VND', example: 950000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceVND: number;

  @ApiProperty({ description: 'Color description', example: 'Charcoal', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Categories to automatically exclude when this product is equipped',
    enum: LayerCategory,
    isArray: true,
    required: false,
    example: [LayerCategory.DRESS],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return value.split(',').map((s) => s.trim());
      }
      return [value];
    }
    return value;
  })
  @IsArray()
  @IsEnum(LayerCategory, { each: true })
  excludes?: LayerCategory[];
}

export class ProductLayerResponseDto {
  @ApiProperty({ example: 'layer-prod-8a2b3c4d' })
  id: string;

  @ApiProperty({ example: 'Ribbed Crop Tank' })
  name: string;

  @ApiProperty({ enum: LayerCategory, example: LayerCategory.TOP })
  category: LayerCategory;

  @ApiProperty({ example: 30 })
  layerZIndex: number;

  @ApiProperty({ example: 950000 })
  priceVND: number;

  @ApiProperty({ example: 'Charcoal', required: false })
  color?: string;

  @ApiProperty({ enum: LayerCategory, isArray: true, example: ['DRESS'] })
  excludes: LayerCategory[];

  @ApiProperty({ example: '/uploads/images/layer-prod-1.png' })
  imageUrl: string;

  @ApiProperty({ example: '/uploads/thumbnails/layer-prod-1-thumb.png' })
  thumbnailUrl: string;

  @ApiProperty({ example: '2026-11-13T04:40:00.000Z' })
  createdAt: string;
}
