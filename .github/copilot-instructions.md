# Copilot Instructions — fatturafacile-mcp-server

Official Model Context Protocol (MCP) AI Gateway for the Fattura Facile ERP ecosystem.

## 1. Context & Token Saving Rules

1. **Focused inspections only:** Prefer reading interfaces, declarations, and types rather than full implementations.
2. **Concise diffs:** Emit targeted changes without conversational filler or unsolicited explanations.
3. **No secrets:** Never read, echo, or commit `.env*`, `.git/`, `certs/`, or tokens.

## 2. Package Manager & Workflow

- Repository strictly uses **pnpm** (Node.js LTS, TypeScript Strict). Never run `npm` or `yarn`.
- Install dependencies: `pnpm install --frozen-lockfile`.
- Ephemeral execution & scratch: `.sandbox/`.

## 3. Build, Test, Lint & Quality Commands

- `pnpm build`: Compiles TypeScript source to `dist/` (`tsc -p tsconfig.build.json` or tsup/esbuild).
- `pnpm start`: Boots the MCP Server over standard transport (configured via env `MCP_TRANSPORT=stdio|streamable-http|sse`).
- `pnpm run dev`: Boots server in watch/development mode.
- `pnpm typecheck`: Executes TypeScript compiler in check mode (`tsc --noEmit`).
- `pnpm lint`: Runs ESLint with zero-tolerance for warnings/errors.
- `pnpm format:check`: Validates formatting with Prettier.
- `pnpm test`: Runs Vitest test suite (unit, integration, tenant-isolation).
- `pnpm test:coverage`: Runs Vitest with coverage report.
- `pnpm test:e2e`: Executes Playwright tests against HTTP/SSE transports.
- `pnpm run docs`: Generates API documentation via Typedoc to `docs/api/`.

## 4. Architectural Boundaries

- **OpenAPI SSoT:** All ERP interactions happen via `fatturafacile-openapi-sdk`. No raw `fetch`/`axios` or duplicate DTOs.
- **Context Isolation:** All operations accept an execution context (`TenantContext`, `UserContext`, `CompanyContext`, `PermissionContext`). Zero tenant leakage.
- **Base Tool Framework:** Tools in `src/tools` extend the unified base framework incorporating Zod schemas, RBAC verification, OpenTelemetry spans, retries, and Redis caching.
- **Modular Layout:**
  - `src/bootstrap`: Startup and shutdown hooks
  - `src/server`: MCP protocol server setup and handler registration
  - `src/transport`: `stdio`, `sse`, `streamable-http` adapters
  - `src/auth`: Token validation and context derivation
  - `src/security`: Rate limiting, sanitization, validation
  - `src/permissions`: RBAC/ABAC authorization checks
  - `src/audit`: Structured auditing events
  - `src/telemetry`: OpenTelemetry metrics and traces
  - `src/cache`: Redis tenant-isolated cache
  - `src/queue`: Background queue workers
  - `src/sdk`: ERP SDK integration client
  - `src/services`: Business logic orchestration
  - `src/workflows`: Multi-step stateful workflows
  - `src/orchestration`: Multi-tool planners
  - `src/tools`: MCP tools
  - `src/resources`: MCP resources
  - `src/prompts`: MCP prompts
  - `src/schemas`: Common Zod schemas
  - `src/types`: Domain and context types
  - `src/validation`: Custom validators
  - `src/errors`: MCP and domain error types
