import { Injectable, NotFoundException } from '@nestjs/common';
import type {} from 'multer';
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ProductDto } from './dto/product-response.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';
import {
  CATEGORY_Z_INDEX_MAP,
  CreateProductLayerDto,
  LayerCategory,
  ProductLayerResponseDto,
} from './dto/create-product-layer.dto.js';
import {
  OutfitResponseDto,
  PieceResponseDto,
  PIECE_Z_INDEX_MAP,
  UploadOutfitDto,
  UploadPieceDto,
} from './dto/upload-piece-outfit.dto.js';

type SizeKey = 'XS' | 'S' | 'M' | 'L' | 'XL';

const STANDARD_SIZE_GUIDE = { XS: '≤155cm', S: '156-162cm', M: '163-168cm', L: '169-174cm', XL: '≥175cm' };
const SHOE_SIZE_GUIDE = { XS: '35-36', S: '36-37', M: '37-38', L: '38-39', XL: '39-40' };

function makeVariants(color: string, isShoe = false): ProductDto['variants'] {
  const sizes: SizeKey[] = ['XS', 'S', 'M', 'L', 'XL'];
  return sizes.map((size, i) => ({
    size,
    color,
    stock: 5 + ((i * 3) % 11),
    sku: `${isShoe ? 'SHO' : 'TOP'}-${color.substring(0, 3).toUpperCase()}-${size}`,
  }));
}

function product(
  id: string,
  lookId: number,
  category: 'tops' | 'bottoms' | 'full' | 'shoes' | 'acc',
  name: string,
  priceVND: number,
  color: string,
): ProductDto {
  return {
    id,
    lookId,
    category,
    name,
    priceVND,
    variants: makeVariants(color, category === 'shoes'),
    sizeGuide: category === 'shoes' ? SHOE_SIZE_GUIDE : STANDARD_SIZE_GUIDE,
  };
}

const PRODUCTS: ProductDto[] = [
  // Look 0 – Denim Maxi
  product('prod-0-top-0', 0, 'tops', 'Ribbed crop tank', 950000, 'Charcoal'),
  product('prod-0-bot-0', 0, 'bottoms', 'Washed denim maxi skirt', 2400000, 'Light wash'),
  product('prod-0-sho-0', 0, 'shoes', 'Knee-high leather boots', 5250000, 'Black'),
  product('prod-0-acc-0', 0, 'acc', 'Leather belt', 1050000, 'Black'),
  product('prod-0-acc-1', 0, 'acc', 'Gold hoops', 1600000, 'Gold'),

  // Look 1 – Cloud Set
  product('prod-1-top-0', 1, 'tops', 'Half-zip sweatshirt', 1850000, 'Oat'),
  product('prod-1-bot-0', 1, 'bottoms', 'Wide sweatpants', 1700000, 'Oat'),
  product('prod-1-sho-0', 1, 'shoes', 'Chunky sneakers', 3000000, 'White'),

  // Look 2 – Library Knit
  product('prod-2-top-0', 2, 'tops', 'Cable-knit cardigan', 2800000, 'Cream'),
  product('prod-2-top-1', 2, 'tops', 'Cotton tee', 600000, 'White'),
  product('prod-2-bot-0', 2, 'bottoms', 'Pleated wide trousers', 2450000, 'Heather grey'),
  product('prod-2-sho-0', 2, 'shoes', 'Penny loafers', 3750000, 'Brown'),

  // Look 3 – Lilac Run
  product('prod-3-top-0', 3, 'tops', 'Zip training jacket', 2200000, 'Lilac'),
  product('prod-3-top-1', 3, 'tops', 'Sports crop top', 1100000, 'Lilac'),
  product('prod-3-bot-0', 3, 'bottoms', 'High-rise leggings', 1800000, 'Lilac'),
  product('prod-3-sho-0', 3, 'shoes', 'Running sneakers', 3500000, 'White'),

  // Look 4 – Satin Night
  product('prod-4-top-0', 4, 'tops', 'Satin pyjama shirt', 1650000, 'Powder blue'),
  product('prod-4-bot-0', 4, 'bottoms', 'Satin pyjama trousers', 1450000, 'Powder blue'),
  product('prod-4-sho-0', 4, 'shoes', 'Fluffy slippers', 850000, 'Ivory'),

  // Look 5 – Night Suit
  product('prod-5-top-0', 5, 'tops', 'Oversized blazer', 6000000, 'Black'),
  product('prod-5-top-1', 5, 'tops', 'Silk camisole', 2050000, 'Ivory'),
  product('prod-5-bot-0', 5, 'bottoms', 'Straight suit trousers', 4000000, 'Black'),
  product('prod-5-sho-0', 5, 'shoes', 'Pointed heels', 4750000, 'Black'),

  // Look 6 – Sage Slip
  product('prod-6-ful-0', 6, 'full', 'Satin slip midi dress', 4500000, 'Sage'),
  product('prod-6-sho-0', 6, 'shoes', 'Strappy sandals', 3250000, 'Silver'),
  product('prod-6-acc-0', 6, 'acc', 'Fine chain necklace', 1400000, 'Silver'),

  // Look 7 – Bomber Cargo
  product('prod-7-top-0', 7, 'tops', 'Leather bomber', 6500000, 'Black'),
  product('prod-7-top-1', 7, 'tops', 'Crop tee', 550000, 'White'),
  product('prod-7-bot-0', 7, 'bottoms', 'Parachute cargo pants', 2350000, 'Khaki'),
  product('prod-7-sho-0', 7, 'shoes', 'Platform sneakers', 3750000, 'Black'),
];

