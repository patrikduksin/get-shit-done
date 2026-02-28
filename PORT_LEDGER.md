# Hybrid Port Ledger

Base branch: `upstream-main`
Working branch: `codex/sync-upstream-hybrid`

| Source Commit | Strategy | Status | Notes |
|---|---|---|---|
| `1c6dc87` | Replay-first | Replayed with conflict resolution | Preserved convention discovery section in executor while keeping upstream safeguards |
| `127a7a6` | Replay + new | Replayed | Command-level map-codebase profile behavior |
| `83154d9` | Replay + new | Replayed | Map-codebase argument hint/profile override wording |
| `25bfccf` | New | Ported (new architecture) | Implemented split flow via `init-roadmap` command + workflow |
| `a94363b` | New | Ported (new architecture) | Year-sensitive stack prompt updated to 2026 in split workflow/backup command copy |
| `cecd694` | New | Ported | QUESTIONS_PENDING loop integrated into planner + plan-phase workflow |
| `27a4dea` | New | Ported | Collaborative philosophy restored across discuss-phase + planner/checker + executor tier protocol |
| `c17e4c2` | New | Ported | Planner approval now explicit via QUESTIONS_PENDING flow |
| `5c6444d` | New | Ported | Emphasis on correctness/context budget retained in planner |
| `7de185e` | New | Ported | Context-forward planner/checker behaviors preserved in current architecture |
| `f8d6ae7` | Partial new | Ported relevant part | Added branch-prefix safety guard in complete-milestone workflow |
| `0e7d589` | Skip replay | Skipped | Already present upstream |
