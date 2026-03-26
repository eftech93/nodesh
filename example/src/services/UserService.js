/**
 * User Service - Business logic for user operations
 */
const User = require('../models/User');
const { getCache, setCache, deleteCache } = require('../config/redis');
const { addEmailJob } = require('../config/queue');

const CACHE_TTL = 3600; // 1 hour
const USER_CACHE_KEY = (id) => `user:${id}`;
const USER_EMAIL_CACHE_KEY = (email) => `user:email:${email}`;

class UserService {
  /**
   * Create a new user
   */
  async create(data) {
    const user = new User(data);
    await user.save();
    
    // Cache the new user
    await setCache(USER_CACHE_KEY(user._id), user.toJSON(), CACHE_TTL);
    await setCache(USER_EMAIL_CACHE_KEY(user.email), user.toJSON(), CACHE_TTL);
    
    // Queue welcome email
    await addEmailJob({
      type: 'welcome',
      to: user.email,
      name: user.fullName
    });
    
    return user;
  }

  /**
   * Find user by ID (with caching)
   */
  async findById(id) {
    // Try cache first
    const cached = await getCache(USER_CACHE_KEY(id));
    if (cached) {
      return cached;
    }
    
    const user = await User.findById(id);
    if (user) {
      await setCache(USER_CACHE_KEY(id), user.toJSON(), CACHE_TTL);
    }
    return user;
  }

  /**
   * Find user by email (with caching)
   */
  async findByEmail(email) {
    const cached = await getCache(USER_EMAIL_CACHE_KEY(email));
    if (cached) {
      return cached;
    }
    
    const user = await User.findByEmail(email);
    if (user) {
      await setCache(USER_EMAIL_CACHE_KEY(email), user.toJSON(), CACHE_TTL);
    }
    return user;
  }

  /**
   * Get all active users
   */
  async findActive(options = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = options;
    
    const users = await User.findActive()
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    
    const total = await User.countDocuments({ isActive: true });
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update user
   */
  async update(id, updates) {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (user) {
      // Update cache
      await setCache(USER_CACHE_KEY(id), user.toJSON(), CACHE_TTL);
      await setCache(USER_EMAIL_CACHE_KEY(user.email), user.toJSON(), CACHE_TTL);
    }
    
    return user;
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id) {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (user) {
      // Clear cache
      await deleteCache(USER_CACHE_KEY(id));
      await deleteCache(USER_EMAIL_CACHE_KEY(user.email));
    }
    
    return user;
  }

  /**
   * Authenticate user
   */
  async authenticate(email, password) {
    const user = await User.findByEmail(email);
    
    if (!user || !user.isActive) {
      return null;
    }
    
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return null;
    }
    
    // Record login
    await user.recordLogin();
    
    return user;
  }

  /**
   * Get user statistics
   */
  async getStats() {
    return User.getStats();
  }

  /**
   * Clear user cache
   */
  async clearCache(userId) {
    const user = await User.findById(userId);
    if (user) {
      await deleteCache(USER_CACHE_KEY(userId));
      await deleteCache(USER_EMAIL_CACHE_KEY(user.email));
    }
  }
}

module.exports = new UserService();
