import { ApiProperty } from '@nestjs/swagger';

export class ProductVariantDto {
  @ApiProperty({ example: 'M', enum: ['XS', 'S', 'M', 'L', 'XL'] })
  size: string;

  @ApiProperty({ example: 'Charcoal' })
  color: string;

  @ApiProperty({ example: 10 })
  stock: number;

  @ApiProperty({ example: 'TOP-01-M-CHR' })
  sku: string;
}

export class SizeGuideDto {
  @ApiProperty({ example: '≤155cm' })
  XS: string;

  @ApiProperty({ example: '156-162cm' })
  S: string;

  @ApiProperty({ example: '163-168cm' })
  M: string;

  @ApiProperty({ example: '169-174cm' })
  L: string;

  @ApiProperty({ example: '≥175cm' })
  XL: string;
}

export class ProductDto {
  @ApiProperty({ example: 'prod-top-00-0' })
  id: string;

  @ApiProperty({ example: 0 })
  lookId: number;

  @ApiProperty({ example: 'tops', enum: ['tops', 'bottoms', 'full', 'shoes', 'acc'] })
  category: string;

  @ApiProperty({ example: 'Ribbed crop tank' })
  name: string;

  @ApiProperty({ example: 950000 })
  priceVND: number;

  @ApiProperty({ type: [ProductVariantDto] })
  variants: ProductVariantDto[];

  @ApiProperty({ type: SizeGuideDto })
  sizeGuide: SizeGuideDto;
}

export class ProductsListResponseDto {
  @ApiProperty({ type: [ProductDto] })
  data: ProductDto[];

  @ApiProperty({ example: { total: 20, page: 1, limit: 20 } })
  meta: { total: number; page: number; limit: number };
}
