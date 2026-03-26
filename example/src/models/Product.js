/**
 * Product Model - Mongoose Schema
 */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  tags: [String],
  inventory: {
    quantity: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    manufacturer: String
  }
}, {
  timestamps: true
});

// Indexes for common queries
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });

// Virtual for available quantity
productSchema.virtual('availableQuantity').get(function() {
  return this.inventory.quantity - this.inventory.reserved;
});

// Instance methods
productSchema.methods.isInStock = function() {
  return this.availableQuantity > 0;
};

productSchema.methods.reserve = async function(quantity) {
  if (this.availableQuantity < quantity) {
    throw new Error('Insufficient inventory');
  }
  this.inventory.reserved += quantity;
  return this.save();
};

productSchema.methods.release = async function(quantity) {
  this.inventory.reserved = Math.max(0, this.inventory.reserved - quantity);
  return this.save();
};

productSchema.methods.sell = async function(quantity) {
  if (this.availableQuantity < quantity) {
    throw new Error('Insufficient inventory');
  }
  this.inventory.quantity -= quantity;
  this.inventory.reserved = Math.max(0, this.inventory.reserved - quantity);
  return this.save();
};

// Static methods
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

productSchema.statics.search = function(query) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

productSchema.statics.findInStock = function() {
  return this.find({
    isActive: true,
    $expr: { $gt: [{ $subtract: ['$inventory.quantity', '$inventory.reserved'] }, 0] }
  });
};

productSchema.statics.getLowStock = function(threshold = 10) {
  return this.find({
    isActive: true,
    $expr: { $lte: [{ $subtract: ['$inventory.quantity', '$inventory.reserved'] }, threshold] }
  });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
