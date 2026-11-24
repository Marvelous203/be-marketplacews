import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TenantSubRole } from '../../auth/auth.types.js';

export class PromoteOwnerDto {
  @ApiProperty({
    description: 'Mã định danh Tenant của website (ví dụ: tenant-cosmetics-003)',
    example: 'tenant-cosmetics-003',
  })
  @IsString()
  @IsNotEmpty({ message: 'tenantId không được để trống' })
  tenantId: string;

  @ApiProperty({
    description: 'Tên thương hiệu / website được bàn giao',
    example: 'Hana Cosmetics Online',
  })
  @IsString()
  @IsNotEmpty({ message: 'websiteName không được để trống' })
  websiteName: string;

  @ApiProperty({
    description: 'Tên miền website đã kích hoạt',
    example: 'hanacosmetics.vn',
  })
  @IsString()
  @IsNotEmpty({ message: 'websiteDomain không được để trống' })
  websiteDomain: string;

  @ApiProperty({
    description: 'Các sub-roles ban đầu gán cho admin owner',
    enum: ['editor', 'order_manager', 'cashier', 'support'],
    isArray: true,
    required: false,
    example: ['editor', 'order_manager', 'cashier'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(['editor', 'order_manager', 'cashier', 'support'], { each: true })
  initialSubRoles?: TenantSubRole[];
}
