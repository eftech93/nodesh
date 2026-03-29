import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { Inventory } from '../entities/inventory.entity';

@Controller('mysql/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(): Promise<Inventory[]> {
    return this.inventoryService.findAll();
  }

  @Get('stats')
  async getStats() {
    return this.inventoryService.getStats();
  }

  @Get('low-stock')
  async getLowStock(@Query('threshold') threshold: string) {
    return this.inventoryService.getLowStock(parseInt(threshold) || 10);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Inventory | null> {
    return this.inventoryService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Inventory>): Promise<Inventory> {
    return this.inventoryService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Inventory>): Promise<Inventory | null> {
    return this.inventoryService.update(id, data);
  }

  @Put(':id/stock')
  async updateStock(@Param('id') id: string, @Body('quantity') quantity: number): Promise<Inventory | null> {
    return this.inventoryService.updateStock(id, quantity);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.inventoryService.remove(id);
  }
}
