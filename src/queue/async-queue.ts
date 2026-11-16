import { ExecutionContext } from '../types/context.js';
import { auditLogger } from '../audit/logger.js';

export interface QueueJob<TData = unknown> {
  readonly id: string;
  readonly name: string;
  readonly payload: TData;
  readonly context: ExecutionContext;
  readonly createdAt: Date;
  attempts: number;
}

export type JobHandler<TData = unknown> = (job: QueueJob<TData>) => Promise<void>;

export class AsyncQueueManager {
  private readonly handlers = new Map<string, JobHandler<any>>();
  private readonly queue: QueueJob[] = [];
  private isProcessing = false;

  public registerHandler<T>(jobName: string, handler: JobHandler<T>): void {
    this.handlers.set(jobName, handler as JobHandler<any>);
  }

  public async enqueue<T>(name: string, payload: T, context: ExecutionContext): Promise<string> {
    const job: QueueJob<T> = {
      id: crypto.randomUUID(),
      name,
      payload,
      context,
      createdAt: new Date(),
      attempts: 0,
    };

    this.queue.push(job);
    void this.processNext();
    return job.id;
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const job = this.queue.shift();
    if (!job) {
      this.isProcessing = false;
      return;
    }

    const handler = this.handlers.get(job.name);
    if (!handler) {
      auditLogger.recordSecurityViolation(job.context, 'MISSING_JOB_HANDLER', {
        jobName: job.name,
      });
      this.isProcessing = false;
      void this.processNext();
      return;
    }

    try {
      job.attempts++;
      await handler(job);
    } catch (err: unknown) {
      if (job.attempts < 3) {
        this.queue.push(job);
      } else {
        auditLogger.recordSecurityViolation(job.context, 'JOB_FAILED_TERMINAL', {
          jobName: job.name,
          error: String(err),
        });
      }
    } finally {
      this.isProcessing = false;
      void this.processNext();
    }
  }
}

export const queueManager = new AsyncQueueManager();
