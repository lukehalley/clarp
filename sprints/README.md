# CLARP Sprints

Development sprint history for the CLARP project.

## Completed Sprints

| Sprint | Name | Status | Completed |
|--------|------|--------|-----------|
| 1 | [CLARP Terminal MVP](./SPRINT_1_CLARP_TERMINAL.md) | COMPLETE | 2026-01-23 |

## Sprint Structure

Each sprint folder contains:
- `SPRINT_X_*.md` - Sprint completion summary with all checkboxes
- `SPRINT_X_RALPH_SPEC.md` - Original Ralph Loop specification (if applicable)

## Running Ralph Loops

To run a Ralph Loop for a sprint:

```bash
/ralph-loop "$(cat ralphs/SPRINT_NAME_RALPH.md)" --max-iterations 100 --completion-promise "PROMISE_NAME"
```
