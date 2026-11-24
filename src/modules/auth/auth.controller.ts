import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto, LoginResponseDto, UserProfileDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { JwtPayload } from './auth.types.js';

@ApiTags('Authentication & Identity')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập người dùng bằng Email/Password hoặc Đăng nhập nhanh theo Role Mock',
    description:
      'Hỗ trợ 5 roles: super_admin, admin_owner, tenant, dev_freelance, guest. Trả về access token JWT và thông tin tài khoản.',
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công', type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Dữ liệu yêu cầu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu' })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy thông tin người dùng hiện tại từ JWT Bearer Token',
  })
  @ApiResponse({ status: 200, description: 'Thông tin hồ sơ người dùng', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  async getProfile(@Req() req: { user: JwtPayload }): Promise<UserProfileDto> {
    const user = this.authService.getUserById(req.user.sub);
    if (!user) {
      // Fallback to token payload if user record in-memory was updated
      return {
        id: req.user.sub,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        tenantId: req.user.tenantId,
        websiteName: req.user.websiteName,
        websiteDomain: req.user.websiteDomain,
        subRoles: req.user.subRoles,
        isActive: true,
      };
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}
