# Claude Code Instructions — fatturafacile-mcp-server

@AGENTS.md

## Operational Guidelines for Claude Code
- **Package Manager:** Use `pnpm` exclusively. Never execute `npm` or `yarn`.
- **Token Efficiency:** Be concise and focused. Avoid conversational filler or echoing full files when proposing diffs.
- **Security & Privacy:** Never read, echo, or commit `.env*`, `.git/`, `certs/`, or credential tokens.
- **Quality Gates:** Before concluding any task, always execute:
  ```bash
  pnpm run typecheck
  pnpm run lint
  pnpm run test
  ```
- **Worktree Discipline:** Perform experimental refactors or multi-file architectural changes in dedicated git worktrees.
