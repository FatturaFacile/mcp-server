# GitHub Copilot Instructions — fatturafacile-mcp-server

Refer to [AGENTS.md](../AGENTS.md) for complete architectural specifications, module boundaries, and quality standards.

## Project & Stack Summary
- **Architecture:** Official MCP AI Gateway for the Fattura Facile ERP ecosystem.
- **Tech Stack:** Node.js (>= 22.0.0), TypeScript 5.8+ (Strict Mode, zero `any`), Zod validation, Vitest, Playwright.
- **Package Manager:** `pnpm` exclusively (`pnpm install --frozen-lockfile`). Never use `npm` or `yarn`.

## Architectural Invariants
1. **OpenAPI SSoT:** All backend communication must use `@fatturafacile/openapi-sdk` via `src/sdk/client-factory.ts`. Never craft raw HTTP requests.
2. **Context & Multi-Tenancy:** All tools, resources, and workflows must accept an explicit `ExecutionContext` (`tenant`, `user`, `company`, `permissions`). Prevent cross-tenant leakage.
3. **Base Tool Framework:** Extend `src/tools/base/tool.ts` with Zod input/output schemas, telemetry, retries, and tenant-scoped caching.

## Key Quality Commands
- Build: `pnpm run build`
- Typecheck: `pnpm run typecheck`
- Lint: `pnpm run lint`
- Tests: `pnpm run test`
- Full Quality Gate: `pnpm run typecheck && pnpm run lint && pnpm run test`
