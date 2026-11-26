import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/guards/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateSellerListingDto, ModerateSellerListingDto } from './dto/seller.dto.js';
import { SellerService } from './seller.service.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    name?: string;
    role: string;
  };
}

@ApiTags('Seller Portal (R4A)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('seller/dashboard')
  @Roles('dev_freelance', 'super_admin')
  @ApiOperation({ summary: 'Thống kê hiệu suất đối tác bán hàng (Seller Dashboard)' })
  getDashboard(@Request() req: AuthenticatedRequest) {
    return this.sellerService.getDashboard(req.user.userId, req.user.role);
  }

  @Get('seller/listings')
  @Roles('dev_freelance', 'super_admin')
  @ApiOperation({ summary: 'Danh sách giải pháp thuộc quyền sở hữu của Seller' })
  getListings(@Request() req: AuthenticatedRequest) {
    return this.sellerService.getListings(req.user.userId, req.user.role);
  }

  @Post('seller/listings')
  @Roles('dev_freelance', 'super_admin')
  @ApiOperation({ summary: 'Tạo bản nháp giải pháp mới lên Sàn Phố Nghề' })
  createListing(@Body() dto: CreateSellerListingDto, @Request() req: AuthenticatedRequest) {
    return this.sellerService.createListing(dto, {
      id: req.user.userId,
      name: req.user.name || req.user.email,
    });
  }

  @Post('seller/listings/:id/submit')
  @Roles('dev_freelance', 'super_admin')
  @ApiOperation({ summary: 'Gửi giải pháp chờ Super Admin kiểm duyệt' })
  submitForReview(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.sellerService.submitForReview(id, {
      id: req.user.userId,
      name: req.user.name || req.user.email,
      role: req.user.role,
    });
  }

  @Get('seller/leads')
  @Roles('dev_freelance', 'super_admin')
  @ApiOperation({ summary: 'Hộp thư yêu cầu dự án dành cho Seller (đã lọc bỏ ghi chú nội bộ)' })
  getLeads() {
    return this.sellerService.getSellerLeads();
  }

  @Post('admin/seller-listings/:id/moderate')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Super Admin kiểm duyệt giải pháp Seller (Duyệt / Từ chối kèm phản hồi)' })
  moderateListing(
    @Param('id') id: string,
    @Body() dto: ModerateSellerListingDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.sellerService.moderateListing(id, dto, {
      name: req.user.name || 'Hệ Thống Super Admin',
    });
  }
}
