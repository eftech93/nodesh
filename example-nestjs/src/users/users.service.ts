import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CacheService } from '../cache/cache.service';
import { QueuesService } from '../queues/queues.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cacheService: CacheService,
    private readonly queuesService: QueuesService,
  ) {}

  async create(createUserDto: any): Promise<User> {
    const user = new this.userModel(createUserDto);
    await user.save();
    
    // Cache the new user
    await this.cacheService.cacheUser(user._id.toString(), user.toJSON());
    await this.cacheService.set(`user:email:${user.email}`, user.toJSON());
    
    // Queue welcome email
    await this.queuesService.addEmailJob({
      type: 'welcome',
      to: user.email,
      name: user.fullName,
    });
    
    return user;
  }

  async findAll(options: any = {}): Promise<{ users: User[]; pagination: any }> {
    const { page = 1, limit = 10 } = options;
    
    const users = await this.userModel
      .find({ isActive: true })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    
    const total = await this.userModel.countDocuments({ isActive: true });
    
    return {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<User | null> {
    // Try cache first
    const cached = await this.cacheService.getCachedUser(id);
    if (cached) return cached as User;
    
    const user = await this.userModel.findById(id).exec();
    if (user) {
      await this.cacheService.cacheUser(id, user.toJSON());
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cached = await this.cacheService.get(`user:email:${email}`);
    if (cached) return cached as User;
    
    const user = await (this.userModel as any).findByEmail(email).exec();
    if (user) {
      await this.cacheService.set(`user:email:${email}`, user.toJSON());
    }
    return user;
  }

  async update(id: string, updates: any): Promise<User | null> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .exec();
    
    if (user) {
      await this.cacheService.cacheUser(id, user.toJSON());
      await this.cacheService.set(`user:email:${user.email}`, user.toJSON());
    }
    
    return user;
  }

  async remove(id: string): Promise<User | null> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
      .exec();
    
    if (user) {
      await this.cacheService.invalidateUser(id);
      await this.cacheService.delete(`user:email:${user.email}`);
    }
    
    return user;
  }

  async authenticate(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    
    if (!user || !user.isActive) return null;
    
    const isValid = await user.comparePassword(password);
    if (!isValid) return null;
    
    await user.recordLogin();
    return user;
  }

  async getStats(): Promise<any> {
    const total = await this.userModel.countDocuments();
    const active = await this.userModel.countDocuments({ isActive: true });
    const byRole = await this.userModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    
    return { total, active, byRole };
  }
}
