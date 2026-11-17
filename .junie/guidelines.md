# JetBrains Junie / AI Assistant Guidelines — fatturafacile-mcp-server

Refer to [AGENTS.md](../AGENTS.md) for full project standards and architectural requirements.

## Stack & Quality Gates
- **Stack:** Node.js (>= 22.0.0), TypeScript 5.8+ Strict Mode, Zod, pnpm.
- **Package Manager:** `pnpm` exclusively.

## Verification Commands
- **Build:** `pnpm run build`
- **Typecheck:** `pnpm run typecheck`
- **Lint:** `pnpm run lint` (fix: `pnpm run lint:fix`)
- **Unit & Integration Tests:** `pnpm run test`
- **E2E Tests:** `pnpm run test:e2e`

## Key Architecture Rules
- Use `@fatturafacile/openapi-sdk` for all ERP API interactions.
- Enforce `ExecutionContext` (`tenant`, `user`, `company`, `permissions`) with zero cross-tenant leakage.
- Extend `src/tools/base/tool.ts` for all MCP tools.
