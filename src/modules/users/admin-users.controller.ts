import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { PromoteOwnerDto } from './dto/promote-owner.dto.js';
import { ManageSubRolesDto } from './dto/manage-sub-roles.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';
import { UserProfileDto } from '../auth/dto/login.dto.js';

@ApiTags('Admin Users & Tenant Roles Management')
@Controller('v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @Roles('super_admin', 'admin_owner')
  @ApiOperation({
    summary: 'Admin: Danh sách tất cả người dùng trong hệ thống kèm vai trò và thông tin Tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách người dùng',
    type: [UserProfileDto],
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền truy cập (Yêu cầu super_admin hoặc admin_owner)' })
  getAllUsers(): UserProfileDto[] {
    return this.usersService.getAllUsers();
  }

  @Get('users/:id')
  @Roles('super_admin', 'admin_owner')
  @ApiOperation({
    summary: 'Admin: Chi tiết một người dùng cụ thể',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng', example: 'usr-tenant' })
  @ApiResponse({ status: 200, description: 'Chi tiết người dùng', type: UserProfileDto })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  getUserById(@Param('id') id: string): UserProfileDto {
    return this.usersService.getUserById(id);
  }

  @Post('users/:id/promote-owner')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Super Admin: Thăng cấp tài khoản Tenant thành Admin Owner của một Website/Tenant đã bàn giao',
    description:
      'Gán tenantId, websiteName, websiteDomain và các quyền quản trị cơ bản (editor, order_manager, cashier) cho người dùng.',
  })
  @ApiParam({ name: 'id', description: 'ID người dùng cần thăng cấp', example: 'usr-tenant' })
  @ApiResponse({
    status: 200,
    description: 'Thăng cấp thành công thành admin_owner',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc tài khoản không thể thăng cấp' })
  @ApiResponse({ status: 403, description: 'Chỉ Super Admin mới có quyền thực hiện hành động này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  promoteOwner(
    @Param('id') id: string,
    @Body() dto: PromoteOwnerDto,
  ): UserProfileDto {
    return this.usersService.promoteToOwner(id, dto);
  }

  @Post('tenants/:tenantId/sub-roles')
  @Roles('super_admin', 'admin_owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin: Gán hoặc gỡ sub_role cho nhân viên của Website/Tenant (editor, order_manager, cashier, support)',
  })
  @ApiParam({ name: 'tenantId', description: 'Mã định danh Tenant', example: 'tenant-boutique-001' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật sub-roles thành công',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không đủ quyền quản trị tenant' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  manageSubRoles(
    @Param('tenantId') tenantId: string,
    @Body() dto: ManageSubRolesDto,
  ): UserProfileDto {
    return this.usersService.manageTenantSubRoles(tenantId, dto);
  }
}
