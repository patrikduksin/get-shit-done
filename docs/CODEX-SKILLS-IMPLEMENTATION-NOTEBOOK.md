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
- [2026-02-18] Added Codex runtime flag and plumbing in `bin/install.js`:
  - Added `--codex` flag parsing and runtime selection support.
  - Added Codex config dir resolution: `--config-dir` > `CODEX_HOME` > `~/.codex`.
  - Added Codex local dir support: `./.codex`.
  - Updated interactive runtime prompt + help text + examples to include Codex.
- [2026-02-18] Implemented Codex skills-first installation in `bin/install.js`:
  - Added command-to-skill transpilation (`commands/gsd/*.md` -> `skills/gsd-*/SKILL.md`).
  - Added Codex conversion helpers:
    - slash command refs: `/gsd:*` -> `$gsd-*`
    - arg placeholder: `$ARGUMENTS` -> `{{GSD_ARGS}}`
    - codex skill adapter preamble that maps legacy `Task(...)` orchestration to Codex collaboration tools.
  - Added Codex markdown conversion for copied `get-shit-done` and `agents` files.
- [2026-02-18] Integrated Codex install lifecycle behavior:
  - Codex install intentionally skips `settings.json`, hooks, and `package.json` CommonJS marker.
  - Added Codex uninstall cleanup for `skills/gsd-*`.
  - Updated manifest generation to track Codex skills (`skills/gsd-*/...`) and added runtime-aware manifest paths for OpenCode.
  - Updated patch reapply messaging to runtime-specific command (`$gsd-reapply-patches` on Codex).
- [2026-02-18] Updated user-facing metadata/docs:
  - `README.md`: added Codex support in runtime list, install/uninstall examples, verify commands, troubleshooting notes, and explicit skills-first note.
  - `package.json`: updated description and keywords to include Codex.

## Test Log
- [2026-02-18] `node --check bin/install.js` (pass)
- [2026-02-18] `node bin/install.js --help` (pass; `--codex` option + examples rendered)
- [2026-02-18] Codex local install smoke test in temp project (pass):
  - `node bin/install.js --codex --local`
  - Verified:
    - `.codex/skills/gsd-help/SKILL.md` exists
    - `.codex/get-shit-done/VERSION` exists
    - `.codex/agents/gsd-planner.md` exists
    - `.codex/settings.json` absent
    - `.codex/package.json` absent
    - `.codex/hooks/` absent
- [2026-02-18] Codex local uninstall smoke test in temp project (pass):
  - `node bin/install.js --codex --local --uninstall`
  - Verified all `skills/gsd-*` skill directories removed + `get-shit-done` removed.
- [2026-02-18] Codex global install/uninstall with custom config dir (pass):
  - `node bin/install.js --codex --global --config-dir <tmp>`
  - `node bin/install.js --codex --global --config-dir <tmp> --uninstall`
- [2026-02-18] Multi-runtime local install smoke test (pass):
  - `node bin/install.js --all --local`
  - Verified runtime outputs:
    - Claude: `./.claude/commands/gsd/help.md`
    - OpenCode: `./.opencode/command/gsd-help.md`
    - Gemini: `./.gemini/commands/gsd/help.toml`
    - Codex: `./.codex/skills/gsd-help/SKILL.md`
- [2026-02-18] Existing test suite command in package script:
  - `npm test` fails because script points to missing file `get-shit-done/bin/gsd-tools.test.js`.
  - Direct command `node --test get-shit-done/bin/gsd-tools.test.cjs` passes (83/83 tests).

## Commit Log
- [2026-02-18] `409fc0d` — `chore: add codex skills implementation notebook`
- [2026-02-18] `5a733dc` — `feat: add codex skills-first installer runtime`
