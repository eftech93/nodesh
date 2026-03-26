import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { OrdersService } from './orders/orders.service';
import { QueuesService } from './queues/queues.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    private readonly queuesService: QueuesService,
  ) {}

  @Get('stats')
  async getStats() {
    const [orderStats, userStats, queueStatuses] = await Promise.all([
      this.ordersService.getDashboardStats(),
      this.usersService.getStats(),
      this.queuesService.getAllStatuses(),
    ]);

    return {
      orders: orderStats,
      users: userStats,
      queues: queueStatuses,
    };
  }
}
