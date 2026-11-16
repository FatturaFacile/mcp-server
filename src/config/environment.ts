import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('127.0.0.1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // MCP Transport
  MCP_TRANSPORT: z.enum(['stdio', 'streamable-http', 'sse']).default('stdio'),

  // ERP API backend
  FATTURA_FACILE_API_URL: z.string().url().default('https://api.fatturafacile.eu'),
  FATTURA_FACILE_API_KEY: z.string().default('mock-development-erp-key'),

  // Redis Cache
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_DB: z.coerce.number().default(0),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),

  // Security & Auth
  API_KEY_HEADER: z.string().default('X-API-Key'),
  JWT_SECRET: z.string().default('dev_jwt_secret_must_be_changed_in_prod_at_least_32_chars'),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // OpenTelemetry
  OTEL_SERVICE_NAME: z.string().default('fatturafacile-mcp-server'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318'),
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;

export function loadConfig(): EnvironmentConfig {
  const result = environmentSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = JSON.stringify(result.error.format(), null, 2);
    throw new Error(`Invalid environment configuration: ${errorDetails}`);
  }
  return result.data;
}

export const config = loadConfig();
