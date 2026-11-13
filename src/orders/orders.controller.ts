import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order placed successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on request body',
  })
  create(@Body() dto: CreateOrderDto): OrderResponseDto {
    return this.ordersService.create(dto);
  }
}
