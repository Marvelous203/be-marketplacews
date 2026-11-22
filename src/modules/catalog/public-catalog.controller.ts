import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';
import { CategoryDto } from './dto/category.dto.js';
import { TagDto } from './dto/tag.dto.js';
import { FeatureDefinitionDto } from './dto/feature.dto.js';
import {
  ListingSummaryDto,
  ListingDetailDto,
  ListingFilterQueryDto,
} from './dto/listing.dto.js';

@ApiTags('Public Catalog')
@Controller('v1/public')
export class PublicCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách các danh mục giải pháp website' })
  @ApiResponse({ status: 200, type: [CategoryDto] })
  getCategories(): CategoryDto[] {
    return this.catalogService.getCategories();
  }

  @Get('tags')
  @ApiOperation({ summary: 'Lấy danh sách thẻ phân loại / bộ lọc' })
  @ApiResponse({ status: 200, type: [TagDto] })
  getTags(): TagDto[] {
    return this.catalogService.getTags();
  }

  @Get('features')
  @ApiOperation({ summary: 'Lấy từ điển tính năng có thể lọc' })
  @ApiResponse({ status: 200, type: [FeatureDefinitionDto] })
  getFeatures(): FeatureDefinitionDto[] {
    return this.catalogService.getFeatures();
  }

  @Get('listings')
  @ApiOperation({ summary: 'Tìm kiếm, lọc danh mục giải pháp website công khai' })
  @ApiResponse({ status: 200 })
  getListings(@Query() query: ListingFilterQueryDto) {
    return this.catalogService.findPublicListings(query);
  }

  @Get('listings/:slug')
  @ApiOperation({ summary: 'Xem chi tiết giải pháp, demo, offers và bảng giá' })
  @ApiResponse({ status: 200, type: ListingDetailDto })
  getListingBySlug(@Param('slug') slug: string): ListingDetailDto {
    return this.catalogService.getPublicListingBySlug(slug);
  }
}
