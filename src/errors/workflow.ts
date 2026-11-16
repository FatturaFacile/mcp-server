import { BaseError } from './base.js';

export class WorkflowExecutionError extends BaseError {
  public override readonly code = 'WORKFLOW_EXECUTION_FAILED';
  public readonly workflowId: string;
  public readonly failedStep: string;

  constructor(
    workflowId: string,
    failedStep: string,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context, workflowId, failedStep });
    this.workflowId = workflowId;
    this.failedStep = failedStep;
  }
}
