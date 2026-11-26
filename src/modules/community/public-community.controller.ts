import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityService } from './community.service.js';
import type { ThreadType } from './community.types.js';
import { ReactThreadDto } from './dto/community.dto.js';

export class QueryCommunityThreadsDto {
  @ApiPropertyOptional({ example: 'wanted', description: 'Chuyên mục slug' })
  category?: string;

  @ApiPropertyOptional({
    enum: ['DISCUSSION', 'QUESTION', 'SHOWCASE', 'WANTED', 'ANNOUNCEMENT'],
    type: String,
  })
  threadType?: string;

  @ApiPropertyOptional({ example: 'Next.js', description: 'Từ khóa tìm kiếm' })
  q?: string;

  @ApiPropertyOptional({ default: 20 })
  limit?: number = 20;
}

@ApiTags('Public Community Forum')
@Controller('v1/public/community')
export class PublicCommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách các chuyên mục diễn đàn cộng đồng' })
  getCategories() {
    return this.communityService.getCategories();
  }

  @Get('threads')
  @ApiOperation({ summary: 'Lấy danh sách bài viết / Bảng Cần giải pháp (Wanted)' })
  getThreads(@Query() query: QueryCommunityThreadsDto) {
    return this.communityService.getThreads({
      ...query,
      threadType: query.threadType as ThreadType,
    });
  }

  @Get('threads/:slug')
  @ApiOperation({ summary: 'Xem chi tiết bài viết, câu trả lời và thông tin yêu cầu' })
  getThreadBySlug(@Param('slug') slug: string) {
    return this.communityService.getThreadBySlug(slug);
  }

  @Post('threads/:id/react')
  @ApiOperation({ summary: 'Thả reaction theo ngữ cảnh (Hữu ích / Đã dùng thử / Cần thêm demo)' })
  reactToThread(@Param('id') id: string, @Body() dto: ReactThreadDto) {
    return this.communityService.reactToThread(id, dto.reactionType);
  }
}