// In-memory store for dynamic mix & match layer products
const LAYER_PRODUCTS: ProductLayerResponseDto[] = [];

// Seed Pieces for Mix & Match (Scenario A)
const PIECES_STORE: PieceResponseDto[] = [
  {
    id: 'piece-top-denim',
    name: 'Ribbed Crop Tank',
    type: 'top',
    thumbnailUrl: '/uploads/thumb-top-denim.png',
    layerUrl: '/uploads/layer-top-denim.png',
    zIndex: 30,
    priceVND: 950000,
    color: 'Charcoal',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'piece-top-cloud',
    name: 'Half-zip Sweatshirt',
    type: 'top',
    thumbnailUrl: '/uploads/thumb-top-cloud.png',
    layerUrl: '/uploads/layer-top-cloud.png',
    zIndex: 30,
    priceVND: 1850000,
    color: 'Oat',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'piece-bot-maxi',
    name: 'Washed Denim Maxi Skirt',
    type: 'bottom',
    thumbnailUrl: '/uploads/thumb-bot-maxi.png',
    layerUrl: '/uploads/layer-bot-maxi.png',
    zIndex: 20,
    priceVND: 2400000,
    color: 'Light wash',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'piece-bot-sweat',
    name: 'Wide Sweatpants',
    type: 'bottom',
    thumbnailUrl: '/uploads/thumb-bot-sweat.png',
    layerUrl: '/uploads/layer-bot-sweat.png',
    zIndex: 20,
    priceVND: 1700000,
    color: 'Oat',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'piece-dress-sage',
    name: 'Satin Slip Midi Dress',
    type: 'dress',
    thumbnailUrl: '/uploads/thumb-dress-sage.png',
    layerUrl: '/uploads/layer-dress-sage.png',
    zIndex: 25,
    priceVND: 4500000,
    color: 'Sage',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'piece-shoes-boots',
    name: 'Knee-high Leather Boots',
    type: 'shoes',
    thumbnailUrl: '/uploads/thumb-shoes-boots.png',
    layerUrl: '/uploads/layer-shoes-boots.png',
    zIndex: 50,
    priceVND: 5250000,
    color: 'Black',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'piece-shoes-sneakers',
    name: 'Chunky Sneakers',
    type: 'shoes',
    thumbnailUrl: '/uploads/thumb-shoes-sneakers.png',
    layerUrl: '/uploads/layer-shoes-sneakers.png',
    zIndex: 50,
    priceVND: 3000000,
    color: 'White',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'piece-acc-belt',
    name: 'Leather Belt',
    type: 'acc',
    thumbnailUrl: '/uploads/thumb-acc-belt.png',
    layerUrl: '/uploads/layer-acc-belt.png',
    zIndex: 60,
    priceVND: 1050000,
    color: 'Black',
    createdAt: new Date().toISOString(),
  },
];

