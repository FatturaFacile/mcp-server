import { ExecutionContext } from '../types/context.js';
import { BaseTool } from '../tools/base/tool.js';
import { auditLogger } from '../audit/logger.js';

export interface PlanStep {
  readonly id: string;
  readonly toolName: string;
  readonly input: unknown;
  readonly dependsOn?: readonly string[];
}

export interface ExecutionPlan {
  readonly planId: string;
  readonly steps: readonly PlanStep[];
}

export interface StepExecutionResult {
  readonly stepId: string;
  readonly success: boolean;
  readonly output?: unknown;
  readonly error?: string;
  readonly durationMs: number;
}

export class MultiToolOrchestrator {
  private readonly toolRegistry = new Map<string, BaseTool<any, any>>();

  public registerTool(tool: BaseTool<any, any>): void {
    this.toolRegistry.set(tool.metadata.name, tool);
  }

  public async executePlan(
    plan: ExecutionPlan,
    context: ExecutionContext,
  ): Promise<{
    planId: string;
    success: boolean;
    results: Map<string, StepExecutionResult>;
    totalDurationMs: number;
  }> {
    const startTime = Date.now();
    const results = new Map<string, StepExecutionResult>();

    auditLogger.logEvent({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'workflow_step',
      tenantId: context.tenant.tenantId,
      userId: context.user.userId,
      companyId: context.company.companyId,
      target: `orchestrator.plan.${plan.planId}`,
      status: 'success',
      metadata: { stepsCount: plan.steps.length },
    });

    for (const step of plan.steps) {
      const stepStart = Date.now();
      const tool = this.toolRegistry.get(step.toolName);

      if (!tool) {
        results.set(step.id, {
          stepId: step.id,
          success: false,
          error: `Tool '${step.toolName}' not found in orchestrator registry`,
          durationMs: Date.now() - stepStart,
        });
        return {
          planId: plan.planId,
          success: false,
          results,
          totalDurationMs: Date.now() - startTime,
        };
      }

      // Check dependencies
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          const depResult = results.get(depId);
          if (!depResult || !depResult.success) {
            results.set(step.id, {
              stepId: step.id,
              success: false,
              error: `Dependency '${depId}' failed or was not executed`,
              durationMs: 0,
            });
            return {
              planId: plan.planId,
              success: false,
              results,
              totalDurationMs: Date.now() - startTime,
            };
          }
        }
      }

      // Execute tool
      const toolResult = await tool.execute(step.input, context);
      if (!toolResult.success) {
        results.set(step.id, {
          stepId: step.id,
          success: false,
          error: toolResult.error?.message ?? 'Tool execution failed',
          durationMs: Date.now() - stepStart,
        });
        return {
          planId: plan.planId,
          success: false,
          results,
          totalDurationMs: Date.now() - startTime,
        };
      }

      results.set(step.id, {
        stepId: step.id,
        success: true,
        output: toolResult.data,
        durationMs: Date.now() - stepStart,
      });
    }

    return {
      planId: plan.planId,
      success: true,
      results,
      totalDurationMs: Date.now() - startTime,
    };
  }
}
