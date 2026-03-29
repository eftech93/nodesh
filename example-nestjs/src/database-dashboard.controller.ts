import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Order } from './orders/entities/order.entity';
import { Customer } from './postgres/entities/customer.entity';
import { Inventory } from './mysql/entities/inventory.entity';
import { CustomersService } from './postgres/services/customers.service';
import { InventoryService } from './mysql/services/inventory.service';
import { RecommendationsService } from './neo4j/services/recommendations.service';
import { AnalyticsService } from './dynamodb/services/analytics.service';

@Controller('dashboard')
export class DatabaseDashboardController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectRepository(Customer, 'postgres') private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Inventory, 'mysql') private readonly inventoryRepository: Repository<Inventory>,
    private readonly customersService: CustomersService,
    private readonly inventoryService: InventoryService,
    private readonly recommendationsService: RecommendationsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('all-stats')
  async getAllStats() {
    const [
      mongoStats,
      postgresStats,
      mysqlStats,
      neo4jStats,
      dynamoStats,
    ] = await Promise.all([
      this.getMongoStats(),
      this.getPostgresStats(),
      this.getMysqlStats(),
      this.getNeo4jStats(),
      this.getDynamoStats(),
    ]);

    return {
      mongodb: mongoStats,
      postgresql: postgresStats,
      mysql: mysqlStats,
      neo4j: neo4jStats,
      dynamodb: dynamoStats,
    };
  }

  @Get('mongodb')
  async getMongoStats() {
    const [users, products, orders] = await Promise.all([
      this.userModel.countDocuments(),
      this.productModel.countDocuments(),
      this.orderModel.countDocuments(),
    ]);

    const recentOrders = await this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'email name.first name.last')
      .exec();

    return {
      status: 'connected',
      collections: {
        users,
        products,
        orders,
      },
      recentOrders,
    };
  }

  @Get('postgresql')
  async getPostgresStats() {
    const stats = await this.customersService.getStats();
    const recentCustomers = await this.customerRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      status: 'connected',
      ...stats,
      recentCustomers,
    };
  }

  @Get('mysql')
  async getMysqlStats() {
    const stats = await this.inventoryService.getStats();
    const lowStock = await this.inventoryService.getLowStock(20);
    const recentItems = await this.inventoryRepository.find({
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    return {
      status: 'connected',
      ...stats,
      lowStock,
      recentItems,
    };
  }

  @Get('neo4j')
  async getNeo4jStats() {
    try {
      const stats = await this.recommendationsService.getStats();
      return {
        status: 'connected',
        ...stats,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('dynamodb')
  async getDynamoStats() {
    try {
      const stats = await this.analyticsService.getStats();
      return {
        status: 'connected',
        ...stats,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }
}
