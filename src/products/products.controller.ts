import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { ProductDto, ProductsListResponseDto } from './dto/product-response.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with optional filters and pagination' })
  @ApiResponse({ status: 200, description: 'Filtered list of products', type: ProductsListResponseDto })
  findAll(@Query() query: QueryProductDto): ProductsListResponseDto {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID (e.g. prod-0-top-0)' })
  @ApiResponse({ status: 200, description: 'Product details', type: ProductDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string): ProductDto {
    return this.productsService.findOne(id);
  }
}
