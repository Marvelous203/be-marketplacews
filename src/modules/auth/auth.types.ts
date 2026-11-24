export type UserRole =
  | 'guest'
  | 'tenant'
  | 'dev_freelance'
  | 'admin_owner'
  | 'super_admin';

export type TenantSubRole =
  | 'editor'
  | 'order_manager'
  | 'cashier'
  | 'support';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  tenantId?: string | null;
  websiteName?: string | null;
  websiteDomain?: string | null;
  subRoles: TenantSubRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string | null;
  websiteName?: string | null;
  websiteDomain?: string | null;
  subRoles: TenantSubRole[];
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: Omit<User, 'passwordHash'>;
}
