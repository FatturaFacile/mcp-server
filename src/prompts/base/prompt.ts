import { z } from 'zod';
import { PromptMetadata } from '../../types/mcp.js';
import { ExecutionContext } from '../../types/context.js';
import { auditLogger } from '../../audit/logger.js';
import { ValidationError } from '../../errors/validation.js';

export interface PromptMessage {
  readonly role: 'system' | 'user' | 'assistant';
  readonly content: string;
}

export abstract class BasePrompt<TArgs = any> {
  public abstract readonly metadata: PromptMetadata;
  public abstract readonly schema: z.ZodType<TArgs, any, any>;

  protected abstract buildMessages(
    args: TArgs,
    context: ExecutionContext,
  ): Promise<PromptMessage[]>;

  public async render(rawArgs: unknown, context: ExecutionContext): Promise<PromptMessage[]> {
    const startTime = Date.now();
    const promptName = this.metadata.name;

    const parseResult = this.schema.safeParse(rawArgs ?? {});
    if (!parseResult.success) {
      throw new ValidationError(
        `Invalid prompt arguments for ${promptName}`,
        parseResult.error.format(),
      );
    }

    const messages = await this.buildMessages(parseResult.data, context);

    auditLogger.logEvent({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'prompt_render',
      tenantId: context.tenant.tenantId,
      userId: context.user.userId,
      companyId: context.company.companyId,
      target: promptName,
      status: 'success',
      durationMs: Date.now() - startTime,
    });

    return messages;
  }
}
