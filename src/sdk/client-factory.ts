import { ExecutionContext } from '../types/context.js';
import { config } from '../config/environment.js';
import { ErpIntegrationError } from '../errors/erp.js';

export interface ErpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  queryParams?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

export class ErpSdkClient {
  constructor(private readonly context: ExecutionContext) {}

  public async request<T>(options: ErpRequestOptions): Promise<T> {
    const { method = 'GET', endpoint, queryParams, body } = options;

    const url = new URL(endpoint, config.FATTURA_FACILE_API_URL);
    if (queryParams) {
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined) {
          url.searchParams.append(k, String(v));
        }
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Tenant-ID': this.context.tenant.tenantId,
      'X-Company-ID': this.context.company.companyId,
      'X-Correlation-ID': this.context.correlationId,
      Authorization: `Bearer ${config.FATTURA_FACILE_API_KEY}`,
    };

    try {
      // In production, delegates to @fatturafacile/openapi-sdk client
      // In offline/mock test execution or direct fetch:
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        let errBody: unknown;
        try {
          errBody = await response.json();
        } catch {
          errBody = await response.text();
        }
        throw new ErpIntegrationError(
          `ERP API request failed with status ${response.status}`,
          response.status,
          endpoint,
          { responseBody: errBody },
        );
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof ErpIntegrationError) {
        throw err;
      }
      throw new ErpIntegrationError(
        `ERP Connection error on ${endpoint}: ${err instanceof Error ? err.message : String(err)}`,
        500,
        endpoint,
      );
    }
  }
}

export class SdkClientFactory {
  public static getClient(context: ExecutionContext): ErpSdkClient {
    return new ErpSdkClient(context);
  }
}
