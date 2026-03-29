import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecommendationsService } from './services/recommendations.service';
import { RecommendationsController } from './controllers/recommendations.controller';

@Module({
  imports: [ConfigModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class Neo4jModule {}
