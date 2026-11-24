import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequestsService } from './requests.service.js';
import { QueryRequestsDto } from './dto/query-requests.dto.js';
import { TransitionRequestDto, AddInternalNoteDto, AssignStaffDto } from './dto/transition-request.dto.js';
import { QuoteRequest, InternalNote } from './requests.types.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';

@ApiTags('Admin Quote Requests')
@Controller('v1/admin/quote-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin_owner')
@ApiBearerAuth()
export class AdminRequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin / Staff: Danh sách yêu cầu dự án (Inbox) kèm bộ lọc và tìm kiếm (WM-043)' })
  @ApiResponse({ status: 200, description: 'Danh sách yêu cầu phân trang' })
  async getRequests(@Query() query: QueryRequestsDto) {
    return this.requestsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin / Staff: Xem chi tiết yêu cầu, timeline hoạt động và ghi chú nội bộ' })
  @ApiResponse({ status: 200, description: 'Toàn bộ thông tin hồ sơ yêu cầu' })
  async getRequestById(@Param('id') id: string): Promise<QuoteRequest> {
    return this.requestsService.findAdminById(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Admin: Phân công nhân viên tư vấn / kỹ thuật phụ trách yêu cầu (WM-044)' })
  @ApiResponse({ status: 200, description: 'Phân công thành công' })
  async assignStaff(@Param('id') id: string, @Body() dto: AssignStaffDto): Promise<QuoteRequest> {
    return this.requestsService.assignStaff(id, dto);
  }

  @Post(':id/status')
  @ApiOperation({ summary: 'Admin / Staff: Chuyển đổi trạng thái hồ sơ kiểm soát qua State Machine (WM-044, BR-18)' })
  @ApiResponse({ status: 200, description: 'Chuyển trạng thái thành công' })
  async transitionStatus(@Param('id') id: string, @Body() dto: TransitionRequestDto): Promise<QuoteRequest> {
    return this.requestsService.transitionStatus(id, dto);
  }

  @Post(':id/internal-notes')
  @ApiOperation({ summary: 'Staff: Thêm ghi chú trao đổi nội bộ (không hiển thị cho khách hàng) (WM-044)' })
  @ApiResponse({ status: 201, description: 'Ghi chú được lưu thành công' })
  async addInternalNote(@Param('id') id: string, @Body() dto: AddInternalNoteDto): Promise<InternalNote> {
    return this.requestsService.addInternalNote(id, dto);
  }
}
