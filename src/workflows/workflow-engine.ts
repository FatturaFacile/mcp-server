import { ExecutionContext } from '../types/context.js';
import {
  WorkflowDefinition,
  WorkflowExecutionResult,
  WorkflowStep,
  WorkflowStepContext,
} from '../types/workflow.js';
import { auditLogger } from '../audit/logger.js';
import { telemetry } from '../telemetry/tracer.js';
import { UnauthorizedError } from '../errors/auth.js';

export class BaseWorkflowEngine<TInput = unknown, TOutput = unknown> implements WorkflowDefinition<
  TInput,
  TOutput
> {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly requiredScopes: readonly string[],
    public readonly steps: readonly WorkflowStep<any, any>[],
  ) {}

  public async execute(
    input: TInput,
    context: ExecutionContext,
  ): Promise<WorkflowExecutionResult<TOutput>> {
    const startTime = Date.now();
    const workflowId = `${this.id}_${crypto.randomUUID()}`;

    return telemetry.startActiveSpan(
      `workflow.${this.id}`,
      { 'workflow.id': workflowId },
      async (span) => {
        // 1. Authorization check
        for (const scope of this.requiredScopes) {
          if (!context.permissions.hasScope(scope)) {
            auditLogger.recordSecurityViolation(context, 'WORKFLOW_SCOPE_UNAUTHORIZED', {
              workflowId: this.id,
              scope,
            });
            throw new UnauthorizedError(scope);
          }
        }

        auditLogger.logEvent({
          eventId: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          eventType: 'workflow_step',
          tenantId: context.tenant.tenantId,
          userId: context.user.userId,
          companyId: context.company.companyId,
          target: this.name,
          status: 'success',
          metadata: { phase: 'start', workflowId },
        });

        const executedSteps: string[] = [];
        const stepResults = new Map<string, unknown>();
        const sharedData: Record<string, unknown> = {};

        let currentStepIndex = 0;
        let lastStepOutput: unknown = input;

        try {
          for (const step of this.steps) {
            const stepContext: WorkflowStepContext = {
              executionContext: context,
              workflowId,
              stepName: step.name,
              initialPayload: input,
              stepResults,
              sharedData,
            };

            const stepResult = await step.execute(lastStepOutput, stepContext);
            stepResults.set(step.name, stepResult);
            executedSteps.push(step.name);
            lastStepOutput = stepResult;
            currentStepIndex++;
          }

          const durationMs = Date.now() - startTime;
          span.setAttribute('workflow.status', 'completed');

          auditLogger.logEvent({
            eventId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            eventType: 'workflow_step',
            tenantId: context.tenant.tenantId,
            userId: context.user.userId,
            companyId: context.company.companyId,
            target: this.name,
            status: 'success',
            durationMs,
            metadata: { phase: 'completed', workflowId },
          });

          return {
            workflowId,
            status: 'completed',
            output: lastStepOutput as TOutput,
            executedSteps,
            compensatedSteps: [],
            durationMs,
          };
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          span.recordException(err instanceof Error ? err : new Error(errorMessage));

          // 2. Transaction Rollback & Compensation execution
          const compensatedSteps: string[] = [];
          for (let i = currentStepIndex - 1; i >= 0; i--) {
            const stepToCompensate = this.steps[i];
            if (stepToCompensate?.compensate) {
              try {
                const stepCtx: WorkflowStepContext = {
                  executionContext: context,
                  workflowId,
                  stepName: stepToCompensate.name,
                  initialPayload: input,
                  stepResults,
                  sharedData,
                };
                await stepToCompensate.compensate(
                  input,
                  stepResults.get(stepToCompensate.name),
                  stepCtx,
                );
                compensatedSteps.push(stepToCompensate.name);
              } catch (compErr: unknown) {
                auditLogger.recordSecurityViolation(context, 'COMPENSATION_STEP_FAILED', {
                  workflowId,
                  stepName: stepToCompensate.name,
                  error: String(compErr),
                });
              }
            }
          }

          const durationMs = Date.now() - startTime;
          auditLogger.logEvent({
            eventId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            eventType: 'workflow_step',
            tenantId: context.tenant.tenantId,
            userId: context.user.userId,
            companyId: context.company.companyId,
            target: this.name,
            status: 'failure',
            durationMs,
            metadata: {
              phase: 'failed_rolled_back',
              error: errorMessage,
              compensatedSteps,
            },
          });

          return {
            workflowId,
            status: 'rolled_back',
            error: errorMessage,
            executedSteps,
            compensatedSteps,
            durationMs,
          };
        }
      },
    );
  }
}
