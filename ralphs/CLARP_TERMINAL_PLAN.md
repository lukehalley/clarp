# CLARP Terminal - Ralph Loop Build Plan

> Single comprehensive Ralph to build the entire CLARP Terminal MVP

---

## What is Ralph Loop?

Ralph is a development methodology where Claude iterates continuously on a task until completion. You run it once and walk away - Claude will:

1. Work on the task
2. Run tests/build to verify
3. If not complete, continue iterating
4. Repeat until done or max iterations reached

**Named after Ralph Wiggum** - persistent iteration despite setbacks.

---

## The Plan

One comprehensive prompt. One Ralph. Run for 8 hours or until done.

**File:** `ralphs/CLARP_TERMINAL_RALPH.md`

**Estimated iterations:** 50-100

**Estimated time:** 4-8 hours

---

## Pre-Flight

```bash
# Clean state
git status
npm run build && npm run lint

# Commit checkpoint
git add -A && git commit -m "checkpoint: pre-ralph clarp terminal"
```

---

## Run

```bash
/ralph-loop "$(cat ralphs/CLARP_TERMINAL_RALPH.md)" --max-iterations 100 --completion-promise "CLARP_TERMINAL_COMPLETE"
```

Then walk away. Check back in 4-8 hours.

---

## What Gets Built

| Component | Description |
|-----------|-------------|
| **Types** | Full TypeScript type system for all entities |
| **Layout** | Dark terminal UI with navigation |
| **Search** | Entity resolution for tickers, contracts, X handles, domains, ENS |
| **Scoring** | 4-module LARP score calculation with evidence |
| **Project Page** | Full analysis with score + risk cards |
| **Profile Page** | X handle analysis with behavior badges |
| **Watchlist** | Persistent tracking with score deltas |
| **Alerts** | Rule creation and management |
| **Reports** | Public shareable pages with OG tags |
| **Tests** | 20+ test cases covering all components |

---

## Completion Criteria

The Ralph will output `CLARP_TERMINAL_COMPLETE` when:

- All types compile
- All routes accessible
- Search works for all entity types
- Scoring engine works with 4 modules
- Project page renders with evidence
- Profile page renders with badges
- Watchlist persists and works
- Alerts can be created
- Reports are shareable
- All tests pass
- Build passes
- Lint passes

---

## If It Fails

If max iterations reached without completion:

1. Check `ralphs/blockers.md` (created if stuck)
2. Review git history to see progress
3. Run tests to see what's failing
4. Resume with a focused prompt on the blocking issue

```bash
# See what was done
git log --oneline -20

# Check test status
npm run test

# Resume with targeted fix
/ralph-loop "Fix the failing tests in __tests__/terminal/. The issue is [X]. <promise>TESTS_FIXED</promise>" --max-iterations 20
```

---

## Post-Ralph

```bash
# Verify everything
npm run build && npm run lint && npm run test

# Review the work
git diff HEAD~50 --stat

# Commit
git add -A && git commit -m "feat: CLARP Terminal MVP via Ralph Loop"
```

---

## Best Practices Applied

1. **Clear completion criteria** - Explicit checklist in prompt
2. **Self-correction** - Tests must pass each iteration
3. **Escape hatch** - Max 100 iterations, blocker documentation
4. **Automatic verification** - build/lint/test after every iteration
5. **Single session** - All work persists in files and git

---

## Reference

- [Ralph Loop Plugin](https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md)
- [Original technique by Geoffrey Huntley](https://ghuntley.com/ralph/)
- [PRD](../research/product/CLARP_Terminal_PRD_GTM_v1.md)
