# Antigravity Rules — fatturafacile-mcp-server

Refer to [AGENTS.md](../AGENTS.md) for canonical architectural invariants, project layout, and quality commands.

## Core Directives
- **Package Manager:** `pnpm` exclusively. Never execute `npm` or `yarn`.
- **TypeScript Strict:** Strict mode enforced with zero `any`. Use `unknown` with Zod validation.
- **Tenant Isolation:** Enforce multi-tenancy context `{ tenant, user, company, permissions }` on all operations.
- **Verification:** Run `pnpm run typecheck`, `pnpm run lint`, and `pnpm run test` before completing tasks.
