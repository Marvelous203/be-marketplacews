import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service.js';
import {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/category.dto.js';
import { TagDto, CreateTagDto } from './dto/tag.dto.js';
import {
  ListingDetailDto,
  CreateListingDto,
  SuspendListingDto,
} from './dto/listing.dto.js';
import { CreateOfferDto, OfferResponseDto } from './dto/offer.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';

@ApiTags('Admin Catalog Management')
@Controller('v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin_owner')
@ApiBearerAuth()
export class AdminCatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Admin: Danh sách tất cả danh mục (kể cả inactive)' })
  getAllCategories(): CategoryDto[] {
    return this.catalogService.getCategories(false);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Admin: Tạo mới danh mục ngành nghề' })
  @ApiResponse({ status: 201, type: CategoryDto })
  createCategory(@Body() dto: CreateCategoryDto): CategoryDto {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Admin: Cập nhật danh mục' })
  @ApiResponse({ status: 200, type: CategoryDto })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): CategoryDto {
    return this.catalogService.updateCategory(id, dto);
  }

  @Post('tags')
  @ApiOperation({ summary: 'Admin: Tạo mới thẻ phân loại' })
  @ApiResponse({ status: 201, type: TagDto })
  createTag(@Body() dto: CreateTagDto): TagDto {
    return this.catalogService.createTag(dto);
  }

  @Post('listings')
  @ApiOperation({ summary: 'Admin: Tạo bản nháp giải pháp (Listing Draft)' })
  @ApiResponse({ status: 201, type: ListingDetailDto })
  createListing(@Body() dto: CreateListingDto): ListingDetailDto {
    return this.catalogService.createListing(dto);
  }

  @Post('listings/:id/offers')
  @ApiOperation({ summary: 'Admin: Thêm gói thương mại (Offer) cho giải pháp' })
  @ApiResponse({ status: 201, type: OfferResponseDto })
  addOffer(
    @Param('id') id: string,
    @Body() dto: CreateOfferDto,
  ): OfferResponseDto {
    return this.catalogService.addOfferToListing(id, dto);
  }

  @Post('listings/:id/publish')
  @ApiOperation({ summary: 'Admin: Phê duyệt và xuất bản giải pháp ra catalog công khai' })
  @ApiResponse({ status: 200, type: ListingDetailDto })
  publishListing(@Param('id') id: string): ListingDetailDto {
    return this.catalogService.publishListing(id, 'admin-actor-1');
  }

  @Post('listings/:id/suspend')
  @ApiOperation({ summary: 'Admin: Tạm ngưng xuất bản giải pháp kèm lý do' })
  @ApiResponse({ status: 200, type: ListingDetailDto })
  suspendListing(
    @Param('id') id: string,
    @Body() dto: SuspendListingDto,
  ): ListingDetailDto {
    return this.catalogService.suspendListing(id, dto.reason, 'admin-actor-1');
  }
}
