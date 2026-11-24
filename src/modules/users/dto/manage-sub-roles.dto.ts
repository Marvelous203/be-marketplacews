import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { TenantSubRole } from '../../auth/auth.types.js';

export class ManageSubRolesDto {
  @ApiProperty({
    description: 'ID người dùng thuộc tenant cần phân quyền sub-role',
    example: 'usr-tenant',
  })
  @IsString()
  @IsNotEmpty({ message: 'userId không được để trống' })
  userId: string;

  @ApiProperty({
    description: 'Sub-role cụ thể cần gán hoặc gỡ',
    enum: ['editor', 'order_manager', 'cashier', 'support'],
    example: 'editor',
  })
  @IsEnum(['editor', 'order_manager', 'cashier', 'support'], {
    message: 'Sub-role phải là một trong: editor, order_manager, cashier, support',
  })
  subRole: TenantSubRole;

  @ApiProperty({
    description: 'Hành động: grant (gán quyền) hoặc revoke (gỡ quyền)',
    enum: ['grant', 'revoke'],
    example: 'grant',
  })
  @IsEnum(['grant', 'revoke'], { message: "action phải là 'grant' hoặc 'revoke'" })
  action: 'grant' | 'revoke';
}

export class BulkSubRolesDto {
  @ApiProperty({
    description: 'ID người dùng thuộc tenant',
    example: 'usr-admin-owner',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Danh sách sub-roles mới gán đầy đủ',
    enum: ['editor', 'order_manager', 'cashier', 'support'],
    isArray: true,
    example: ['editor', 'order_manager'],
  })
  @IsOptional()
  subRoles?: TenantSubRole[];
}
