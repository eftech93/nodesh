import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'notification' },
      { name: 'report' },
    ),
  ],
  providers: [QueuesService, EmailProcessor, NotificationProcessor],
  exports: [QueuesService],
})
export class QueuesModule {}
