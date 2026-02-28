---
name: gsd:init-roadmap
description: Continue initialization from PROJECT.md through config, research, requirements, and roadmap
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
<objective>
Continue project initialization after `/gsd:new-project` by creating workflow config, optional research, requirements, roadmap, and state.

**Creates:**
- `.planning/config.json`
- `.planning/research/` (optional)
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`

**After this command:** Run `/gsd:plan-phase 1` to start execution.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/init-roadmap.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/templates/requirements.md
</execution_context>

<process>
Execute the init-roadmap workflow from @~/.claude/get-shit-done/workflows/init-roadmap.md end-to-end.
Preserve all workflow gates (validation, approvals, commits, routing).
</process>
