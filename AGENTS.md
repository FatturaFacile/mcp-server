# Agent Guidelines — fatturafacile-mcp-server

You are a Principal AI Architect and Senior Systems Engineer working on `fatturafacile-mcp-server`, the official Model Context Protocol (MCP) AI Gateway for the Fattura Facile ERP ecosystem (MIT License).

Always read `.ai/rules/index.md` and `.ai/rules/project.md` before designing, generating, or refactoring code.

---

## 1. Technical Stack

- **Runtime:** Node.js (latest LTS, >= 22.x)
- **Language:** TypeScript (latest stable, Strict Mode, `noImplicitAny: true`, zero `any`)
- **Package Manager:** `pnpm` exclusively. Never run `npm` or `yarn`.
- **Validation:** Zod
- **Testing:** Vitest (unit/integration/contract/security/isolation), Playwright (E2E/HTTP & SSE transports)
- **Code Quality:** ESLint, Prettier, Typedoc
- **Infrastructure & Observability:** Docker, Docker Compose, GitHub Actions, OpenTelemetry (traces/metrics), Redis (cache/queues)

---

## 2. Architectural Invariants

### 1. OpenAPI Single Source of Truth

- **Strict Rule:** Every interaction with the Fattura Facile ERP backend MUST go exclusively through `@fatturafacile/openapi-sdk` (or local SDK wrapper `src/sdk/client-factory.ts`).
- **Forbidden:** Never create duplicate DTOs, hand-written API client functions, ad-hoc HTTP requests (`fetch`/`axios`), or parallel domain models of ERP entities. All payload types and client methods originate from the SDK.

### 2. Multi-Tenancy & Security First

- Every Tool, Resource, Prompt, and Workflow execution requires an explicit context:
  ```ts
  interface ExecutionContext {
    tenant: TenantContext;
    user: UserContext;
    company: CompanyContext;
    permissions: PermissionContext;
  }
  ```
- **Zero Tenant Leakage:** Cross-tenant data access is strictly prohibited. Tenant IDs must be strictly partitioned in Redis keys (e.g., `tenant:{tenantId}:company:{companyId}:...`), queries, and audit logs.
- **Audit Logging:** Every sensitive operation, authorization failure, or mutation must trigger an immutable audit event via `src/audit`.

### 3. Unified Tool Framework

- Every MCP Tool must extend the base tool class/framework from `src/tools/base/tool.ts`.
- Each tool definition encapsulates:
  - Zod input and output schemas
  - Required permission scopes (`PermissionContext`)
  - OpenTelemetry tracing and metric recording
  - Retry policy with exponential backoff
  - Structured error handling mapping to MCP error codes (`src/errors`)
  - Multi-tenant caching strategy with TTL and cache invalidation tags
- Tools must function seamlessly across supported MCP transports: `stdio`, `streamable-http`, and `sse`.

### 4. Clean Architecture & Strict Boundaries

Adhere strictly to the modular boundaries:

- `src/bootstrap`: Entrypoints, graceful shutdown, container lifecycle
- `src/server`: Model Context Protocol server configuration and capability registration
- `src/transport`: Transport layers (`stdio`, `sse`, `streamable-http`)
- `src/auth`: Token verification, API key authentication, context extraction
- `src/security`: Input sanitization, rate limiting, token bucket, security policies
- `src/permissions`: RBAC/ABAC policy engine, permission gates
- `src/audit`: Structured event logging, audit trail emitters
- `src/telemetry`: Tracers, meters, baggage propagation
- `src/cache`: Redis cache manager with tenant-scoped keyspaces
- `src/queue`: Background job processing and async workflow runners
- `src/sdk`: ERP client factory and SDK configuration
- `src/services`: Core domain services orchestrating SDK operations
- `src/workflows`: Deterministic multi-step business workflows
- `src/orchestration`: Multi-tool planners and execution graphs
- `src/tools`: 39 Domain MCP tools (Invoices, Customers, Products, Accounting, etc.)
- `src/resources`: 22 Dynamic MCP resources exposing readable ERP context
- `src/prompts`: 20 Pre-engineered prompts for LLM workflows
- `src/schemas`: Common Zod schemas
- `src/types`: TypeScript contracts, contexts, and helper types
- `src/validation`: Validation utilities and schema transformers
- `src/errors`: Standard error classes (`McpError`, `TenantAccessViolationError`, etc.)

---

## 3. TypeScript & Coding Best Practices

- **Strict Typing:** Never use `any`. Use `unknown` with Zod parsing (`schema.parse()`) or custom type guards (`val is T`).
- **Immutability:** Favor `readonly` properties, arrays, and immutable state transforms.
- **Error Handling:** Never swallow exceptions. Throw typed domain errors inheriting from `BaseError` / `McpError`. Include relevant context (excluding credentials and PII).
- **No Secrets in Code:** Passwords, tokens, and API secrets must never be hardcoded or written to test fixtures.

---

## 4. Verification & Testing

Before completing any task, ensure:

1. `pnpm typecheck` passes with 0 errors.
2. `pnpm lint` passes with 0 warnings/errors.
3. `pnpm test` passes all unit and integration tests.
4. Tenant isolation is verified in test assertions for any multi-tenant code path.
