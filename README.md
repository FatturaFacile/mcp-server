# FatturaFacile MCP Server

[![CI](https://github.com/FatturaFacile/mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/FatturaFacile/mcp-server/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-12.x-orange)](https://pnpm.io/)

[Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for the [FatturaFacile](https://github.com/FatturaFacile/FatturaFacile) ERP. It lets MCP clients (for example Cursor, Windsurf and other desktop or editor clients) call the FatturaFacile API through tools, resources and prompts.

> **Status: early stage.** The server starts, serves all the tools below and passes its test suite, but several services still return built-in sample data when the API call fails (see `src/services/`). Do not rely on it for real accounting data yet.

## Overview

- **Tools (62):** customers, invoices, quotes, payments, products and services, companies and contacts, projects and tasks, files. Each tool validates its input with Zod and goes through a common framework (permission check, tracing, retries, caching, audit log).
- **Resources (28):** read-only context such as `company://profile`, `customer://recent`, `invoice://overdue`, `dashboard://summary`.
- **Prompts (20):** guided prompts for sales, customers, finance and reporting.
- **Workflows (4):** multi-step flows with compensation on failure (customer onboarding with quote, quote-to-invoice conversion and dispatch, overdue invoice recovery, monthly executive report).
- **Transports:** `stdio` (default) and HTTP (`streamable-http` or `sse`, served with Express on `/sse` and `/messages`, plus `/health`).
- **Multi-tenancy:** every call carries a tenant, user and company context; cache keys and audit events are partitioned by tenant.
- **Optional services:** Redis for the cache (an in-memory cache is used when Redis is not configured) and OpenTelemetry tracing.

## Requirements

- Node.js 22 or later (`engines`: `>=22.0.0`)
- pnpm 12 (pinned in `packageManager`)
- Redis (optional)
- A FatturaFacile API and an API key to talk to a real backend

## Getting started

```bash
git clone https://github.com/FatturaFacile/mcp-server.git
cd mcp-server
pnpm install --frozen-lockfile
cp .env.example .env

pnpm run dev        # development with hot reload (stdio)
pnpm run build      # compile to dist/
pnpm start          # run the compiled server (stdio by default)

# HTTP transport on port 3000
MCP_TRANSPORT=streamable-http PORT=3000 pnpm start
curl http://localhost:3000/health
```

With Docker (builds the image and starts it together with Redis):

```bash
docker compose up --build -d
```

### Client configuration

Clients such as Cursor (`.cursor/mcp.json`) and Windsurf (`mcp_config.json`) use this shape in their MCP configuration file:

```json
{
  "mcpServers": {
    "fatturafacile": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "FATTURA_FACILE_API_URL": "https://api.fatturafacile.eu",
        "FATTURA_FACILE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

See [docs/client-integration.md](docs/client-integration.md) for more.

## Configuration

Environment variables, validated at startup in `src/config/environment.ts` (defaults and descriptions in [docs/deployment-guide.md](docs/deployment-guide.md)); `.env.example` lists them all:

`NODE_ENV`, `PORT`, `HOST`, `LOG_LEVEL`, `MCP_TRANSPORT`, `FATTURA_FACILE_API_URL`, `FATTURA_FACILE_API_KEY`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `CACHE_TTL_SECONDS`, `API_KEY_HEADER`, `JWT_SECRET`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`.

Set `JWT_SECRET` and `FATTURA_FACILE_API_KEY` explicitly outside local development.

## Testing and linting

```bash
pnpm test               # unit and integration tests (Vitest)
pnpm run test:coverage  # with coverage
pnpm run test:e2e       # transport end-to-end tests (Playwright; run `pnpm exec playwright install` once)
pnpm run typecheck      # tsc --noEmit
pnpm run lint           # ESLint
pnpm run format:check   # Prettier
```

## CI/CD and branching

- `dev` is the default branch. Open pull requests against `dev`. Production is released from `main` with a GitHub release.
- `CI` (`ci.yml`) runs on pull requests and pushes to `main`: typecheck, lint, tests with coverage, build, Playwright tests and Qodana.
- `Deploy dev` (`deploy-dev.yml`) runs the CI and, when dev deployment is enabled for the repository, deploys the build on every push to `dev`.
- `Release Assets` (`deploy.yml`) runs the CI when a GitHub release is published and attaches the build archives and checksums to the release.

## Project structure

```text
src/
├── index.ts          # entry point
├── config/           # environment validation
├── server/           # MCP server wiring
├── transport/        # stdio, streamable-http and SSE transports
├── tools/            # tool framework (base/) and tools by domain
├── resources/        # MCP resources
├── prompts/          # MCP prompts
├── workflows/        # workflow engine and definitions
├── services/         # domain services that call the API
├── sdk/              # HTTP client for the FatturaFacile API
├── auth/, permissions/, security/   # authentication, RBAC, rate limiting
├── cache/, queue/, search/, audit/, telemetry/, errors/, types/
tests/                # unit/, integration/, e2e/
docs/                 # architecture, domain model, MCP concepts, deployment, security
examples/             # client usage examples
```

## Related repositories

| Repository                                                        | Relation                                               |
| :---------------------------------------------------------------- | :----------------------------------------------------- |
| [`web-api`](https://github.com/FatturaFacile/web-api)             | The Laravel API this server calls                      |
| [`openapi-sdk`](https://github.com/FatturaFacile/openapi-sdk)     | OpenAPI specification and client SDKs for the same API |
| [`integrations`](https://github.com/FatturaFacile/integrations)   | Connectors to third-party platforms                    |
| [`FatturaFacile`](https://github.com/FatturaFacile/FatturaFacile) | Organization overview and repository map               |

## Documentation

- [Architecture](docs/architecture/ARCHITECTURE.md), [domain model](docs/domain-model.md), [MCP concepts](docs/mcp-concepts.md), [security model](docs/security-model.md), [deployment guide](docs/deployment-guide.md), [client integration](docs/client-integration.md)
- Project wiki: [FatturaFacile/FatturaFacile wiki](https://github.com/FatturaFacile/FatturaFacile/wiki)

## License

[MIT](LICENSE)
