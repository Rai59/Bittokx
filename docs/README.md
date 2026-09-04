# Bittokx docs

| File | Purpose |
|---|---|
| `00-prd.md` | Product requirements for MVP 1 / prototype: problem, design partner, goals, non-goals, jobs, channels, pricing, metrics, risks, open questions, eval plan |
| `01-architecture.md` | System architecture: tenancy, canonical model, agent runtime, policy engine, approval queue, memory, audit log, model routing, channels, build order |
| `02-approval-policy.md` | Action classes with prototype and MVP 1 defaults, rule format, graduation, escalation triggers |
| `03-acceptance-criteria.md` | Testable acceptance criteria per subsystem and design-partner exit criteria |
| `04-decisions.md` | Decision log (ADR-001 … ADR-018) with evidence and reversal conditions |
| `05-research-synthesis.md` | Evidence base: how labs and comparable products actually build agents; copy vs reject; mapping to Bittokx |

Conventions: dates in ISO; currency stated explicitly (NPR / USD / GBP). If
`05-research-synthesis.md` and an architecture claim disagree, the research
file wins until an ADR records the override. Every factual claim in the ADRs
points to a source listed there.
