import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/entities/user.entity';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user: User;

  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop([{
    product: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  }])
  items: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;

  @Prop({ enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending', index: true })
  status: string;

  @Prop({ type: Object })
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Prop({ required: true })
  totalAmount: number;

  @Prop()
  notes: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Pre-save middleware
OrderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  next();
});

// Static methods
OrderSchema.statics.findByUser = function(userId: string) {
  return this.find({ user: userId }).populate('user', 'email name.first name.last');
};

OrderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).populate('user', 'email name.first name.last');
};

OrderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};
