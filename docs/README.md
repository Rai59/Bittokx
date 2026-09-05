# Bittokx docs

| File | Purpose |
|---|---|
| `00-prd.md` | Product: problem, jobs, users, prototype, success |
| `01-architecture.md` | How it is built. **The prototype cut is the build list.** |
| `02-approval-policy.md` | Who may do what |
| `03-acceptance-criteria.md` | How we know a slice is done |
| `04-decisions.md` | ADR-001 … ADR-020 |
| `05-research-synthesis.md` | Evidence. **Does not override the PRD or the prototype cut.** |
| `06-review.md` | Over-engineering review: what to keep, what to cut |

Conventions: dates in ISO; currency stated explicitly (NPR / USD / GBP).

**If research and architecture disagree, the PRD plus the prototype cut win.** Research may add an ADR only when a ship decision changes. Do not grow the spec from a paper.

Read order: PRD → approval policy → prototype cut in architecture → acceptance criteria. Decisions and research are appendices. Re-read `06-review.md` before writing code.
