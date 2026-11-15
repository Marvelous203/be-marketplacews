import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import type {} from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service.js';
import { ProductDto, ProductsListResponseDto } from './dto/product-response.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';
import {
  CreateProductLayerDto,
  ProductLayerResponseDto,
} from './dto/create-product-layer.dto.js';
import {
  OutfitResponseDto,
  PieceResponseDto,
  UploadOutfitDto,
  UploadPieceDto,
} from './dto/upload-piece-outfit.dto.js';

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

  @Get('layers')
  @ApiOperation({ summary: 'List all dynamic mix-and-match layer products' })
  @ApiResponse({
    status: 200,
    description: 'List of layer products',
    type: [ProductLayerResponseDto],
  })
  findAllLayers(): ProductLayerResponseDto[] {
    return this.productsService.findAllLayers();
  }

  @Get('pieces')
  @ApiOperation({ summary: 'List all mix-and-match clothing pieces (seed + user uploaded)' })
  @ApiResponse({
    status: 200,
    description: 'List of individual clothing pieces with Z-index and layer URLs',
    type: [PieceResponseDto],
  })
  findAllPieces(): PieceResponseDto[] {
    return this.productsService.findAllPieces();
  }

  @Get('outfits')
  @ApiOperation({ summary: 'List all curated outfit sets / presets' })
  @ApiResponse({
    status: 200,
    description: 'List of outfit presets referencing piece IDs',
    type: [OutfitResponseDto],
  })
  findAllOutfits(): OutfitResponseDto[] {
    return this.productsService.findAllOutfits();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID (e.g. prod-0-top-0)' })
  @ApiResponse({ status: 200, description: 'Product details', type: ProductDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string): ProductDto {
    return this.productsService.findOne(id);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a mix-and-match product layer with transparent image and thumbnail' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Product layer image assets & metadata',
    schema: {
      type: 'object',
      required: ['name', 'category', 'priceVND'],
      properties: {
        name: { type: 'string', example: 'Ribbed Crop Tank' },
        category: {
          type: 'string',
          enum: ['TOP', 'BOTTOM', 'DRESS', 'OUTERWEAR', 'SHOES', 'ACCESSORY'],
          example: 'TOP',
        },
        layerZIndex: { type: 'number', example: 30 },
        priceVND: { type: 'number', example: 950000 },
        color: { type: 'string', example: 'Charcoal' },
        excludes: {
          type: 'array',
          items: { type: 'string', enum: ['TOP', 'BOTTOM', 'DRESS', 'OUTERWEAR', 'SHOES', 'ACCESSORY'] },
          example: ['DRESS'],
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Transparent PNG/WebP canvas image (e.g. 1360x2048)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Menu icon thumbnail (e.g. 360x360)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product layer created and image stored successfully',
    type: ProductLayerResponseDto,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  uploadProduct(
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
    @Body() dto: CreateProductLayerDto,
  ): ProductLayerResponseDto {
    return this.productsService.createProductLayer(
      dto,
      files?.image?.[0],
      files?.thumbnail?.[0],
    );
  }

  // --- Kịch bản A: Upload một món đồ lẻ (Piece) ---
  @Post('upload-piece')
  @ApiOperation({ summary: 'Upload an individual clothing piece (thumbnail 300x300 + transparent layer 1360x2048)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Clothing piece files and metadata',
    schema: {
      type: 'object',
      required: ['name', 'type', 'priceVND'],
      properties: {
        name: { type: 'string', example: 'Ribbed Crop Tank' },
        type: {
          type: 'string',
          enum: ['top', 'bottom', 'dress', 'shoes', 'acc'],
          example: 'top',
        },
        priceVND: { type: 'number', example: 950000 },
        color: { type: 'string', example: 'Charcoal' },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: '300x300px square thumbnail image',
        },
        layer: {
          type: 'string',
          format: 'binary',
          description: '1360x2048px transparent PNG/WebP canvas image',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Individual piece uploaded and registered with automatic Z-Index',
    type: PieceResponseDto,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'layer', maxCount: 1 },
    ]),
  )
  uploadPiece(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      layer?: Express.Multer.File[];
    },
    @Body() dto: UploadPieceDto,
  ): PieceResponseDto {
    return this.productsService.uploadPiece(
      dto,
      files?.thumbnail?.[0],
      files?.layer?.[0],
    );
  }

  // --- Kịch bản B: Upload một Outfit (Set đồ phối sẵn) ---
  @Post('upload-outfit')
  @ApiOperation({ summary: 'Upload an outfit preset referencing existing piece IDs (no layer images needed)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Outfit cover thumbnail and list of piece IDs',
    schema: {
      type: 'object',
      required: ['name', 'pieceIds'],
      properties: {
        name: { type: 'string', example: 'Denim Chic Look' },
        pieceIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['piece-top-denim', 'piece-bot-maxi', 'piece-shoes-boots'],
        },
        discountPercent: { type: 'number', example: 15, default: 15 },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Set cover thumbnail image',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Outfit preset created successfully',
    type: OutfitResponseDto,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  uploadOutfit(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Body() dto: UploadOutfitDto,
  ): OutfitResponseDto {
    return this.productsService.uploadOutfit(
      dto,
      files?.thumbnail?.[0],
    );
  }
}
