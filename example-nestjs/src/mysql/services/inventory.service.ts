import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';

@Injectable()
export class InventoryService implements OnModuleInit {
  constructor(
    @InjectRepository(Inventory, 'mysql')
    private readonly inventoryRepository: Repository<Inventory>,
  ) {}

  async onModuleInit() {
    const count = await this.inventoryRepository.count();
    if (count === 0) {
      await this.seedInventory();
    }
  }

  private async seedInventory() {
    const items = [
      { sku: 'LAPTOP-001', productName: 'Gaming Laptop', quantity: 50, unitPrice: 1299.99, warehouse: 'NYC' },
      { sku: 'MOUSE-001', productName: 'Wireless Mouse', quantity: 200, unitPrice: 29.99, warehouse: 'NYC' },
      { sku: 'KEYBD-001', productName: 'Mechanical Keyboard', quantity: 100, unitPrice: 149.99, warehouse: 'LA' },
    ];
    
    for (const item of items) {
      const inventory = this.inventoryRepository.create(item);
      await this.inventoryRepository.save(inventory);
    }
    console.log('✅ MySQL: Inventory seeded');
  }

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find();
  }

  async findOne(id: string): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({ where: { id } });
  }

  async findBySku(sku: string): Promise<Inventory | null> {
    return this.inventoryRepository.findOne({ where: { sku } });
  }

  async create(data: Partial<Inventory>): Promise<Inventory> {
    const item = this.inventoryRepository.create(data);
    return this.inventoryRepository.save(item);
  }

  async update(id: string, data: Partial<Inventory>): Promise<Inventory | null> {
    await this.inventoryRepository.update(id, data);
    return this.findOne(id);
  }

  async updateStock(id: string, quantity: number): Promise<Inventory | null> {
    await this.inventoryRepository.increment({ id }, 'quantity', quantity);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.inventoryRepository.delete(id);
  }

  async getLowStock(threshold: number = 10) {
    return this.inventoryRepository.find({
      where: { quantity: threshold },
      order: { quantity: 'ASC' },
    });
  }

  async getStats() {
    const total = await this.inventoryRepository.count();
    const lowStock = await this.inventoryRepository.count({ where: { quantity: 10 } });
    const totalValue = await this.inventoryRepository
      .createQueryBuilder('inv')
      .select('SUM(inv.quantity * inv.unitPrice)', 'value')
      .getRawOne();
    
    return { total, lowStock, totalValue: totalValue?.value || 0 };
  }
}
