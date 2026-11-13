import { Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { ProductsService } from '../products/products.service.js';

@Injectable()
export class OrdersService {
  constructor(
    @Optional()
    private readonly productsService?: ProductsService,
  ) {}

  private isHcmOrHn(province: string): boolean {
    const normalized = (province || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return (
      normalized.includes('ho chi minh') ||
      normalized.includes('hcm') ||
      normalized.includes('ha noi') ||
      normalized.includes('hn')
    );
  }

  create(dto: CreateOrderDto): OrderResponseDto {
    // 1. Calculate subtotal from items
    let subtotal = 0;
    for (const item of dto.items) {
      let unitPrice = 500000; // fallback default
      if (this.productsService) {
        try {
          const product = this.productsService.findOne(item.productId);
          if (product && typeof product.priceVND === 'number') {
            unitPrice = product.priceVND;
          }
        } catch {
          // If not found, unitPrice remains fallback
        }
      }
      subtotal += unitPrice * (item.quantity || 1);
    }

    // 2. Apply coupon discount
    const isVell10 = dto.couponCode?.trim().toUpperCase() === 'VELL10';
    const discountVND = isVell10 ? Math.round(subtotal * 0.1) : 0;
    const discountedTotal = Math.max(0, subtotal - discountVND);

    // 3. Calculate estimated shipping
    let estimatedShippingVND = 0;
    if (discountedTotal < 500000) {
      estimatedShippingVND = this.isHcmOrHn(dto.shippingAddress?.province) ? 30000 : 50000;
    }

    const totalVND = discountedTotal + estimatedShippingVND;
    const orderId = `vell-${randomUUID().substring(0, 8)}`;

    return {
      orderId,
      status: 'pending',
      subtotalVND: subtotal,
      discountVND,
      estimatedShippingVND,
      totalVND,
      paymentMethod: dto.paymentMethod,
      createdAt: new Date().toISOString(),
    };
  }
}
