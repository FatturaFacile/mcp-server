import { z } from 'zod';
import { ExecutionContext } from './context.js';

export type McpTransportType = 'stdio' | 'streamable-http' | 'sse';

export interface ToolMetadata {
  readonly name: string;
  readonly description: string;
  readonly requiredScopes: readonly string[];
  readonly category: string;
  readonly cacheTtlSeconds?: number;
}

export interface ResourceMetadata {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType?: string;
  readonly requiredScopes: readonly string[];
  readonly cacheTtlSeconds?: number;
}

export interface PromptMetadata {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly arguments?: readonly {
    readonly name: string;
    readonly description: string;
    readonly required: boolean;
  }[];
}

export interface ToolResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly metadata?: {
    readonly durationMs: number;
    readonly cached?: boolean;
    readonly tenantId: string;
  };
}

export interface ITool<TInput = unknown, TOutput = unknown> {
  readonly metadata: ToolMetadata;
  readonly inputSchema: z.ZodType<TInput, any, any>;
  execute(input: TInput, context: ExecutionContext): Promise<ToolResult<TOutput>>;
}
