import { describe, it, expect, beforeEach } from 'vitest';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UserRole } from './auth.types.js';

describe('AuthService (RBAC & JWT Authentication)', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    authService.resetMockUsers();
  });

  describe('Đăng nhập (Happy Path)', () => {
    it('đăng nhập thành công với email và password chính xác', async () => {
      const res = await authService.login({
        email: 'superadmin@marketplace.vn',
        password: 'password123',
      });

      expect(res).toBeDefined();
      expect(res.accessToken).toBeDefined();
      expect(typeof res.accessToken).toBe('string');
      expect(res.tokenType).toBe('Bearer');
      expect(res.user.role).toBe('super_admin');
      expect(res.user.email).toBe('superadmin@marketplace.vn');
      expect((res.user as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('đăng nhập nhanh thành công qua role mock cho cả 5 roles', async () => {
      const roles: UserRole[] = ['super_admin', 'admin_owner', 'tenant', 'dev_freelance', 'guest'];

      for (const role of roles) {
        const res = await authService.login({ role });
        expect(res.user.role).toBe(role);
        expect(res.accessToken).toBeDefined();

        const decoded = authService.verifyToken(res.accessToken);
        expect(decoded.role).toBe(role);
        expect(decoded.sub).toBe(res.user.id);
      }
    });

    it('ký token và giải mã payload JWT chính xác với hạn sử dụng', () => {
      const payload = {
        sub: 'usr-test-123',
        email: 'test@example.com',
        name: 'Tester',
        role: 'admin_owner' as UserRole,
        tenantId: 'tenant-123',
        websiteName: 'Shop Test',
        websiteDomain: 'shop.test.vn',
        subRoles: ['editor' as const],
      };

      const token = authService.signToken(payload, 3600);
      expect(token.split('.')).toHaveLength(3);

      const verified = authService.verifyToken(token);
      expect(verified.sub).toBe('usr-test-123');
      expect(verified.role).toBe('admin_owner');
      expect(verified.tenantId).toBe('tenant-123');
      expect(verified.websiteName).toBe('Shop Test');
      expect(verified.subRoles).toContain('editor');
      expect(verified.exp).toBeDefined();
    });
  });

  describe('Đăng nhập & Token (Bad Paths)', () => {
    it('ném UnauthorizedException khi nhập sai mật khẩu', async () => {
      await expect(
        authService.login({
          email: 'superadmin@marketplace.vn',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('ném UnauthorizedException khi email không tồn tại trong hệ thống', async () => {
      await expect(
        authService.login({
          email: 'unknown@marketplace.vn',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('ném BadRequestException khi không cung cấp email và cũng không chọn role', async () => {
      await expect(authService.login({})).rejects.toThrow(BadRequestException);
    });

    it('ném UnauthorizedException khi token rỗng hoặc không đúng 3 phần', () => {
      expect(() => authService.verifyToken('')).toThrow(UnauthorizedException);
      expect(() => authService.verifyToken('invalid-token-string')).toThrow(UnauthorizedException);
      expect(() => authService.verifyToken('part1.part2')).toThrow(UnauthorizedException);
    });

    it('ném UnauthorizedException khi chữ ký token bị giả mạo', () => {
      const token = authService.signToken({
        sub: 'usr-guest',
        email: 'guest@customer.vn',
        name: 'Guest',
        role: 'guest',
        subRoles: [],
      });

      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tamperedSignature12345`;

      expect(() => authService.verifyToken(tamperedToken)).toThrow(UnauthorizedException);
    });

    it('ném UnauthorizedException khi token đã hết hạn (expired)', () => {
      // Ký token hết hạn ngay lập tức (-1 giây)
      const expiredToken = authService.signToken(
        {
          sub: 'usr-guest',
          email: 'guest@customer.vn',
          name: 'Guest',
          role: 'guest',
          subRoles: [],
        },
        -10,
      );

      expect(() => authService.verifyToken(expiredToken)).toThrow(UnauthorizedException);
    });
  });
});
