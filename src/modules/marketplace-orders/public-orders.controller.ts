import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MarketplaceOrdersService } from './marketplace-orders.service.js';
import { CreateOrderFromQuotationDto } from './dto/create-order-from-quotation.dto.js';
import { MarketplaceOrder } from './marketplace-orders.types.js';

@ApiTags('Public & Customer Marketplace Orders')
@Controller('v1/orders')
export class PublicOrdersController {
  constructor(private readonly ordersService: MarketplaceOrdersService) {}

  @Post('from-quotation/:quotationId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Khách hàng: Tạo đơn hàng chính thức từ Báo giá đã được chấp thuận (WM-053 Idempotent)',
    description: 'Chuyển đổi snapshot báo giá sang đơn hàng, khởi tạo mã ORD-YYYY-XXXX và thông tin chuyển khoản VietQR.',
  })
  @ApiParam({ name: 'quotationId', description: 'ID báo giá đã duyệt', example: 'quote-001' })
  @ApiResponse({ status: 201, description: 'Đơn hàng được khởi tạo thành công' })
  @ApiResponse({ status: 400, description: 'Báo giá chưa được ACCEPTED' })
  async createFromQuotation(
    @Param('quotationId') quotationId: string,
    @Body() dto?: CreateOrderFromQuotationDto,
  ): Promise<MarketplaceOrder> {
    return this.ordersService.createFromQuotation(quotationId, dto);
  }

  @Get('number/:orderNumber')
  @ApiOperation({
    summary: 'Khách hàng: Tra cứu đơn hàng theo Mã Đơn (ORD-YYYY-XXXX)',
  })
  @ApiParam({ name: 'orderNumber', description: 'Mã đơn hàng', example: 'ORD-2026-0001' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async getByOrderNumber(@Param('orderNumber') orderNumber: string): Promise<MarketplaceOrder> {
    return this.ordersService.findOrderByNumber(orderNumber);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Khách hàng: Xem chi tiết đơn hàng, tiến độ thanh toán & hướng dẫn chuyển khoản VietQR',
  })
  @ApiParam({ name: 'id', description: 'ID đơn hàng hoặc Quotation ID', example: 'ord-seed-001' })
  @ApiResponse({ status: 200, description: 'Toàn bộ hồ sơ đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async getById(@Param('id') id: string): Promise<MarketplaceOrder> {
    return this.ordersService.findOrderById(id);
  }
}
