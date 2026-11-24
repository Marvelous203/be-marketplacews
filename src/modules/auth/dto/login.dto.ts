import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import type { UserRole } from '../auth.types.js';

export class LoginDto {
  @ApiProperty({
    description: 'Email đăng nhập của người dùng',
    example: 'superadmin@marketplace.vn',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email?: string;

  @ApiProperty({
    description: 'Mật khẩu tài khoản (mặc định cho mock account: password123)',
    example: 'password123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password?: string;

  @ApiProperty({
    description: 'Đăng nhập nhanh theo Role mock (super_admin, admin_owner, tenant, dev_freelance, guest)',
    enum: ['super_admin', 'admin_owner', 'tenant', 'dev_freelance', 'guest'],
    example: 'super_admin',
    required: false,
  })
  @IsOptional()
  @IsEnum(['super_admin', 'admin_owner', 'tenant', 'dev_freelance', 'guest'], {
    message: 'Role không hợp lệ',
  })
  role?: UserRole;
}

export class UserProfileDto {
  @ApiProperty({ example: 'usr-super-admin' })
  id: string;

  @ApiProperty({ example: 'superadmin@marketplace.vn' })
  email: string;

  @ApiProperty({ example: 'Hệ Thống Super Admin' })
  name: string;

  @ApiProperty({ enum: ['guest', 'tenant', 'dev_freelance', 'admin_owner', 'super_admin'], example: 'super_admin' })
  role: UserRole;

  @ApiProperty({ example: null, required: false })
  tenantId?: string | null;

  @ApiProperty({ example: null, required: false })
  websiteName?: string | null;

  @ApiProperty({ example: null, required: false })
  websiteDomain?: string | null;

  @ApiProperty({ example: [], isArray: true })
  subRoles: string[];

  @ApiProperty({ example: true })
  isActive: boolean;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: 86400 })
  expiresIn: number;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
