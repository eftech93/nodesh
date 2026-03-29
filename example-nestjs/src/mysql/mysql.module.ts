import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Inventory } from './entities/inventory.entity';
import { InventoryService } from './services/inventory.service';
import { InventoryController } from './controllers/inventory.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'mysql',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST', 'localhost'),
        port: configService.get('MYSQL_PORT', 3306),
        username: configService.get('MYSQL_USER', 'admin'),
        password: configService.get('MYSQL_PASSWORD', 'password'),
        database: configService.get('MYSQL_DB', 'nodeconsole'),
        entities: [Inventory],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Inventory], 'mysql'),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService, TypeOrmModule],
})
export class MysqlModule {}
