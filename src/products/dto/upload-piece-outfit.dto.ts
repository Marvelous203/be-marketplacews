import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export type PieceType = 'top' | 'bottom' | 'dress' | 'shoes' | 'acc';
export const VALID_PIECE_TYPES: PieceType[] = ['top', 'bottom', 'dress', 'shoes', 'acc'];

export const PIECE_Z_INDEX_MAP: Record<PieceType, number> = {
  top: 30,
  bottom: 20,
  dress: 25,
  shoes: 50,
  acc: 60,
};

export class UploadPieceDto {
  @ApiProperty({ description: 'Name of the individual piece', example: 'Ribbed Crop Tank' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type of clothing piece',
    enum: ['top', 'bottom', 'dress', 'shoes', 'acc'],
    example: 'top',
  })
  @IsEnum(['top', 'bottom', 'dress', 'shoes', 'acc'])
  type: PieceType;

  @ApiProperty({ description: 'Price in VND', example: 950000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceVND: number;

  @ApiProperty({ description: 'Color description', example: 'Charcoal', required: false })
  @IsOptional()
  @IsString()
  color?: string;
}

export class PieceResponseDto {
  @ApiProperty({ example: 'piece-8f1c997e' })
  id: string;

  @ApiProperty({ example: 'Ribbed Crop Tank' })
  name: string;

  @ApiProperty({ enum: ['top', 'bottom', 'dress', 'shoes', 'acc'], example: 'top' })
  type: PieceType;

  @ApiProperty({ example: '/uploads/thumb-3357fc7c.png' })
  thumbnailUrl: string;

  @ApiProperty({ example: '/uploads/layer-3357fc7c.png' })
  layerUrl: string;

  @ApiProperty({ example: 30 })
  zIndex: number;

  @ApiProperty({ example: 950000 })
  priceVND: number;

  @ApiProperty({ example: 'Charcoal', required: false })
  color?: string;

  @ApiProperty({ example: '2026-11-13T12:00:00.000Z' })
  createdAt: string;
}

export class UploadOutfitDto {
  @ApiProperty({ description: 'Name of the outfit set', example: 'Denim Chic Look' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Array of piece IDs included in this outfit preset',
    type: [String],
    example: ['piece-0-top', 'piece-0-bot', 'piece-0-sho'],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [value];
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  pieceIds: string[];

  @ApiProperty({
    description: 'Bundle discount percentage for wearing/buying the entire set',
    example: 15,
    required: false,
    default: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPercent?: number = 15;
}

export class OutfitResponseDto {
  @ApiProperty({ example: 'outfit-5a3d1b7e' })
  id: string;

  @ApiProperty({ example: 'Denim Chic Look' })
  name: string;

  @ApiProperty({ example: '/uploads/outfit-thumb-5a3d1b7e.png' })
  thumbnailUrl: string;

  @ApiProperty({ type: [String], example: ['piece-0-top', 'piece-0-bot', 'piece-0-sho'] })
  pieceIds: string[];

  @ApiProperty({ example: 15 })
  discountPercent: number;

  @ApiProperty({ example: '2026-11-13T12:00:00.000Z' })
  createdAt: string;
}
