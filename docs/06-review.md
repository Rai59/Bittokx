# Bittokx — Doc review (what to keep, what to cut)

Status: 2026-09-05. Read every spec file. Also read the JetBrains 2026
frameworks post, LangChain HITL / LangGraph material, Google’s *Science of
Scaling Agent Systems*, the VoltAgent 2026 paper list, and the papers you
named. This is a review, not a new architecture.

**Applied in v0.3:** the cuts below are now in `00`–`05`. This file stays as
the cut list so we do not grow the spec back.

## 1. Verdict

The **product** is clear and not over-specified: hosted ERPNext, our UI,
CS in Instagram/TikTok, Accounts from Gmail, all-draft prototype, money-out
human-only. Do not change that.

The **spec is over-engineered for a solo founder + one design partner**.
Several items belong in “after the prototype works”, not in week-1 build
or acceptance. If you build everything in `01` / `03` as written, you will
spend months on harness before the owner sees a useful draft.

Rule going forward: **prototype = one loop, typed tools, all-draft queue,
plain audit rows, 20 snapshot cases per live flow.** Everything else is
listed as later.

## 2. What is good (keep)

| Keep | Why |
|---|---|
| Product statement, J1–J10, design-partner success | This is the company |
| One runtime, two roles as config | Google 2026: sequential / tool-heavy tasks get **worse** with more agents (−39% to −70%). Confirms ADR-004 |
| Model stages; owner or policy applies; apply has no model | Mercury, Sage, Anthropic commerce-agents |
| Provenance + grounding on price / order / link | Stops invented facts (R4) |
| Fence untrusted DM / Gmail / PDF text | Injection is real |
| All-draft for 4 weeks | You need labelled data |
| Money-out forbidden | Non-negotiable |
| ERPNext as ledger, thin mirror | Still the right backend |
| Do not fork commerce-agents / Hermes / OpenClaw | Still right |

## 3. What is over-engineered (cut from prototype)

| Item | Where it lives now | Prototype | Later |
|---|---|---|---|
| Hash-chained audit + offline verifier | `01` §8, AC-0.2, ADR-007 | Append-only `audit_event` rows | Hash chain when a second tenant or UK compliance appears |
| Self-hosted LiteLLM + 3 model groups + 90–99% cache design | `01` §9, AC-6.4, ADR-008/017 | One Anthropic (or LiteLLM) key, Claude for customer text | Routing + cache discipline when cost or a second model appears |
| Async memory extractor + bi-temporal facts + hidden notes + AC-8 | `01` §7, AC-8, ADR-006 | Policy as uploaded text + a few hand-entered facts. No extractor | Extractor after you have traces |
| 50–100 snapshot cases **per flow** | `00` §14 | **20** cases per *shipped* flow (J6/J7 first). Pair a few negatives | 50–100 when you have real mail |
| Schema-per-tenant Postgres | `01` §2 | One schema + `tenant_id` on every row | Schema-per-tenant at tenant 2 if isolation tests fail |
| 14 canonical entities | `01` §3 | Prototype: Contact, Conversation, Message, Product, Order, Invoice, Document, ReturnRequest, Task | Bill, Payment, Expense, Refund when Accounts ships |
| Skills-by-frequency + 4 CS + 3 Accounts `SKILL.md` | `01` §4.2 | One persona file per role. Add a skill only when the persona file gets long | Frequency rule |
| Graduation engine (50-streak, policy versions, sliders) | `02` §4, AC-5 | All-draft. Owner flips a class to auto in config | Graduation after 4 weeks of data |
| WhatsApp approve-by-reply | AC-4.3, channels | Web app only | WhatsApp if she asks |
| Live bank feed (Yapily / TrueLayer) | — | **Not in prototype.** Company registration is too long. | After the company is registered. Pick Yapily or TrueLayer then. |
| Manual bank-statement CSV | AC-3.4, J11 | **In the prototype.** Same test path Xero / QuickBooks use before a feed. | Replaced by the live feed later |
| 15-day grievance “engine” | AC-2.5, CS-RETURN-DECISION | A date field + a line in the daily brief | Clock automation |
| EU AI Act / IETF audit alignment | `01` §8 | Ignore for Nepal prototype | Revisit for UK |
| Vue vs React / frappe-ui / PWA | `01` §1 | Pick one UI when you start the owner screen. Do not decide in the spec | — |
| Staff role | `00` §4 | No jobs. Drop from prototype users | When a second login exists |
| AC-TAX, AC-COA, AC-CLOSE, CS-DISCOUNT, categorise-rule/weak | `02` | Not J1–J10. Keep in the matrix as **later**, not build | After design partner |

## 4. Contradictions (v0.4 — founder corrections)

