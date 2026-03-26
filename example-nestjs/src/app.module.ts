import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { QueuesModule } from './queues/queues.module';
import { CacheModule } from './cache/cache.module';
import { HealthController } from './health.controller';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://admin:password@localhost:27017/nodeconsole?authSource=admin',
      }),
      inject: [ConfigService],
    }),
    
    // BullMQ (Redis)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
      }),
      inject: [ConfigService],
    }),
    
    // Feature modules
    UsersModule,
    OrdersModule,
    ProductsModule,
    QueuesModule,
    CacheModule,
  ],
  controllers: [HealthController, DashboardController],
})
export class AppModule {}
