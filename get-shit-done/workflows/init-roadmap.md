<purpose>
Continue initialization from an existing PROJECT.md through: config -> optional research -> requirements -> roadmap.
This is the second half of initialization and is intended to run after `/gsd:new-project`.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

## 1. Setup

Load initialization context:

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init new-project)
```

Parse JSON for: `researcher_model`, `synthesizer_model`, `roadmapper_model`, `commit_docs`, `project_exists`, `project_path`.

**Guard rails:**
- If `project_exists` is false: error with guidance to run `/gsd:new-project` first.
- If `.planning/ROADMAP.md` already exists: report project is already initialized and exit.

Detect partial completion:

```bash
HAS_CONFIG=$([ -f .planning/config.json ] && echo "yes")
HAS_RESEARCH=$([ -d .planning/research ] && echo "yes")
HAS_REQUIREMENTS=$([ -f .planning/REQUIREMENTS.md ] && echo "yes")
HAS_ROADMAP=$([ -f .planning/ROADMAP.md ] && echo "yes")
```

## 2. Workflow Preferences

**Skip if `HAS_CONFIG=yes`.**

Check for global defaults at `~/.gsd/defaults.json` and offer to use them. If accepted, apply and skip manual settings questions.

Otherwise collect settings:

- Mode: YOLO / Interactive
- Depth: Quick / Standard / Comprehensive
- Parallelization
- Commit docs
- Workflow agents: Research / Plan Check / Verifier
- AI model profile: Balanced / Quality / Budget

Write `.planning/config.json` with chosen settings.

If `commit_docs=false`, add `.planning/` to `.gitignore`.

Commit config:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "chore: add project config" --files .planning/config.json
```

## 2.5 Resolve Models

Use models from init output:
- `researcher_model`
- `synthesizer_model`
- `roadmapper_model`

## 3. Research Decision

**Skip if `HAS_RESEARCH=yes`.**

Ask whether to research the domain before requirements.

If yes:
- Create `.planning/research/`
- Spawn 4 parallel `gsd-project-researcher` agents for STACK/FEATURES/ARCHITECTURE/PITFALLS.
- Each agent reads `.planning/PROJECT.md`.
- Spawn `gsd-research-synthesizer` to produce `.planning/research/SUMMARY.md`.

If no: proceed.

## 4. Define Requirements

**Skip if `HAS_REQUIREMENTS=yes`.**

Read `.planning/PROJECT.md` for core value and constraints.
If research exists, use `FEATURES.md` to drive category scoping.

For each category, ask what belongs in v1 using AskUserQuestion.
Track:
- Selected -> v1
- Unselected table stakes -> v2
- Unselected differentiators -> out of scope

Generate `.planning/REQUIREMENTS.md` with REQ IDs (`AUTH-01`, etc.).
Require specific, testable, user-centric requirement wording.

Present full requirement list for confirmation in interactive mode.

Commit:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: define v1 requirements" --files .planning/REQUIREMENTS.md
```

## 5. Create Roadmap

Display roadmap banner and spawn `gsd-roadmapper` with:

<files_to_read>
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/research/SUMMARY.md` (if exists)
- `.planning/config.json`
</files_to_read>

Roadmapper requirements:
- Derive phases from requirements
- Map every v1 requirement to exactly one phase
- Create phase success criteria
- Write `.planning/ROADMAP.md`, `.planning/STATE.md`, and update requirement traceability

If roadmapper returns blocked, resolve with user and retry.

For successful roadmap:
- Show summarized roadmap
- Ask approval in interactive mode
- Support revise loop until approved

Commit after approval:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: create roadmap ([N] phases)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
```

## 6. Done

Report completion:
- `PROJECT.md`, `config.json`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`
- research directory if created

Next step:
- `/gsd:discuss-phase 1`
- optionally `/gsd:plan-phase 1` to skip discussion

</process>
