import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequestsService } from './requests.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';
import { PublicQuoteRequest } from './requests.types.js';

@ApiTags('Public Quote Requests')
@Controller('v1/quote-requests')
export class PublicRequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Khách hàng hoặc khách vãng lai gửi yêu cầu dự án tùy biến (WM-042)' })
  @ApiResponse({ status: 201, description: 'Yêu cầu được khởi tạo thành công và trả về mã tra cứu duy nhất' })
  async createRequest(@Body() dto: CreateRequestDto) {
    return this.requestsService.createRequest(dto);
  }

  @Get(':refOrId')
  @ApiOperation({ summary: 'Khách hàng tra cứu tiến độ xử lý yêu cầu theo mã tra cứu (WMR-XXXX) hoặc ID' })
  @ApiResponse({ status: 200, description: 'Dữ liệu tiến độ an toàn (không chứa ghi chú nội bộ)' })
  async getPublicRequest(@Param('refOrId') refOrId: string): Promise<PublicQuoteRequest> {
    return this.requestsService.findPublicByReference(refOrId);
  }
}
