# Agent Guidelines — fatturafacile-mcp-server

Official Model Context Protocol (MCP) AI Gateway for the Fattura Facile ERP ecosystem.

## 1. Stack & Runtime
- **Runtime:** Node.js (>= 22.0.0, latest LTS)
- **Language:** TypeScript 5.8+ (Strict Mode enabled, `noImplicitAny: true`, zero `any`, use `unknown` with Zod validation or type guards)
- **Package Manager:** `pnpm` exclusively (`packageManager: pnpm@12.18.0`). Never use `npm` or `yarn`.
- **Validation & Schemas:** Zod (`zod`) for all inputs, outputs, configurations, and contexts
- **Testing:** Vitest (unit/integration/contract/security/isolation), Playwright (E2E/transports)
- **Observability:** OpenTelemetry (traces and metrics) & Pino structured logging
- **Cache & Queues:** Redis (tenant-isolated keyspaces)

## 2. Directory Layout & Boundaries
- `src/bootstrap/`: Lifecycle management, startup, graceful shutdown
- `src/server/`: Model Context Protocol server configuration and capability registration
- `src/transport/`: MCP transports (`stdio`, `sse`, `streamable-http`)
- `src/auth/`: Token verification, API key authentication, and context derivation
- `src/security/`: Rate limiting, sanitization, token bucket, security policies
- `src/permissions/`: RBAC/ABAC authorization checks and permission gates
- `src/audit/`: Structured immutable audit logging
- `src/telemetry/`: OpenTelemetry metrics and distributed tracing
- `src/cache/`: Redis cache with strict tenant isolation
- `src/queue/`: Background queue workers and asynchronous jobs
- `src/sdk/`: Fattura Facile ERP client factory and SDK client bindings
- `src/services/`: Core domain services orchestrating SDK operations
- `src/workflows/`: Multi-step stateful workflows with compensation/rollback
- `src/orchestration/`: Multi-tool dependency graph execution
- `src/tools/`: 39 MCP tools extending the unified base tool framework (`src/tools/base/`)
- `src/resources/`: 22 MCP resources providing read-only context (`src/resources/base/`)
- `src/prompts/`: 20 Pre-engineered domain prompts (`src/prompts/base/`)
- `src/types/`: Domain contracts, execution contexts, and interfaces
- `src/errors/`: Standard MCP error hierarchy (`McpError`, `TenantAccessViolationError`, etc.)
- `tests/`: Vitest test suites (`tests/unit/`, `tests/integration/`) and Playwright E2E (`tests/e2e/`)

## 3. Architectural Invariants
1. **OpenAPI Single Source of Truth:**
   - Every interaction with the Fattura Facile ERP backend MUST go exclusively through `@fatturafacile/openapi-sdk` (or local factory `src/sdk/client-factory.ts`).
   - Never create duplicate DTOs, hand-written API client functions, ad-hoc HTTP requests (`fetch`/`axios`), or parallel domain models.
2. **Multi-Tenancy & Security Isolation:**
   - Every Tool, Resource, Prompt, and Workflow execution requires an explicit execution context:
     `{ tenant: TenantContext, user: UserContext, company: CompanyContext, permissions: PermissionContext }`.
   - Zero tenant leakage: Tenant IDs must partition all Redis keys (`tenant:{tenantId}:company:{companyId}:...`), queries, and audit logs.
   - Any sensitive operation or authorization failure must emit an immutable audit event via `src/audit`.
3. **Unified Tool Framework:**
   - Every MCP Tool must extend `src/tools/base/tool.ts`.
   - All tools must define Zod schemas, permission requirements, OpenTelemetry spans, exponential backoff retries, and multi-tenant caching.
   - Tools must function identically across `stdio`, `streamable-http`, and `sse` transports.
4. **Clean Code & Quality Standards:**
   - Strict typing: zero `any`. Use `unknown` with Zod parsing or custom type guards.
   - Favor immutability (`readonly`).
   - Throw typed domain errors inheriting from `McpError` / `BaseError`.
   - Never hardcode or leak secrets, `.env*` contents, `.git/`, or cryptographic keys.

## 4. Exact Verification & Quality Gate Commands
Always execute commands using `pnpm`:
- **Build:** `pnpm run build`
- **Typecheck:** `pnpm run typecheck`
- **Lint:** `pnpm run lint` (auto-fix: `pnpm run lint:fix`)
- **Format Check:** `pnpm run format:check` (format: `pnpm run format`)
- **Unit & Integration Tests:** `pnpm run test`
- **Test Coverage:** `pnpm run test:coverage`
- **E2E Tests:** `pnpm run test:e2e`
- **Docs Generation:** `pnpm run docs`
- **Full Quality Gate:** `pnpm run typecheck && pnpm run lint && pnpm run format:check && pnpm run test`
