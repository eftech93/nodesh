import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: any) {
    const { userId, items, shippingAddress } = createOrderDto;
    return this.ordersService.create(userId, items, shippingAddress);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Query() query: any) {
    return this.ordersService.findByUser(userId, query);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string, @Query() query: any) {
    return this.ordersService.findByStatus(status, query);
  }
}