// Seed Outfits for Mix & Match (Scenario B)
const OUTFITS_STORE: OutfitResponseDto[] = [
  {
    id: 'outfit-denim-maxi',
    name: 'Denim Maxi Signature Set',
    thumbnailUrl: '/uploads/thumb-outfit-denim.png',
    pieceIds: ['piece-top-denim', 'piece-bot-maxi', 'piece-shoes-boots', 'piece-acc-belt'],
    discountPercent: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'outfit-cloud-lounge',
    name: 'Cloud Lounge Set',
    thumbnailUrl: '/uploads/thumb-outfit-cloud.png',
    pieceIds: ['piece-top-cloud', 'piece-bot-sweat', 'piece-shoes-sneakers'],
    discountPercent: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'outfit-sage-evening',
    name: 'Sage Evening Gala',
    thumbnailUrl: '/uploads/thumb-outfit-sage.png',
    pieceIds: ['piece-dress-sage', 'piece-shoes-boots'],
    discountPercent: 15,
    createdAt: new Date().toISOString(),
  },
];

@Injectable()
export class ProductsService {
  findAll(query: QueryProductDto): { data: ProductDto[]; meta: { total: number; page: number; limit: number } } {
    let results = [...PRODUCTS];

    if (query.category) {
      results = results.filter((p) => p.category === query.category);
    }
    if (query.lookId !== undefined) {
      results = results.filter((p) => p.lookId === query.lookId);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const total = results.length;
    const start = (page - 1) * limit;
    const data = results.slice(start, start + limit);

    return { data, meta: { total, page, limit } };
  }

  findOne(id: string): ProductDto {
    const p = PRODUCTS.find((item) => item.id === id);
    if (!p) throw new NotFoundException(`Product "${id}" not found`);
    return p;
  }

  findAllLayers(): ProductLayerResponseDto[] {
    return [...LAYER_PRODUCTS];
  }

  createProductLayer(
    dto: CreateProductLayerDto,
    imageFile?: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ): ProductLayerResponseDto {
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    mkdirSync(uploadsDir, { recursive: true });

    let imageUrl = '';
    if (imageFile && imageFile.buffer) {
      const ext = extname(imageFile.originalname) || '.png';
      const filename = `layer-${randomUUID()}${ext}`;
      writeFileSync(join(uploadsDir, filename), imageFile.buffer);
      imageUrl = `/uploads/${filename}`;
    } else {
      imageUrl = `/uploads/default-${dto.category.toLowerCase()}.png`;
    }

    let thumbnailUrl = '';
    if (thumbnailFile && thumbnailFile.buffer) {
      const ext = extname(thumbnailFile.originalname) || '.png';
      const filename = `thumb-${randomUUID()}${ext}`;
      writeFileSync(join(uploadsDir, filename), thumbnailFile.buffer);
      thumbnailUrl = `/uploads/${filename}`;
    } else {
      thumbnailUrl = imageUrl;
    }

    const layerZIndex =
      dto.layerZIndex !== undefined && !Number.isNaN(Number(dto.layerZIndex))
        ? Number(dto.layerZIndex)
        : CATEGORY_Z_INDEX_MAP[dto.category] ?? 30;

    let excludes = dto.excludes ?? [];
    if (excludes.length === 0) {
      if (dto.category === LayerCategory.DRESS) {
        excludes = [LayerCategory.TOP, LayerCategory.BOTTOM];
      } else if (dto.category === LayerCategory.TOP || dto.category === LayerCategory.BOTTOM) {
        excludes = [LayerCategory.DRESS];
      }
    }

    const newLayer: ProductLayerResponseDto = {
      id: `layer-${randomUUID().substring(0, 8)}`,
      name: dto.name,
      category: dto.category,
      layerZIndex,
      priceVND: Number(dto.priceVND),
      color: dto.color,
      excludes,
      imageUrl,
      thumbnailUrl,
      createdAt: new Date().toISOString(),
    };

    LAYER_PRODUCTS.push(newLayer);
    return newLayer;
  }

  // --- Kịch bản A: Upload một món đồ lẻ (Piece) ---
  findAllPieces(): PieceResponseDto[] {
    return [...PIECES_STORE];
  }

  uploadPiece(
    dto: UploadPieceDto,
    thumbnailFile?: Express.Multer.File,
    layerFile?: Express.Multer.File,
  ): PieceResponseDto {
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    mkdirSync(uploadsDir, { recursive: true });

    let thumbnailUrl = '';
    if (thumbnailFile && thumbnailFile.buffer) {
      const ext = extname(thumbnailFile.originalname) || '.png';
      const filename = `thumb-${randomUUID()}${ext}`;
      writeFileSync(join(uploadsDir, filename), thumbnailFile.buffer);
      thumbnailUrl = `/uploads/${filename}`;
    } else {
      thumbnailUrl = `/uploads/default-piece-thumb.png`;
    }

    let layerUrl = '';
    if (layerFile && layerFile.buffer) {
      const ext = extname(layerFile.originalname) || '.png';
      const filename = `layer-${randomUUID()}${ext}`;
      writeFileSync(join(uploadsDir, filename), layerFile.buffer);
      layerUrl = `/uploads/${filename}`;
    } else {
      layerUrl = `/uploads/default-piece-layer.png`;
    }

    // Auto Z-Index logic: top: 30, bottom: 20, dress: 25, shoes: 50, acc: 60
    const zIndex = PIECE_Z_INDEX_MAP[dto.type] ?? 30;

    const piece: PieceResponseDto = {
      id: `piece-${randomUUID().substring(0, 8)}`,
      name: dto.name,
      type: dto.type,
      thumbnailUrl,
      layerUrl,
      zIndex,
      priceVND: Number(dto.priceVND),
      color: dto.color,
      createdAt: new Date().toISOString(),
    };

    PIECES_STORE.unshift(piece);
    return piece;
  }

  // --- Kịch bản B: Upload một Outfit (Set đồ phối sẵn) ---
  findAllOutfits(): OutfitResponseDto[] {
    return [...OUTFITS_STORE];
  }

  uploadOutfit(
    dto: UploadOutfitDto,
    thumbnailFile?: Express.Multer.File,
  ): OutfitResponseDto {
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    mkdirSync(uploadsDir, { recursive: true });

    let thumbnailUrl = '';
    if (thumbnailFile && thumbnailFile.buffer) {
      const ext = extname(thumbnailFile.originalname) || '.png';
      const filename = `outfit-thumb-${randomUUID()}${ext}`;
      writeFileSync(join(uploadsDir, filename), thumbnailFile.buffer);
      thumbnailUrl = `/uploads/${filename}`;
    } else {
      thumbnailUrl = `/uploads/default-outfit-thumb.png`;
    }

    const outfit: OutfitResponseDto = {
      id: `outfit-${randomUUID().substring(0, 8)}`,
      name: dto.name,
      thumbnailUrl,
      pieceIds: dto.pieceIds || [],
      discountPercent: Number(dto.discountPercent ?? 15),
      createdAt: new Date().toISOString(),
    };

    OUTFITS_STORE.unshift(outfit);
    return outfit;
  }
}
