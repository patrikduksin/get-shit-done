# Codex Skills-First Implementation Notebook

## Metadata
- Date: 2026-02-18
- Branch: `feat/codex-skills-first-support`
- Scope: Implement Codex support using skills-first approach (no deprecated custom prompts)
- Requested by: User in this session

## Goals
1. Add Codex runtime option to installer (`--codex`) with proper config directory handling (`CODEX_HOME`, `~/.codex`, `./.codex`).
2. Install GSD for Codex as skills under `skills/` (not prompts).
3. Preserve GSD workflows by transpiling command files to Codex skill layout.
4. Update path/command references for Codex usage patterns.
5. Keep implementation installer-focused and avoid changing core workflow source files unless required.

## Plan of Action
1. Add runtime plumbing for Codex in `bin/install.js`.
2. Add Codex skill transpiler and install/uninstall integration.
3. Add Codex-specific reference rewriting for installed content.
4. Update user-facing docs/help and finish-install guidance.
5. Validate with iterative tests and smoke runs.

## Work Log
- [2026-02-18] Created implementation branch `feat/codex-skills-first-support`.
- [2026-02-18] Initialized notebook with goals and implementation plan.

## Test Log
- None yet.

## Commit Log
- None yet.
