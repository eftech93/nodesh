import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    console.log(`Processing email job ${job.id} of type ${job.data.type}`);
    
    switch (job.data.type) {
      case 'welcome':
        return this.sendWelcomeEmail(job.data);
      case 'order_confirmation':
        return this.sendOrderConfirmation(job.data);
      case 'order_shipped':
        return this.sendOrderShipped(job.data);
      case 'test':
        return this.sendTestEmail(job.data);
      default:
        console.log(`Unknown email type: ${job.data.type}`);
        return { sent: false };
    }
  }

  private async sendWelcomeEmail(data: any) {
    console.log(`[EMAIL] Welcome email to ${data.to}, name: ${data.name}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { sent: true, type: 'welcome', to: data.to };
  }

  private async sendOrderConfirmation(data: any) {
    console.log(`[EMAIL] Order confirmation for ${data.orderNumber}, total: ${data.total}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { sent: true, type: 'order_confirmation', orderNumber: data.orderNumber };
  }

  private async sendOrderShipped(data: any) {
    console.log(`[EMAIL] Order shipped notification for ${data.orderNumber}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { sent: true, type: 'order_shipped', orderNumber: data.orderNumber };
  }

  private async sendTestEmail(data: any) {
    console.log(`[EMAIL] Test email to ${data.to}, subject: ${data.subject}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return { sent: true, type: 'test', to: data.to };
  }
}
