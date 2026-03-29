import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';

@Controller('dynamodb/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  async getStats() {
    return this.analyticsService.getStats();
  }

  @Get('events/:eventType')
  async getEventsByType(
    @Param('eventType') eventType: string,
    @Query('limit') limit: string,
  ) {
    return this.analyticsService.getEventsByType(eventType, parseInt(limit) || 50);
  }

  @Get('events')
  async getRecentEvents(@Query('limit') limit: string) {
    return this.analyticsService.getRecentEvents(parseInt(limit) || 50);
  }

  @Post('pageview')
  async recordPageView(
    @Body('page') page: string,
    @Body('userId') userId?: string,
  ) {
    return this.analyticsService.recordPageView(page, userId);
  }

  @Post('purchase')
  async recordPurchase(
    @Body('orderId') orderId: string,
    @Body('amount') amount: number,
    @Body('customerId') customerId: string,
  ) {
    return this.analyticsService.recordPurchase(orderId, amount, customerId);
  }
}
