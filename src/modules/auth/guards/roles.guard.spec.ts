import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { UserRole, JwtPayload } from '../auth.types.js';

describe('RolesGuard (RBAC Authorization & 403 Forbidden Verification)', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
  });

  function createMockContext(user?: Partial<JwtPayload>): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('Happy Paths (Quyền hợp lệ)', () => {
    it('cho phép truy cập khi route không yêu cầu role cụ thể', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ role: 'guest' });
      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('cho phép truy cập khi user có role nằm trong danh sách @Roles(...)', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin_owner', 'super_admin'] as UserRole[]);

      const context = createMockContext({
        sub: 'usr-admin-owner',
        email: 'owner@fashionboutique.vn',
        role: 'admin_owner',
      });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('Super Admin luôn được phép truy cập mọi tài nguyên bất kể @Roles yêu cầu gì', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['tenant'] as UserRole[]);

      const context = createMockContext({
        sub: 'usr-super-admin',
        email: 'superadmin@marketplace.vn',
        role: 'super_admin',
      });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });
  });

  describe('Bad Paths & Permission Denied (403 Forbidden)', () => {
    it('ném 403 ForbiddenException khi chưa xác thực thông tin user trên request', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin'] as UserRole[]);

      const context = createMockContext(undefined);
      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('ném 403 ForbiddenException khi Tenant cố truy cập tài nguyên của Super Admin', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['super_admin'] as UserRole[]);

      const context = createMockContext({
        sub: 'usr-tenant',
        email: 'tenant@mybrand.vn',
        role: 'tenant',
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('ném 403 ForbiddenException khi Guest cố truy cập tài nguyên của Admin Owner', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin_owner', 'super_admin'] as UserRole[]);

      const context = createMockContext({
        sub: 'usr-guest',
        email: 'guest@customer.vn',
        role: 'guest',
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('ném 403 ForbiddenException khi Dev Freelancer cố can thiệp quản trị Tenant', () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin_owner'] as UserRole[]);

      const context = createMockContext({
        sub: 'usr-dev',
        email: 'dev@freelance.io',
        role: 'dev_freelance',
      });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
