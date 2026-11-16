# Deployment & Operations Guide — fatturafacile-mcp-server

This guide explains how to deploy, configure, and maintain `fatturafacile-mcp-server` in staging and production environments.

---

## 1. Environment Configuration

All settings are configured using environment variables validated at startup via Zod (`src/config/environment.ts`).

| Variable                      | Description                                               | Default                        |
| ----------------------------- | --------------------------------------------------------- | ------------------------------ |
| `NODE_ENV`                    | Runtime environment (`development`, `production`, `test`) | `development`                  |
| `PORT`                        | Listening port for HTTP / SSE transport                   | `3000`                         |
| `HOST`                        | Bind address                                              | `127.0.0.1`                    |
| `LOG_LEVEL`                   | Pino log level (`info`, `debug`, `warn`, `error`)         | `info`                         |
| `MCP_TRANSPORT`               | Active transport (`stdio`, `streamable-http`, `sse`)      | `stdio`                        |
| `FATTURA_FACILE_API_URL`      | Upstream Fattura Facile ERP base URL                      | `https://api.fatturafacile.eu` |
| `FATTURA_FACILE_API_KEY`      | Master API Key for backend ERP authentication             | -                              |
| `REDIS_HOST`                  | Redis host for multi-tenant cache and queue               | `127.0.0.1`                    |
| `REDIS_PORT`                  | Redis port                                                | `6379`                         |
| `REDIS_PASSWORD`              | Redis auth password                                       | `""`                           |
| `CACHE_TTL_SECONDS`           | Default cache expiration time in seconds                  | `300`                          |
| `RATE_LIMIT_MAX_REQUESTS`     | Max allowed requests per time window                      | `100`                          |
| `RATE_LIMIT_WINDOW_MS`        | Rate limit window in milliseconds                         | `60000`                        |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry Collector HTTP endpoint                     | `http://localhost:4318`        |

---

## 2. Docker & Container Deployment

### Standalone Docker Run

```bash
# Build the production image
docker build -t fatturafacile-mcp-server:latest .

# Run container over HTTP/SSE
docker run -d \
  --name fatturafacile-mcp \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MCP_TRANSPORT=streamable-http \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e FATTURA_FACILE_API_URL=https://api.fatturafacile.eu \
  -e FATTURA_FACILE_API_KEY="your_production_key" \
  fatturafacile-mcp-server:latest
```

### Docker Compose Stack (with Redis)

```bash
docker-compose up --build -d
```

---

## 3. Production Monitoring & Health Checks

The server exposes a standardized health check endpoint when running in `streamable-http` or `sse` mode:

```bash
curl -f http://localhost:3000/health
```

Expected JSON response:

```json
{
  "status": "healthy",
  "timestamp": "2026-11-16T10:00:00.000Z",
  "transport": "streamable-http",
  "version": "1.0.0"
}
```

### Observability with OpenTelemetry:

- All tool executions emit spans tagged with `mcp.tool.name`, `tenant.id`, `company.id`, and `user.id`.
- Metrics and traces are exported via OTLP/HTTP to any OpenTelemetry-compatible backend (Prometheus, Jaeger, Grafana, Datadog).
