@AGENTS.md

# Agent Rules — fatturafacile-mcp-server

Read, in this order, before planning or editing:

1. `AGENTS.md` (TypeScript strict guidelines, MCP Tool Framework, Clean Architecture)
2. `.ai/rules/index.md` and every rule file it maps to your paths (always `.ai/rules/project.md`)
3. `.github/copilot-instructions.md` (architecture, build, test, and quality commands)

Package manager: `pnpm` only. Never read or leak `.env*`, `.git/`, or keys in `certs/`.
All ERP backend interactions must pass through `fatturafacile-openapi-sdk`.
Strict multi-tenant context (`TenantContext`) required on every tool, prompt, resource, or workflow execution.
