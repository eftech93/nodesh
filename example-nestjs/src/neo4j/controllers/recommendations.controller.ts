import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { RecommendationsService } from '../services/recommendations.service';

@Controller('neo4j/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('stats')
  async getStats() {
    return this.recommendationsService.getStats();
  }

  @Get(':productId')
  async getRecommendations(
    @Param('productId') productId: string,
    @Query('limit') limit: string,
  ) {
    return this.recommendationsService.getRecommendations(productId, parseInt(limit) || 5);
  }

  @Get('customer/:customerId')
  async getCustomerRecommendations(
    @Param('customerId') customerId: string,
    @Query('limit') limit: string,
  ) {
    return this.recommendationsService.getCustomerRecommendations(customerId, parseInt(limit) || 5);
  }

  @Post('view')
  async createProductView(
    @Body('customerId') customerId: string,
    @Body('productId') productId: string,
  ) {
    return this.recommendationsService.createProductView(customerId, productId);
  }
}
