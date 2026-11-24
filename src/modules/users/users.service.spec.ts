import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('UsersService (Admin User Management & Tenant Promotion)', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(() => {
    authService = new AuthService();
    authService.resetMockUsers();
    usersService = new UsersService(authService);
  });

  describe('Lấy danh sách người dùng', () => {
    it('trả về danh sách người dùng an toàn, không chứa trường passwordHash', () => {
      const users = usersService.getAllUsers();
      expect(users.length).toBeGreaterThanOrEqual(5);

      for (const u of users) {
        expect((u as Record<string, unknown>).passwordHash).toBeUndefined();
        expect(u.id).toBeDefined();
        expect(u.role).toBeDefined();
      }
    });

    it('tìm người dùng theo ID hợp lệ', () => {
      const user = usersService.getUserById('usr-super-admin');
      expect(user.id).toBe('usr-super-admin');
      expect(user.role).toBe('super_admin');
    });

    it('ném NotFoundException khi tìm người dùng với ID không tồn tại', () => {
      expect(() => usersService.getUserById('usr-non-existent')).toThrow(NotFoundException);
    });
  });

  describe('Thăng cấp Tenant lên Admin Owner (promoteToOwner)', () => {
    it('Super Admin thăng cấp thành công tài khoản tenant thành admin_owner của website riêng', () => {
      const promoted = usersService.promoteToOwner('usr-tenant', {
        tenantId: 'tenant-brand-new',
        websiteName: 'Brand New Fashion Store',
        websiteDomain: 'brandnew.store.vn',
        initialSubRoles: ['editor', 'order_manager', 'cashier'],
      });

      expect(promoted.id).toBe('usr-tenant');
      expect(promoted.role).toBe('admin_owner');
      expect(promoted.tenantId).toBe('tenant-brand-new');
      expect(promoted.websiteName).toBe('Brand New Fashion Store');
      expect(promoted.websiteDomain).toBe('brandnew.store.vn');
      expect(promoted.subRoles).toEqual(['editor', 'order_manager', 'cashier']);
    });

    it('ném NotFoundException khi cố thăng cấp tài khoản không tồn tại', () => {
      expect(() =>
        usersService.promoteToOwner('invalid-user-id', {
          tenantId: 't-123',
          websiteName: 'My Web',
          websiteDomain: 'myweb.vn',
        }),
      ).toThrow(NotFoundException);
    });

    it('ném BadRequestException khi cố thay đổi vai trò của Super Admin', () => {
      expect(() =>
        usersService.promoteToOwner('usr-super-admin', {
          tenantId: 'tenant-hack',
          websiteName: 'Hacked Shop',
          websiteDomain: 'hack.vn',
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('Quản lý Sub-roles theo Tenant (manageTenantSubRoles)', () => {
    it('gán thêm sub-role mới cho người dùng thành công', () => {
      const updated = usersService.manageTenantSubRoles('tenant-boutique-001', {
        userId: 'usr-admin-owner',
        subRole: 'support',
        action: 'grant',
      });

      expect(updated.subRoles).toContain('support');
      expect(updated.subRoles).toContain('editor');
    });

    it('gỡ sub-role khỏi người dùng thành công', () => {
      const updated = usersService.manageTenantSubRoles('tenant-boutique-001', {
        userId: 'usr-admin-owner',
        subRole: 'cashier',
        action: 'revoke',
      });

      expect(updated.subRoles).not.toContain('cashier');
      expect(updated.subRoles).toContain('editor');
    });

    it('ném BadRequestException khi thao tác trên tenant khác với tenant của người dùng', () => {
      expect(() =>
        usersService.manageTenantSubRoles('tenant-different-999', {
          userId: 'usr-admin-owner',
          subRole: 'editor',
          action: 'grant',
        }),
      ).toThrow(BadRequestException);
    });

    it('ném NotFoundException khi userId không tồn tại', () => {
      expect(() =>
        usersService.manageTenantSubRoles('tenant-boutique-001', {
          userId: 'usr-ghost',
          subRole: 'editor',
          action: 'grant',
        }),
      ).toThrow(NotFoundException);
    });
  });
});
