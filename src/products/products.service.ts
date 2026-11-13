import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductDto } from './dto/product-response.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';

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
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) throw new NotFoundException(`Product "${id}" not found`);
    return product;
  }
}
