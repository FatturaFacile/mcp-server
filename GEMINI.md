# Gemini CLI Instructions — fatturafacile-mcp-server

@AGENTS.md

## Execution Directives
- Adhere strictly to the architectural invariants and quality commands defined in `AGENTS.md`.
- Enforce TypeScript Strict Mode (zero `any`, full Zod validation).
- Use `pnpm` exclusively (`pnpm run typecheck`, `pnpm run lint`, `pnpm run test`).
- Enforce strict tenant isolation across all Redis cache keys, queries, and audit events.
