import { Injectable, NotFoundException } from '@nestjs/common';
import { LookDto } from './dto/look-response.dto.js';

const LOOKS: LookDto[] = [
  {
    id: 0,
    name: 'Denim Maxi',
    category: 'everyday',
    priceFromVND: 950000,
    pieces: {
      tops: [{ name: 'Ribbed crop tank', color: 'Charcoal', priceVND: 950000 }],
      bottoms: [{ name: 'Washed denim maxi skirt', color: 'Light wash', priceVND: 2400000 }],
      full: [],
      shoes: [{ name: 'Knee-high leather boots', color: 'Black', priceVND: 5250000 }],
      acc: [
        { name: 'Leather belt', color: 'Black', priceVND: 1050000 },
        { name: 'Gold hoops', color: '14k', priceVND: 1600000 },
      ],
    },
  },
  {
    id: 1,
    name: 'Cloud Set',
    category: 'everyday',
    priceFromVND: 1600000,
    pieces: {
      tops: [{ name: 'Half-zip sweatshirt', color: 'Oat', priceVND: 1850000 }],
      bottoms: [{ name: 'Wide sweatpants', color: 'Oat', priceVND: 1700000 }],
      full: [],
      shoes: [{ name: 'Chunky sneakers', color: 'White', priceVND: 3000000 }],
      acc: [{ name: 'Gold hoops', color: '14k', priceVND: 1600000 }],
    },
  },
  {
    id: 2,
    name: 'Library Knit',
    category: 'everyday',
    priceFromVND: 600000,
    pieces: {
      tops: [
        { name: 'Cable-knit cardigan', color: 'Cream', priceVND: 2800000 },
        { name: 'Cotton tee', color: 'White', priceVND: 600000 },
      ],
      bottoms: [{ name: 'Pleated wide trousers', color: 'Heather grey', priceVND: 2450000 }],
      full: [],
      shoes: [{ name: 'Penny loafers', color: 'Brown', priceVND: 3750000 }],
      acc: [],
    },
  },
  {
    id: 3,
    name: 'Lilac Run',
    category: 'athletic',
    priceFromVND: 1100000,
    pieces: {
      tops: [
        { name: 'Zip training jacket', color: 'Lilac', priceVND: 2200000 },
        { name: 'Sports crop top', color: 'Lilac', priceVND: 1100000 },
      ],
      bottoms: [{ name: 'High-rise leggings', color: 'Lilac', priceVND: 1800000 }],
      full: [],
      shoes: [{ name: 'Running sneakers', color: 'White', priceVND: 3500000 }],
      acc: [],
    },
  },
  {
    id: 4,
    name: 'Satin Night',
    category: 'sleep',
    priceFromVND: 850000,
    pieces: {
      tops: [{ name: 'Satin pyjama shirt', color: 'Powder blue', priceVND: 1650000 }],
      bottoms: [{ name: 'Satin pyjama trousers', color: 'Powder blue', priceVND: 1450000 }],
      full: [],
      shoes: [{ name: 'Fluffy slippers', color: 'Ivory', priceVND: 850000 }],
      acc: [],
    },
  },
  {
    id: 5,
    name: 'Night Suit',
    category: 'formal',
    priceFromVND: 2050000,
    pieces: {
      tops: [
        { name: 'Oversized blazer', color: 'Black', priceVND: 6000000 },
        { name: 'Silk camisole', color: 'Ivory', priceVND: 2050000 },
      ],
      bottoms: [{ name: 'Straight suit trousers', color: 'Black', priceVND: 4000000 }],
      full: [],
      shoes: [{ name: 'Pointed heels', color: 'Black', priceVND: 4750000 }],
      acc: [],
    },
  },
  {
    id: 6,
    name: 'Sage Slip',
    category: 'party',
    priceFromVND: 1400000,
    pieces: {
      tops: [],
      bottoms: [],
      full: [{ name: 'Satin slip midi dress', color: 'Sage', priceVND: 4500000 }],
      shoes: [{ name: 'Strappy sandals', color: 'Silver', priceVND: 3250000 }],
      acc: [{ name: 'Fine chain necklace', color: 'Silver', priceVND: 1400000 }],
    },
  },
  {
    id: 7,
    name: 'Bomber Cargo',
    category: 'street',
    priceFromVND: 550000,
    pieces: {
      tops: [
        { name: 'Leather bomber', color: 'Black', priceVND: 6500000 },
        { name: 'Crop tee', color: 'White', priceVND: 550000 },
      ],
      bottoms: [{ name: 'Parachute cargo pants', color: 'Khaki', priceVND: 2350000 }],
      full: [],
      shoes: [{ name: 'Platform sneakers', color: 'Black', priceVND: 3750000 }],
      acc: [],
    },
  },
];

@Injectable()
export class LooksService {
  findAll(): { data: LookDto[]; meta: { total: number } } {
    return { data: LOOKS, meta: { total: LOOKS.length } };
  }

  findOne(id: number): LookDto {
    const look = LOOKS.find((l) => l.id === id);
    if (!look) throw new NotFoundException(`Look #${id} not found`);
    return look;
  }
}
