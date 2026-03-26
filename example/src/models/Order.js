/**
 * Order Model - Mongoose Schema
 */
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  totalAmount: {
    type: Number,
    required: true
  },
  notes: String
}, {
  timestamps: true
});

// Pre-save middleware to calculate total
orderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }
  next();
});

// Instance methods
orderSchema.methods.calculateTotal = function() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

orderSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// Static methods
orderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).populate('user', 'email name.first name.last');
};

orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('user', 'email name.first name.last');
};

orderSchema.statics.getRevenueStats = async function(startDate, endDate) {
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$totalAmount' }
      }
    }
  ]);
  
  return stats[0] || { totalRevenue: 0, orderCount: 0, averageOrderValue: 0 };
};

orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
