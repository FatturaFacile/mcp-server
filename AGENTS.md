# AGENTS.md — fatturafacile-mcp-server

Canonical AI governance for the Fattura Facile ERP Model Context Protocol (MCP) AI Gateway.

## Stack & Runtime

- **Runtime:** Node.js `>= 22.0.0` (ESM), TypeScript `5.8+` (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `noImplicitOverride`).
- **Package Manager:** `pnpm` exclusively (`pnpm@12.18.0`, `pnpm install --frozen-lockfile`); never use `npm` or `yarn`.
- **Core Libs:** `@modelcontextprotocol/sdk`, `zod` (all schemas/config/contexts), `ioredis` (Redis + memory fallback), OpenTelemetry, Pino.
- **Testing:** Vitest (`tests/unit/`, `tests/integration/`), Playwright (`tests/e2e/`).

## Directory Layout & Boundaries

- `src/index.ts` — server bootstrap and `SIGINT`/`SIGTERM` graceful shutdown.
- `src/config/` — Zod-validated environment configuration (`environment.ts`).
- `src/server/` — MCP server core and capability registry (`mcp-server.ts`).
- `src/transport/` — transport adapters (`stdio`, `streamable-http`, `sse`).
- `src/auth/`, `src/permissions/`, `src/security/` — token/API-key auth, RBAC scopes, rate limiting, sanitization.
- `src/audit/`, `src/telemetry/` — immutable structured audit log and OpenTelemetry tracing/metrics.
- `src/cache/`, `src/queue/`, `src/search/` — tenant-partitioned Redis cache, async queue, semantic search abstraction.
- `src/sdk/` — ERP SDK client factory (`client-factory.ts`).
- `src/services/` — domain services orchestrating ERP SDK calls.
- `src/tools/` — 62 MCP tools extending `BaseTool` (`src/tools/base/tool.ts`).
- `src/resources/` — 28 read-only MCP resources extending `BaseResource` (`src/resources/base/resource.ts`).
- `src/prompts/` — 20 domain prompts extending `BasePrompt` (`src/prompts/base/prompt.ts`).
- `src/workflows/`, `src/orchestration/` — stateful multi-step workflows (with rollback) and tool dependency planner.
- `src/types/`, `src/errors/` — `ExecutionContext`/MCP contracts and `BaseError` domain error hierarchy.
- `tests/` — `tests/unit/`, `tests/integration/` (Vitest) and `tests/e2e/` (Playwright).

## Architectural & Coding Invariants

- **OpenAPI SSoT:** All ERP backend calls MUST go through `@fatturafacile/openapi-sdk` / `src/sdk/client-factory.ts`; never add duplicate DTOs, ad-hoc `fetch`/`axios` calls outside `src/sdk/`, or parallel domain models.
- **Multi-Tenancy & Isolation:** Every tool, resource, prompt, and workflow requires explicit `ExecutionContext` (`correlationId`, `tenant`, `user`, `company`, `permissions`, `timestamp`). Partition all Redis keys (`tenant:{tenantId}:company:{companyId}:...`), queries, and audit logs; zero cross-tenant leakage.
- **Audit & Security:** Emit immutable audit events via `src/audit/logger.ts` on sensitive operations and auth/validation failures. Never read, echo, hardcode, or commit `.env*`, `.git/`, `certs/`, `auth.json`, or secrets/keys.
- **Unified Frameworks:** Extend `BaseTool`, `BaseResource`, and `BasePrompt` with Zod validation, RBAC `requiredScopes`, OTel spans, retries, and tenant-scoped caching; preserve parity across `stdio`, `streamable-http`, and `sse`.
- **Strict Typing & Errors:** Zero `any` in new/edited code (use `unknown` + Zod or type guards); prefer `readonly` immutability; throw typed errors extending `BaseError` (`McpProtocolError`, `AuthenticationError`, `UnauthorizedError`, `TenantAccessViolationError`, `ValidationError`, `ErpIntegrationError`).
- **Localization:** Any user-facing strings, localized templates, or i18n keys added/changed MUST maintain full parity across all 4 Fattura Facile locales (`it`, `de`, `fr`, `en`).

## Git Workflow (`dev` Only — Zero PRs, Zero Leftovers)

- **Direct `dev` Integration:** Merge feature work locally into `dev`: `git checkout dev && git pull --rebase origin dev && git merge --no-ff <branch>`.
- **FORBIDDEN:** NEVER commit, merge, or push to `main`. NEVER create Pull Requests (`gh pr create` / `gh pr`).
- **Autonomous Conflict Resolution:** Resolve all merge conflicts autonomously, preserving Clean Architecture, strict TypeScript types, tenant isolation, and all 4 locales (`it`, `de`, `fr`, `en`).
- **Push Gate:** Never push to `origin dev` unless all quality gates pass with zero warnings/errors.
- **Mandatory End-of-Task Cleanup:** After pushing `dev`, ALWAYS delete merged local/remote feature branches (`git branch -D <branch>`, `git push origin --delete <branch>`), remove linked worktrees (`git worktree remove --force <path> && git worktree prune`), and delete session temp/debug files so `git status` is completely clean.

## Quality Gates (`pnpm` Exclusively)

- **Mandatory Gate (pre-commit / pre-push):** `pnpm run lint && pnpm run build && pnpm test`
- **Typecheck:** `pnpm run typecheck`
- **Formatting:** `pnpm run format:check` / `pnpm run format`
- **Lint Fix:** `pnpm run lint:fix`
- **Extended Verification:** `pnpm run test:coverage`, `pnpm run test:e2e`, `pnpm run docs`

## Governance Single Source of Truth

- Keep `AGENTS.md` dense, bullet-only, and `<= 120` lines.
- Tool wrappers (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.windsurfrules`, `.agy/rules.md`, `.junie/guidelines.md`, `.cursor/rules/project.mdc`) must stay ultra-short pointers to `AGENTS.md` plus tool-specific overrides only.
