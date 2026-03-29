import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { Customer } from '../entities/customer.entity';

@Controller('postgres/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Get('stats')
  async getStats() {
    return this.customersService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Customer | null> {
    return this.customersService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<Customer>): Promise<Customer> {
    return this.customersService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Customer>): Promise<Customer | null> {
    return this.customersService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.customersService.remove(id);
  }
}
