import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service.js';
import { CreateQuotationDto } from './dto/create-quotation.dto.js';
import { Quotation } from './quotations.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';

@ApiTags('Admin Quotations')
@Controller('v1/admin/quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin_owner')
@ApiBearerAuth()
export class AdminQuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Admin: Khởi tạo bản thảo báo giá mới (WM-050)' })
  @ApiResponse({ status: 201, description: 'Bản thảo báo giá được tạo thành công' })
  async createQuotation(@Body() dto: CreateQuotationDto): Promise<Quotation> {
    return this.quotationsService.createQuotationDraft(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Xem chi tiết báo giá và lịch sử các phiên bản' })
  @ApiResponse({ status: 200, description: 'Toàn bộ dữ liệu báo giá' })
  async getQuotationById(@Param('id') id: string): Promise<Quotation> {
    return this.quotationsService.findAdminById(id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Admin: Gửi báo giá cho khách hàng và đóng băng phiên bản (WM-051)' })
  @ApiResponse({ status: 200, description: 'Báo giá đã chuyển sang SENT và thông báo cho khách' })
  async sendQuotation(@Param('id') id: string): Promise<Quotation> {
    return this.quotationsService.sendQuotation(id);
  }
}
