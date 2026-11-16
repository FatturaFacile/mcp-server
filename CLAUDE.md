# CLAUDE.md — fatturafacile-mcp-server

Official Model Context Protocol (MCP) AI Gateway for the Fattura Facile ERP ecosystem (Node.js LTS, TypeScript Strict Mode, pnpm, MIT).

## Quick References

- Architecture: `docs/architecture/ARCHITECTURE.md`
- Governance & Invariants: `.ai/rules/project.md`
- Technical Guidelines: `AGENTS.md`
- Commands Reference: `.github/copilot-instructions.md`

## Invariants (Non-Negotiable)

1. **OpenAPI SSoT:** All ERP communication strictly via `@fatturafacile/openapi-sdk` (or local SDK wrapper). No raw HTTP `fetch`/`axios`, duplicate DTOs, or parallel domain models.
2. **Multi-Tenancy & Security:** Explicit `TenantContext`, `UserContext`, `CompanyContext`, `PermissionContext` required on every tool, resource, prompt, or workflow call. Zero tenant leakage. Mandatory audit trail (`src/audit`).
3. **Unified Tool Framework:** All tools extend the base framework in `src/tools/base/tool.ts` with Zod validation, RBAC, OpenTelemetry spans, exponential retries, structured error handling, and Redis caching. Supported transports: `stdio`, `streamable-http`, `sse`.
4. **Clean Architecture:** Strict module boundaries across `src/{bootstrap,server,transport,auth,security,permissions,audit,telemetry,cache,queue,sdk,services,workflows,orchestration,tools,resources,prompts,schemas,types,errors}`. Zero `any`.

## Project Verification Commands

Always verify code modifications using:

- `pnpm typecheck` — Strict TypeScript compilation (0 errors required)
- `pnpm test` — Run complete Vitest suite (unit, integration, tenant-isolation)
- `pnpm run lint` — ESLint verification (0 warnings/errors required)
- `pnpm run format:check` — Prettier validation
- `pnpm run build` — Compile production distribution in `dist/`

## Implemented Architecture Summary

- **Tools (39 tools in `src/tools/`):** Customers, Invoices, Quotes, Payments, Products, Services, Companies, Contacts, Projects, Tasks, Files.
- **Resources (22 resources in `src/resources/`):** `company://*`, `customer://*`, `product://*`, `quote://*`, `invoice://*`, `payment://*`, `project://*`, `dashboard://*`.
- **Prompts (20 prompts in `src/prompts/`):** Sales, Customers, Finance, Productivity.
- **Workflows (`src/workflows/`):** Customer Onboarding, Quote Conversion, Overdue Recovery, Executive Reporting (with compensation & rollback).
- **Orchestration (`src/orchestration/`):** Multi-tool dependency graph execution.
- **Semantic Search (`src/search/`):** Vendor-neutral vector store & hybrid search abstraction.

## Token Optimization Rules

- Be concise. Return targeted diffs only.
- Read only relevant interfaces/signatures, never entire files unless required.
- Do not explain obvious language/framework syntax.
- Never read, write, or leak `.env*`, `.git/`, `certs/`, or credentials.
