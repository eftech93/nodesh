import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`Processing notification job ${job.id} of type ${job.data.type}`);
    
    switch (job.data.type) {
      case 'order_created':
        return this.notifyOrderCreated(job.data);
      case 'order_cancelled':
        return this.notifyOrderCancelled(job.data);
      case 'test':
        return this.sendTestNotification(job.data);
      default:
        console.log(`Unknown notification type: ${job.data.type}`);
        return { sent: false };
    }
  }

  private async notifyOrderCreated(data: any) {
    console.log(`[NOTIFICATION] Order created: ${data.orderNumber} for user ${data.userId}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return { sent: true, type: 'order_created', userId: data.userId };
  }

  private async notifyOrderCancelled(data: any) {
    console.log(`[NOTIFICATION] Order cancelled: ${data.orderId}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return { sent: true, type: 'order_cancelled', orderId: data.orderId };
  }

  private async sendTestNotification(data: any) {
    console.log(`[NOTIFICATION] Test notification to user ${data.userId}: ${data.message}`);
    await new Promise(resolve => setTimeout(resolve, 50));
    return { sent: true, type: 'test', userId: data.userId };
  }
}
