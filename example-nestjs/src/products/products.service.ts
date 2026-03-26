import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {}

  async create(createProductDto: any): Promise<Product> {
    const product = new this.productModel(createProductDto);
    return product.save();
  }

  async findAll(options: any = {}): Promise<Product[]> {
    return this.productModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.productModel.find({ category, isActive: true }).exec();
  }

  async search(query: string): Promise<Product[]> {
    return this.productModel.find(
      { $text: { $search: query }, isActive: true },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).exec();
  }

  async findInStock(): Promise<Product[]> {
    return this.productModel.find({
      isActive: true,
      $expr: { $gt: [{ $subtract: ['$inventory.quantity', '$inventory.reserved'] }, 0] }
    }).exec();
  }

  async update(id: string, updates: any): Promise<Product | null> {
    return this.productModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).exec();
  }

  async remove(id: string): Promise<Product | null> {
    return this.productModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true }).exec();
  }
}
