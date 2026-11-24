import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuotationsService } from './quotations.service.js';
import { AcceptQuotationDto, RejectQuotationDto } from './dto/accept-quotation.dto.js';
import { Quotation } from './quotations.types.js';

@ApiTags('Public & Customer Quotations')
@Controller('v1/quotations')
export class PublicQuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Khách hàng: Xem chi tiết báo giá qua đường link an toàn (WM-052)' })
  @ApiResponse({ status: 200, description: 'Chi tiết báo giá phiên bản hiện hành' })
  async getQuotationById(@Param('id') id: string): Promise<Quotation> {
    return this.quotationsService.findPublicById(id);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Khách hàng: Chấp thuận báo giá và chuyển sang đơn hàng (WM-052)' })
  @ApiResponse({ status: 200, description: 'Chấp thuận thành công, chuyển sang trạng thái ACCEPTED' })
  async acceptQuotation(@Param('id') id: string, @Body() dto: AcceptQuotationDto): Promise<Quotation> {
    return this.quotationsService.acceptQuotation(id, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Khách hàng: Từ chối báo giá (WM-052)' })
  @ApiResponse({ status: 200, description: 'Báo giá chuyển sang trạng thái REJECTED' })
  async rejectQuotation(@Param('id') id: string, @Body() dto: RejectQuotationDto): Promise<Quotation> {
    return this.quotationsService.rejectQuotation(id, dto);
  }
}
