import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MarketplaceOrdersService } from './marketplace-orders.service.js';
import { QueryOrdersDto } from './dto/query-orders.dto.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';
import { TransitionOrderStatusDto } from './dto/transition-order-status.dto.js';
import { MarketplaceOrder } from './marketplace-orders.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';

@ApiTags('Admin Marketplace Orders & Payments')
@Controller('v1/admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin_owner')
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: MarketplaceOrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Admin: Danh sách tất cả đơn hàng kèm bộ lọc trạng thái & thanh toán (WM-060)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách đơn hàng phân trang' })
  async getAllOrders(@Query() query: QueryOrdersDto) {
    return this.ordersService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Admin: Xem chi tiết toàn diện đơn hàng, snapshot chi phí & lịch sử giao dịch',
  })
  @ApiParam({ name: 'id', description: 'ID đơn hàng', example: 'ord-seed-001' })
  @ApiResponse({ status: 200, description: 'Chi tiết đơn hàng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async getOrderById(@Param('id') id: string): Promise<MarketplaceOrder> {
    return this.ordersService.findOrderById(id);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin / Thu Ngân: Ghi nhận đợt thanh toán ngoại tuyến (Chuyển khoản, VietQR, Tiền mặt) (WM-061)',
    description: 'Tự động tính toán số dư còn lại, cập nhật paymentStatus (PARTIALLY_PAID / PAID) và chuyển trạng thái đơn sang CONFIRMED.',
  })
  @ApiParam({ name: 'id', description: 'ID đơn hàng', example: 'ord-seed-001' })
  @ApiResponse({ status: 200, description: 'Ghi nhận thanh toán thành công' })
  @ApiResponse({ status: 400, description: 'Số tiền thanh toán vượt quá số dư hoặc đơn đã bị hủy' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ): Promise<MarketplaceOrder> {
    return this.ordersService.recordPayment(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Admin: Chuyển đổi trạng thái đơn hàng kiểm soát qua State Machine (WM-060)',
    description: 'Luồng trạng thái: PENDING_PAYMENT -> CONFIRMED -> PROCESSING -> DELIVERED -> COMPLETED (hoặc CANCELLED).',
  })
  @ApiParam({ name: 'id', description: 'ID đơn hàng', example: 'ord-seed-001' })
  @ApiResponse({ status: 200, description: 'Chuyển trạng thái thành công' })
  @ApiResponse({ status: 400, description: 'Chuyển trạng thái không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionOrderStatusDto,
  ): Promise<MarketplaceOrder> {
    return this.ordersService.transitionStatus(id, dto);
  }
}
