import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { User, TenantSubRole } from '../auth/auth.types.js';
import { PromoteOwnerDto } from './dto/promote-owner.dto.js';
import { ManageSubRolesDto } from './dto/manage-sub-roles.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly authService: AuthService) {}

  getAllUsers(): Omit<User, 'passwordHash'>[] {
    const users = this.authService.getAllUsers();
    return users.map(({ passwordHash: _, ...safeUser }) => safeUser);
  }

  getUserById(id: string): Omit<User, 'passwordHash'> {
    const user = this.authService.getUserById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Thăng cấp tài khoản (thường là tenant) lên admin_owner quản trị website riêng.
   * Chỉ super_admin mới có quyền gọi hàm này.
   */
  promoteToOwner(userId: string, dto: PromoteOwnerDto): Omit<User, 'passwordHash'> {
    const user = this.authService.getUserById(userId);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${userId}`);
    }

    if (user.role === 'super_admin') {
      throw new BadRequestException('Không thể hạ cấp hoặc thay đổi vai trò của Super Admin');
    }

    const initialSubRoles: TenantSubRole[] =
      dto.initialSubRoles && dto.initialSubRoles.length > 0
        ? dto.initialSubRoles
        : ['editor', 'order_manager', 'cashier'];

    const updated = this.authService.updateUser(userId, {
      role: 'admin_owner',
      tenantId: dto.tenantId,
      websiteName: dto.websiteName,
      websiteDomain: dto.websiteDomain,
      subRoles: initialSubRoles,
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  /**
   * Gán hoặc gỡ sub_role cho nhân sự thuộc một tenant cụ thể.
   */
  manageTenantSubRoles(tenantId: string, dto: ManageSubRolesDto): Omit<User, 'passwordHash'> {
    const user = this.authService.getUserById(dto.userId);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${dto.userId}`);
    }

    if (user.tenantId && user.tenantId !== tenantId) {
      throw new BadRequestException(
        `Người dùng ID '${dto.userId}' thuộc tenant '${user.tenantId}', không khớp với tenant '${tenantId}'`,
      );
    }

    let subRoles = [...(user.subRoles || [])];

    if (dto.action === 'grant') {
      if (!subRoles.includes(dto.subRole)) {
        subRoles.push(dto.subRole);
      }
    } else if (dto.action === 'revoke') {
      subRoles = subRoles.filter((r) => r !== dto.subRole);
    }

    const updated = this.authService.updateUser(dto.userId, {
      tenantId: user.tenantId || tenantId,
      subRoles,
    });

    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }
}
