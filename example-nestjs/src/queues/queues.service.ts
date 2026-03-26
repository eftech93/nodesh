import { Injectable, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
    @InjectQueue('report') private readonly reportQueue: Queue,
  ) {}

  async addEmailJob(data: any, options = {}) {
    return this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      ...options,
    });
  }

  async addNotificationJob(data: any, options = {}) {
    return this.notificationQueue.add('send-notification', data, {
      attempts: 2,
      ...options,
    });
  }

  async addReportJob(data: any, options = {}) {
    return this.reportQueue.add('generate-report', data, {
      attempts: 1,
      ...options,
    });
  }

  async getQueueStatus(queueName: 'email' | 'notification' | 'report') {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }

  async getAllStatuses() {
    return {
      email: await this.getQueueStatus('email'),
      notification: await this.getQueueStatus('notification'),
      report: await this.getQueueStatus('report'),
    };
  }

  async getRecentJobs(queueName: 'email' | 'notification' | 'report', status = 'completed', count = 10) {
    const queue = this.getQueue(queueName);
    let jobs;
    
    switch (status) {
      case 'completed':
        jobs = await queue.getCompleted(0, count - 1);
        break;
      case 'failed':
        jobs = await queue.getFailed(0, count - 1);
        break;
      case 'waiting':
        jobs = await queue.getWaiting(0, count - 1);
        break;
      case 'active':
        jobs = await queue.getActive(0, count - 1);
        break;
      default:
        jobs = [];
    }

    return jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      attempts: job.attemptsMade,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
    }));
  }

  async cleanQueue(queueName: 'email' | 'notification' | 'report', status: string, maxCount = 100) {
    const queue = this.getQueue(queueName);
    await queue.clean(0, maxCount, status as any);
    return true;
  }

  async getJobCounts(queueName: 'email' | 'notification' | 'report') {
    const queue = this.getQueue(queueName);
    return queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
  }

  private getQueue(name: string): Queue {
    switch (name) {
      case 'email':
        return this.emailQueue;
      case 'notification':
        return this.notificationQueue;
      case 'report':
        return this.reportQueue;
      default:
        throw new Error(`Unknown queue: ${name}`);
    }
  }
}
