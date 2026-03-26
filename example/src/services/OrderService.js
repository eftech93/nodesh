/**
 * Order Service - Business logic for order operations
 */
const Order = require('../models/Order');
const Product = require('../models/Product');
const { addNotificationJob, addEmailJob } = require('../config/queue');

class OrderService {
  /**
   * Create a new order
   */
  async create(userId, items, shippingAddress) {
    // Validate and reserve inventory
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      
      if (!product.isInStock() || product.availableQuantity < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }
      
      // Reserve inventory
      await product.reserve(item.quantity);
      
      orderItems.push({
        product: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }
    
    // Create order
    const order = new Order({
      user: userId,
      orderNumber: Order.generateOrderNumber(),
      items: orderItems,
      shippingAddress,
      status: 'pending'
    });
    
    await order.save();
    
    // Queue notifications
    await addNotificationJob({
      type: 'order_created',
      userId,
      orderId: order._id,
      orderNumber: order.orderNumber
    });
    
    await addEmailJob({
      type: 'order_confirmation',
      to: null, // Will be filled by worker
      orderNumber: order.orderNumber,
      total: order.totalAmount
    });
    
    return order.populate('user', 'email name.first name.last');
  }

  /**
   * Get order by ID
   */
  async findById(id) {
    return Order.findById(id).populate('user', 'email name.first name.last');
  }

  /**
   * Get orders by user
   */
  async findByUser(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    
    const orders = await Order.findByUser(userId)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Order.countDocuments({ user: userId });
    
    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  /**
   * Update order status
   */
  async updateStatus(orderId, newStatus) {
    const order = await Order.findById(orderId).populate('user');
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    const oldStatus = order.status;
    await order.updateStatus(newStatus);
    
    // Handle status-specific logic
    if (newStatus === 'shipped') {
      // Release reservation and sell
      for (const item of order.items) {
        // Find product by name (simplified - in real app use product ID)
      }
      
      await addEmailJob({
        type: 'order_shipped',
        to: order.user.email,
        orderNumber: order.orderNumber
      });
    } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      // Release reservations
      await addNotificationJob({
        type: 'order_cancelled',
        userId: order.user._id,
        orderId: order._id
      });
    }
    
    return order;
  }

  /**
   * Get orders by status
   */
  async findByStatus(status, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    const orders = await Order.findByStatus(status)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await Order.countDocuments({ status });
    
    return { orders, pagination: { page, limit, total } };
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(startDate, endDate) {
    return Order.getRevenueStats(startDate, endDate);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      todayOrders,
      revenueStats
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'processing' }),
      Order.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      Order.getRevenueStats()
    ]);
    
    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      todayOrders,
      totalRevenue: revenueStats.totalRevenue,
      averageOrderValue: revenueStats.averageOrderValue
    };
  }
}

module.exports = new OrderService();
