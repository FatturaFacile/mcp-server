---
paths:
  - '**'
---

# Global Project Rules — fatturafacile-mcp-server

This repository hosts `fatturafacile-mcp-server`, the official MIT-licensed Model Context Protocol (MCP) AI Gateway for the Fattura Facile ERP ecosystem.

This document is the single source of truth for cross-tool governance and architectural invariants. Entry files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.windsurfrules`, `.agy/instructions.md`, `.gemini/GEMINI.md`, `.github/copilot-instructions.md`) derive from and enforce these rules.

---

## 1. Stack & Technical Context

- **Runtime:** Node.js (latest LTS, >= 22.x)
- **Language:** TypeScript (latest stable, Strict Mode strictly enforced, zero `any`, use `unknown` with type guards/Zod parsing)
- **Package Manager:** `pnpm` exclusively (`packageManager` declared in `package.json`). Never run `npm` or `yarn`.
- **Validation & Schemas:** Zod for all external inputs, Tool parameters, Resource payloads, and context assertions
- **Testing:**
  - Vitest: Unit, Integration, Contract, Security, and Tenant-Isolation test suites
  - Playwright: E2E and HTTP/SSE transport tests
- **Code Quality:** ESLint, Prettier, Typedoc
- **Infrastructure & Observability:** Docker, Docker Compose, GitHub Actions, OpenTelemetry (distributed tracing and metrics), Redis (caching and async queues)

---

## 2. Core Architectural Invariants (MANDATORY)

Every AI agent and human contributor must strictly adhere to these non-negotiable invariants:

### 1. OpenAPI Single Source of Truth

- All interactions with the upstream Fattura Facile ERP backend MUST occur exclusively through the official `@fatturafacile/openapi-sdk` (or local package `fatturafacile-openapi-sdk`).
- **PROHIBITED:** Creating manual HTTP calls (`fetch`, `axios`), duplicate DTOs, manual domain models, or independently maintained ERP contract definitions. All request/response types and endpoint interfaces derive directly from the SDK.

### 2. Multi-Tenancy & Security First

- Every Tool, Resource, Prompt, Workflow, and Background Task MUST execute within an explicit context:
  - `TenantContext` (tenant ID, partition, schema/isolation boundary)
  - `UserContext` (subject ID, role, metadata)
  - `CompanyContext` (company ID, fiscal jurisdiction, currency)
  - `PermissionContext` (granted scopes, RBAC/ABAC claims)
- **Zero Tenant Leakage:** Cross-tenant data access is strictly impossible by design. Context must be passed and verified at every boundary.
- **Immutable Audit Trail:** Every invocation, security check, and data modification MUST emit an audit event via `src/audit`.

### 3. Unified Tool Framework

- Every MCP Tool MUST extend the centralized Base Tool Framework (`src/tools`).
- The framework handles:
  - Zod input/output schema validation
  - Context & RBAC/Permission verification
  - Structured audit logging
  - OpenTelemetry spans and metrics
  - Resilient retry policies with backoff
  - Structured error hierarchy (`src/errors`)
  - Intelligent multi-tenant caching via Redis (`src/cache`)
- Tools MUST support standard MCP transports: `stdio`, `streamable-http`, and `sse` (`src/transport`).

### 4. Clean Architecture & Strict Module Boundaries

Respect strict layer separation across modules:

- `src/bootstrap`: Application lifecycle, DI container initialization, graceful shutdown
- `src/server`: MCP Server core instance, capability registration
- `src/transport`: Transport adapters (`stdio`, `sse`, `streamable-http`)
- `src/auth`: Authentication strategies, API token verification, session resolution
- `src/security`: Rate limiting, sanitization, secret scrubbing, security guards
- `src/permissions`: RBAC/ABAC evaluators, policy definitions, permission guards
- `src/audit`: Structured audit trail logger, compliance event emission
- `src/telemetry`: OpenTelemetry tracer, metrics instruments, context propagation
- `src/cache`: Multi-tenant Redis caching layer with key isolation
- `src/queue`: Background job processing and asynchronous workflow queues
- `src/sdk`: Factory and client wrappers for `fatturafacile-openapi-sdk`
- `src/services`: Business logic, domain operations, ERP orchestration services
- `src/workflows`: Long-running state machines, multi-step agentic workflows
- `src/orchestration`: Tool chaining, dependency resolution, execution planners
- `src/tools`: MCP Tool definitions extending the unified base framework
- `src/resources`: MCP Resource providers (URIs, templates, subscriptions)
- `src/prompts`: MCP Prompt templates and system instructions
- `src/schemas`: Shared Zod validation schemas
- `src/types`: Shared TypeScript interfaces, context models, utility types
- `src/validation`: Custom validators, schema combinators, sanitizers
- `src/errors`: Standardized exception hierarchy mapping directly to MCP error codes

---

## 3. Language & Code Standards

- **English Only:** All code, identifiers, comments, JSDoc/Typedoc, commit messages, tests, log entries, and error messages MUST be written in English.
- **Strict Typing:** No `any`. Use `unknown`, generic parameters, or narrowed union types.
- **Secrets Protection:** Never hardcode secrets, tokens, or keys in source or tests. Use environment variables defined in `.env.example`. Never read or log `.env*` or files in `certs/`.

---

## 4. Verification & Quality Gates

Every code change must pass:

1. `pnpm typecheck` — TypeScript strict typecheck with zero errors
2. `pnpm lint` — ESLint verification with zero warnings/errors
3. `pnpm test` — Vitest unit, contract, and tenant-isolation tests
4. `pnpm run format:check` — Prettier verification
