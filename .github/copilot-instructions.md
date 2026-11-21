# GitHub Copilot Instructions

Follow [AGENTS.md](../AGENTS.md) as the single source of truth for stack, architecture, locales (`it`, `de`, `fr`, `en`), direct `dev` git workflow, and `pnpm` quality gates.

- Copilot override: keep suggestions strictly typed (zero `any`), scoped to `ExecutionContext`, and verified with `pnpm run lint && pnpm run build && pnpm test`.
