/**
 * User Service - Business logic for user operations
 */
import { User, IUser } from '../models/User';
import { redisClient } from '../../lib/db';

const CACHE_PREFIX = 'user:';
const CACHE_TTL = 300; // 5 minutes

export class UserService {
  /**
   * Create a new user
   */
  static async create(userData: {
    email: string;
    password: string;
    name: { first: string; last: string };
    role?: 'user' | 'admin';
  }): Promise<IUser> {
    const user = new User(userData);
    await user.save();
    
    // Invalidate cache
    await this.invalidateCache(user.email);
    
    return user;
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<IUser | null> {
    // Try cache first
    const cached = await this.getFromCache(`id:${id}`);
    if (cached) return cached;

    const user = await User.findById(id);
    if (user) {
      await this.setCache(`id:${id}`, user);
    }
    return user;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    const cacheKey = `email:${email.toLowerCase()}`;
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;

    const user = await User.findByEmail(email);
    if (user) {
      await this.setCache(cacheKey, user);
    }
    return user;
  }

  /**
   * Get all active users
   */
  static async findActive(): Promise<IUser[]> {
    return User.findActive().sort({ createdAt: -1 });
  }

  /**
   * Get all users with pagination
   */
  static async findAll(page = 1, limit = 10): Promise<{
    users: IUser[];
    pagination: { total: number; page: number; pages: number };
  }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user
   */
  static async update(
    id: string,
    updateData: Partial<Pick<IUser, 'name' | 'isActive' | 'role'>>
  ): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (user) {
      await this.invalidateCache(user.email);
      await this.invalidateCache(`id:${id}`);
    }

    return user;
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  static async deactivate(id: string): Promise<IUser | null> {
    return this.update(id, { isActive: false });
  }

  /**
   * Authenticate user
   */
  static async authenticate(
    email: string,
    password: string
  ): Promise<IUser | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive) return null;

    const isMatch = await user.comparePassword(password);
    return isMatch ? user : null;
  }

  /**
   * Get user statistics
   */
  static async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
  }> {
    const [total, active, inactive, admins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: 'admin' }),
    ]);

    return { total, active, inactive, admins };
  }

  // Cache helpers
  private static async getFromCache(key: string): Promise<IUser | null> {
    try {
      const cached = await redisClient.get(`${CACHE_PREFIX}${key}`);
      if (cached) {
        // Note: In production, you'd deserialize properly
        return JSON.parse(cached) as IUser;
      }
    } catch (e) {
      // Cache miss or error
    }
    return null;
  }

  private static async setCache(key: string, user: IUser): Promise<void> {
    try {
      await redisClient.setex(
        `${CACHE_PREFIX}${key}`,
        CACHE_TTL,
        JSON.stringify(user)
      );
    } catch (e) {
      // Cache error - ignore
    }
  }

  private static async invalidateCache(emailOrKey: string): Promise<void> {
    try {
      const patterns = [
        `${CACHE_PREFIX}email:${emailOrKey.toLowerCase()}`,
        `${CACHE_PREFIX}*`,
      ];
      
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (e) {
      // Cache error - ignore
    }
  }
}
