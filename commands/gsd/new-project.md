---
name: gsd:new-project
description: Initialize project context and PROJECT.md (interactive split flow + auto end-to-end mode)
argument-hint: "[--auto]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
<context>
**Flags:**
- `--auto` — Unattended setup mode. Runs full initialization sequence (project capture + roadmap stages) without interactive phase handoff.
</context>

<objective>
Initialize a new project.

**Interactive mode (default):**
- Deep questioning and context capture
- Creates `.planning/PROJECT.md`
- Stops intentionally so you can context-reset before roadmap work

**Auto mode (`--auto`):**
- Runs full end-to-end initialization sequence
- Creates `PROJECT.md`, `config.json`, optional `research/`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`

**After interactive command:** Run `/gsd:init-roadmap`.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/new-project.md
@~/.claude/get-shit-done/references/questioning.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/templates/project.md
@~/.claude/get-shit-done/templates/requirements.md
</execution_context>

<process>
Execute the new-project workflow from @~/.claude/get-shit-done/workflows/new-project.md end-to-end.
Preserve all workflow gates (validation, approvals, commits, routing).
</process>
