import { BaseError } from './base.js';

export const McpErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32003,
  TENANT_ACCESS_VIOLATION: -32004,
  RESOURCE_NOT_FOUND: -32005,
  RATE_LIMITED: -32029,
  ERP_GATEWAY_ERROR: -32050,
} as const;

export type McpErrorCodeType = (typeof McpErrorCode)[keyof typeof McpErrorCode];

export class McpProtocolError extends BaseError {
  public override readonly code: string;
  public readonly mcpCode: number;

  constructor(
    message: string,
    mcpCode: number = McpErrorCode.INTERNAL_ERROR,
    context?: Record<string, unknown>,
  ) {
    super(message, context);
    this.mcpCode = mcpCode;
    this.code = `MCP_ERROR_${mcpCode}`;
  }
}
