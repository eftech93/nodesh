import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { InjectRedis } from './cache/redis.decorator';
import Redis from 'ioredis';

@Controller()
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Get('health')
  async health() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'checking...',
        redis: 'checking...',
      },
    };

    // Check MongoDB
    try {
      await this.connection.db.admin().ping();
      health.services.mongodb = 'connected';
    } catch (err) {
      health.services.mongodb = 'disconnected';
      health.status = 'degraded';
    }

    // Check Redis
    try {
      await this.redis.ping();
      health.services.redis = 'connected';
    } catch (err) {
      health.services.redis = 'disconnected';
      health.status = 'degraded';
    }

    return health;
  }
}
