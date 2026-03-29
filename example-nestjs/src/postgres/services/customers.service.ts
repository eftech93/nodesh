import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomersService implements OnModuleInit {
  constructor(
    @InjectRepository(Customer, 'postgres')
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async onModuleInit() {
    // Seed some initial data
    const count = await this.customerRepository.count();
    if (count === 0) {
      await this.seedCustomers();
    }
  }

  private async seedCustomers() {
    const customers = [
      { email: 'john@example.com', firstName: 'John', lastName: 'Doe', phone: '555-0101' },
      { email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith', phone: '555-0102' },
      { email: 'bob@example.com', firstName: 'Bob', lastName: 'Johnson', phone: '555-0103' },
    ];
    
    for (const customerData of customers) {
      const customer = this.customerRepository.create(customerData);
      await this.customerRepository.save(customer);
    }
    console.log('✅ PostgreSQL: Customers seeded');
  }

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find();
  }

  async findOne(id: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { email } });
  }

  async create(data: Partial<Customer>): Promise<Customer> {
    const customer = this.customerRepository.create(data);
    return this.customerRepository.save(customer);
  }

  async update(id: string, data: Partial<Customer>): Promise<Customer | null> {
    await this.customerRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.customerRepository.delete(id);
  }

  async getStats() {
    const total = await this.customerRepository.count();
    const active = await this.customerRepository.count({ where: { isActive: true } });
    return { total, active, inactive: total - active };
  }
}
