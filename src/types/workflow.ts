import { ExecutionContext } from './context.js';

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';

export interface WorkflowStepContext<TData = Record<string, unknown>> {
  readonly executionContext: ExecutionContext;
  readonly workflowId: string;
  readonly stepName: string;
  readonly initialPayload: unknown;
  readonly stepResults: ReadonlyMap<string, unknown>;
  readonly sharedData: TData;
}

export interface WorkflowStep<TInput = unknown, TOutput = unknown> {
  readonly name: string;
  readonly description: string;
  execute(input: TInput, context: WorkflowStepContext): Promise<TOutput>;
  compensate?(
    input: TInput,
    output: TOutput | undefined,
    context: WorkflowStepContext,
  ): Promise<void>;
}

export interface WorkflowDefinition<TInput = unknown, TOutput = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly requiredScopes: readonly string[];
  readonly steps: readonly WorkflowStep<any, any>[];
  execute(input: TInput, context: ExecutionContext): Promise<WorkflowExecutionResult<TOutput>>;
}

export interface WorkflowExecutionResult<T = unknown> {
  readonly workflowId: string;
  readonly status: WorkflowStatus;
  readonly output?: T;
  readonly error?: string;
  readonly executedSteps: readonly string[];
  readonly compensatedSteps: readonly string[];
  readonly durationMs: number;
}
