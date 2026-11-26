import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { User, UserRole, JwtPayload, AuthResponse, TenantSubRole } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';

const JWT_SECRET = process.env.JWT_SECRET || 'vell-fashion-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(plain: string, storedHash: string): boolean {
  if (!plain || !storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = scryptSync(plain, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return timingSafeEqual(keyBuf, derivedBuf);
}

const DEFAULT_DEV_PASSWORD_HASH = hashPassword('password123');

export const MOCK_USERS: User[] = [
  {
    id: 'usr-super-admin',
    email: 'superadmin@marketplace.vn',
    passwordHash: DEFAULT_DEV_PASSWORD_HASH,
    name: 'Hệ Thống Super Admin',
    role: 'super_admin',
    tenantId: null,
    websiteName: null,
    websiteDomain: null,
    subRoles: [],
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr-admin-owner',
    email: 'owner@fashionboutique.vn',
    passwordHash: DEFAULT_DEV_PASSWORD_HASH,
    name: 'Chủ Shop Thời Trang (Boutique)',
    role: 'admin_owner',
    tenantId: 'tenant-boutique-001',
    websiteName: 'Boutique Fashion Store',
    websiteDomain: 'boutique.fashion.vn',
    subRoles: ['editor', 'order_manager', 'cashier'],
    isActive: true,
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'usr-tenant',
    email: 'tenant@mybrand.vn',
    passwordHash: DEFAULT_DEV_PASSWORD_HASH,
    name: 'Doanh Nghiệp MyBrand',
    role: 'tenant',
    tenantId: 'tenant-mybrand-002',
    websiteName: 'MyBrand Store',
    websiteDomain: 'mybrand.vn',
    subRoles: [],
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'usr-dev-freelance',
    email: 'developer@freelance.io',
    passwordHash: DEFAULT_DEV_PASSWORD_HASH,
    name: 'Nguyễn Văn Dev (Freelancer)',
    role: 'dev_freelance',
    tenantId: null,
    websiteName: null,
    websiteDomain: null,
    subRoles: [],
    isActive: true,
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'usr-guest',
    email: 'guest@customer.vn',
    passwordHash: DEFAULT_DEV_PASSWORD_HASH,
    name: 'Khách Hàng Vãng Lai',
    role: 'guest',
    tenantId: null,
    websiteName: null,
    websiteDomain: null,
    subRoles: [],
    isActive: true,
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
];

@Injectable()
export class AuthService {
  private users: User[] = JSON.parse(JSON.stringify(MOCK_USERS));

  /**
   * Đăng nhập người dùng bằng email + password (bắt buộc verify scrypt hash)
   * hoặc đăng nhập nhanh theo Role (chỉ cho phép ở môi trường non-production)
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    let user: User | undefined;

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const password = dto.password ?? '';
      if (!password) {
        throw new UnauthorizedException('Vui lòng nhập mật khẩu');
      }

      user = this.users.find((u) => u.email.toLowerCase() === email && u.isActive);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }
    } else if (dto.role) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Không hỗ trợ đăng nhập nhanh theo role ở môi trường production');
      }
      user = this.users.find((u) => u.role === dto.role && u.isActive);
      if (!user) {
        throw new BadRequestException(`Không tìm thấy tài khoản mẫu cho role '${dto.role}'`);
      }
    } else {
      throw new BadRequestException('Vui lòng cung cấp email và mật khẩu');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      websiteName: user.websiteName,
      websiteDomain: user.websiteDomain,
      subRoles: user.subRoles,
    };

    const accessToken = this.signToken(payload);

    const { passwordHash: _, ...safeUser } = user;
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: JWT_EXPIRES_IN_SECONDS,
      user: safeUser,
    };
  }

  /**
   * Ký JWT Token với thuật toán HMAC SHA-256
   */
  signToken(payload: JwtPayload, expiresInSeconds = JWT_EXPIRES_IN_SECONDS): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const dataToSign = `${headerB64}.${payloadB64}`;

    const signature = createHmac('sha256', JWT_SECRET)
      .update(dataToSign)
      .digest('base64url');

    return `${dataToSign}.${signature}`;
  }

  /**
   * Xác thực và giải mã JWT Token
   */
  verifyToken(token: string): JwtPayload {
    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException('Token không được để trống');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Định dạng token không hợp lệ');
    }

    const [headerB64, payloadB64, signature] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;

    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(dataToSign)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expSigBuf.length || !timingSafeEqual(sigBuf, expSigBuf)) {
      throw new UnauthorizedException('Chữ ký token không hợp lệ hoặc đã bị thay đổi');
    }

    let payload: JwtPayload;
    try {
      const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
      payload = JSON.parse(payloadJson);
    } catch {
      throw new UnauthorizedException('Dữ liệu token bị lỗi');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
    }

    return payload;
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getAllUsers(): User[] {
    return [...this.users];
  }

  updateUser(id: string, updates: Partial<User>): User {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) {
      throw new BadRequestException(`Không tìm thấy người dùng ID: ${id}`);
    }

    this.users[idx] = {
      ...this.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.users[idx];
  }

  resetMockUsers(): void {
    this.users = JSON.parse(JSON.stringify(MOCK_USERS));
  }
}
