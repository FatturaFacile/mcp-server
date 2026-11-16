import { trace, context, Span, SpanStatusCode, Tracer } from '@opentelemetry/api';
import { config } from '../config/environment.js';

class TelemetryService {
  private readonly tracer: Tracer;

  constructor() {
    this.tracer = trace.getTracer(config.OTEL_SERVICE_NAME, '1.0.0');
  }

  public getTracer(): Tracer {
    return this.tracer;
  }

  public async startActiveSpan<T>(
    name: string,
    attributes: Record<string, string | number | boolean>,
    fn: (span: Span) => Promise<T>,
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err: unknown) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: err instanceof Error ? err.message : String(err),
        });
        span.recordException(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        span.end();
      }
    });
  }

  public getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }
}

export const telemetry = new TelemetryService();
