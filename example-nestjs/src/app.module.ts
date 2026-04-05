import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { QueuesModule } from './queues/queues.module';
import { CacheModule } from './cache/cache.module';
import { PostgresModule } from './postgres/postgres.module';
import { MysqlModule } from './mysql/mysql.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { DynamodbModule } from './dynamodb/dynamodb.module';
import { ApiModule } from './api/api.module';
import { HealthController } from './health.controller';
import { DashboardController } from './dashboard.controller';
import { DatabaseDashboardController } from './database-dashboard.controller';

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
          url: configService.get<string>('REDIS_URL') || `redis://${configService.get<string>('REDIS_HOST') || 'localhost'}:${configService.get<string>('REDIS_PORT') || '6379'}`,
        },
      }),
      inject: [ConfigService],
    }),
    
    // Core modules (import before feature modules that depend on them)
    ApiModule,
    QueuesModule,
    CacheModule,
    
    // Feature modules
    UsersModule,
    OrdersModule,
    ProductsModule,
    
    // Additional Database Modules
    PostgresModule,
    MysqlModule,
    Neo4jModule,
    DynamodbModule,
  ],
  controllers: [HealthController, DashboardController, DatabaseDashboardController],
})
export class AppModule {}