1. **Bank:** live feed (Yapily / TrueLayer) is later — company registration is long. **Manual CSV upload is in the prototype** so matching can be tested. AC-3.4 / J11 restored. Not a contradiction.
2. **Eval size:** 20 cases per shipped flow. Explained in plain language in the PRD.
3. **Staff:** one owner login. Explained in plain language in the PRD.
4. **OQ1–OQ5:** accepted defaults, explained in plain language.
5. **Product statement:** rewritten. Gmail is the ops inbox; social is enquiry.
6. **Build order:** **Gmail first** (J6 → J7 → J11), then Instagram enquiry (J1–J3). Same split Gorgias / Shopify brands use: email + store hold the order; social is pre-sales and simple questions.
7. **Audit:** a draft then an apply is **two rows**. That is the correct count.
8. **CS-RETURN-OPEN:** auto is correct. Consequential = customer commitment or ledger change. Opening an internal ticket is not consequential.
9. **Research does not override the PRD.**
10. **No SKILL.md files** until one exists in the repo.

## 5. What the new sources say (and what not to add)

### JetBrains (Jun 2026) — frameworks

https://blog.jetbrains.com/pycharm/2026/06/top-agentic-frameworks-for-building-applications-2026/

They sort frameworks by orchestration: **graph** (LangGraph, OpenAI Agents SDK) for production / HITL; **role** (AutoGen, CrewAI) for prototypes; **chain** (LangChain) for speed. LangGraph is their pick for customer-support-shaped production.

**Do not add LangGraph (or CrewAI, AutoGen, Semantic Kernel) as a Bittokx dependency.** JetBrains is a catalogue. Our prototype is a FastAPI loop + an `approvals` table. That *is* the graph: assemble → model → tools → draft → human → adapter. If pause/resume becomes painful, *then* consider LangGraph `interrupt()` + Postgres checkpointer. Not before.

### LangChain blog

Their own HITL post: persist state, pause before a side effect, human edits, resume. Node **re-runs** on resume → no write before the pause. We already copied the *shape*. We do not need their runtime.

Context-engineering posts: put the right tools and facts in the window, not the whole company. That argues **against** a giant skills catalogue and **against** always-on memory extraction in week 1.

### Google — *Towards a Science of Scaling Agent Systems* (Jan 2026)

https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/
arXiv 2512.08296

180 configs. Sequential tasks: **every** multi-agent variant was **39–70% worse**. Tool-heavy tasks pay a coordination tax. Independent swarms amplify errors **17.2×**. Centralized is better at containing errors (4.4×) but still worse than one agent on sequential work.

CS (look up order → draft reply) and Accounts (read email → draft invoice) are **sequential and tool-heavy**. This paper is the strongest reason yet to keep **one loop**. Do not add a reviewer agent, a planner, or a swarm.

### Papers you listed — keep vs skip

| Paper | Use for Bittokx? |
|---|---|
| Stanford comprehensive review of agents | Background. Perceive–reason–act. We already have the loop |
| DeepMind foundation agents (brain / emotion / reward) | **Skip.** We are not building a cognitive architecture |
| Titans (test-time neural memory, 2M tokens) | **Skip.** Typed facts + ERP beat a neural memory module |
| DeepSeek-R1 | **Skip.** Training a reasoner is not our job |
| Meta RL compute scaling | **Skip.** We are not running 400k GPU-hours |
| Stanford *Adaptation of agentic AI* (SFT / RL / tools) | Confirms: adapt **tools and prompts** first; SFT/RL after traces |
| Microsoft Agent Lightning | **Skip for prototype.** RL on an existing agent later |
| NVIDIA SLMs | Already in ADR-005: log traces, then consider a small model |
| Google scaling agent systems | **Use.** See above. Strengthens one-loop |
| Meta ARE / Gaia2 | Later eval platform. Snapshot cases first |
| AlphaEvolve | **Skip.** Algorithm discovery, not e-commerce ops |
| Cambridge self-evolving agents (arXiv 2607.07663) | **Skip.** No recursive self-improvement on money or customer DMs |
| Kirsch *Domain-Specialized Agent Systems in Enterprise AI* | **Use the title, not the machinery.** We are already a specialised enterprise agent (CS + Accounts on ERP). Do not add a “domain OS” layer |
| VoltAgent/awesome-ai-agent-papers (364+ papers, 2026 only) | A **watch list**, not a build list. Do not fold it into the architecture |

## 6. Recommended file hygiene (done; v0.4 updates channel + bank)

- `00-prd.md` — source of product truth. OQs marked accepted. Eval capped at 20.
- `01-architecture.md` — prototype cut is the build list.
- `02-approval-policy.md` — matrix kept; later classes labelled.
- `03-acceptance-criteria.md` — only tests what the prototype ships.
- `04-decisions.md` — no new ADRs. 006/007/008/012/015/016/017 amended to “later”.
- `05-research-synthesis.md` — evidence appendix. Does not override the PRD.
- This file — the cut list. Re-read before writing code.

## 7. What to do next (build, not more docs)

1. ERPNext site + owner web list (approve / edit / reject).
2. Gmail → Accounts drafts for J6/J7.
3. Statement CSV upload → exact payment-match drafts (J11).
4. Twenty snapshot cases on those jobs + two injection cases.
5. Then Instagram → simple CS enquiry (J1–J3).

Do not start with LiteLLM, Yapily, TrueLayer, hash chains, extractors, or a
skills framework.
