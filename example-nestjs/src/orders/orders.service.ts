import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './entities/order.entity';
import { QueuesService } from '../queues/queues.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly queuesService: QueuesService,
  ) {}

  async create(userId: string, items: any[], shippingAddress: any): Promise<Order> {
    // Note: In a real app, you'd validate inventory here
    
    const order = new this.orderModel({
      user: userId,
      orderNumber: (this.orderModel as any).generateOrderNumber(),
      items,
      shippingAddress,
      status: 'pending',
    });
    
    await order.save();
    
    // Queue notifications
    await this.queuesService.addNotificationJob({
      type: 'order_created',
      userId,
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
    
    await this.queuesService.addEmailJob({
      type: 'order_confirmation',
      to: null,
      orderNumber: order.orderNumber,
      total: order.totalAmount,
    });
    
    return order.populate('user', 'email name.first name.last');
  }

  async findById(id: string): Promise<Order | null> {
    return this.orderModel.findById(id).populate('user', 'email name.first name.last').exec();
  }

  async findByUser(userId: string, options: any = {}): Promise<{ orders: Order[]; pagination: any }> {
    const { page = 1, limit = 10 } = options;
    
    const orders = await (this.orderModel as any)
      .findByUser(userId)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    
    const total = await this.orderModel.countDocuments({ user: userId });
    
    return { orders, pagination: { page, limit, total } };
  }

  async updateStatus(id: string, newStatus: string): Promise<Order | null> {
    const order = await this.orderModel.findById(id).populate('user').exec();
    
    if (!order) return null;
    
    const oldStatus = order.status;
    order.status = newStatus;
    await order.save();
    
    // Handle status changes
    if (newStatus === 'shipped') {
      await this.queuesService.addEmailJob({
        type: 'order_shipped',
        to: (order.user as any).email,
        orderNumber: order.orderNumber,
      });
    } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      await this.queuesService.addNotificationJob({
        type: 'order_cancelled',
        userId: (order.user as any)._id,
        orderId: order._id,
      });
    }
    
    return order;
  }

  async findByStatus(status: string, options: any = {}): Promise<{ orders: Order[]; pagination: any }> {
    const { page = 1, limit = 20 } = options;
    
    const orders = await (this.orderModel as any)
      .findByStatus(status)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    
    const total = await this.orderModel.countDocuments({ status });
    
    return { orders, pagination: { page, limit, total } };
  }

  async getRevenueStats(startDate?: Date, endDate?: Date): Promise<any> {
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }
    
    const stats = await this.orderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' },
        },
      },
    ]);
    
    return stats[0] || { totalRevenue: 0, orderCount: 0, averageOrderValue: 0 };
  }

  async getDashboardStats(): Promise<any> {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      todayOrders,
      revenueStats,
    ] = await Promise.all([
      this.orderModel.countDocuments(),
      this.orderModel.countDocuments({ status: 'pending' }),
      this.orderModel.countDocuments({ status: 'processing' }),
      this.orderModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      this.getRevenueStats(),
    ]);
    
    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      todayOrders,
      totalRevenue: revenueStats.totalRevenue,
      averageOrderValue: revenueStats.averageOrderValue,
    };
  }
}
