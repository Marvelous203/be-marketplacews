import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL';
export const VALID_SIZES: ProductSize[] = ['XS', 'S', 'M', 'L', 'XL'];

export type PaymentMethod = 'cod' | 'qr_bank' | 'vnpay' | 'momo' | 'zalopay';
export const VALID_PAYMENT_METHODS: PaymentMethod[] = ['cod', 'qr_bank', 'vnpay', 'momo', 'zalopay'];

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 'prod-0-top-0' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantity', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ description: 'Selected size', example: 'M', enum: VALID_SIZES })
  @IsEnum(VALID_SIZES, { message: 'Size must be XS, S, M, L, or XL' })
  size: ProductSize;

  @ApiProperty({ description: 'Selected color', example: 'Charcoal' })
  @IsString()
  @IsNotEmpty()
  color: string;
}

export class ShippingAddressDto {
  @ApiProperty({ description: 'Recipient full name', example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Recipient phone number', example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Street address', example: '123 Đường Lê Lợi, Phường Bến Nghé' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'District / City', example: 'Quận 1' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Province / City', example: 'Hồ Chí Minh' })
  @IsString()
  @IsNotEmpty()
  province: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'List of order items', type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Payment method',
    example: 'cod',
    enum: VALID_PAYMENT_METHODS,
  })
  @IsEnum(VALID_PAYMENT_METHODS, {
    message: 'Payment method must be one of: cod, qr_bank, vnpay, momo, zalopay',
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Shipping address details', type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ description: 'Coupon code', example: 'VELL10', required: false })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
