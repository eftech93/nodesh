import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, unique: true, uppercase: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, index: true })
  category: string;

  @Prop([String])
  tags: string[];

  @Prop({ type: Object, default: { quantity: 0, reserved: 0 } })
  inventory: {
    quantity: number;
    reserved: number;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Text index for search
ProductSchema.index({ name: 'text', description: 'text' });

// Virtual for available quantity
ProductSchema.virtual('availableQuantity').get(function() {
  return this.inventory.quantity - this.inventory.reserved;
});

// Methods
ProductSchema.methods.isInStock = function() {
  return this.availableQuantity > 0;
};
