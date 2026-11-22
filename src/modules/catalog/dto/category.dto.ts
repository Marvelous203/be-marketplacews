import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  iconKey?: string;

  @ApiPropertyOptional()
  parentId?: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  children?: CategoryDto[];
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Nhà hàng & Ẩm thực' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'food-beverage' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Mẫu website cho quán cafe, nhà hàng tiệc cưới' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'utensils' })
  @IsString()
  @IsOptional()
  iconKey?: string;

  @ApiPropertyOptional({ example: null })
  @IsString()
  @IsOptional()
  parentId?: string | null;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number = 0;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  iconKey?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
