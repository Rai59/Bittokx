# Bittokx — Research synthesis (how labs and products actually build agents)

Status: 2026-09-04. This document is the evidence base for `01-architecture.md`
and `04-decisions.md`. Architecture is not final relative to this file: if a
claim here and a claim there disagree, this file wins until an ADR records the
override.

Scope: 2025–2026 lab papers and engineering posts; open agent runtimes; ERP /
finance agents; CRM / CX agents; Anthropic's open-source commerce blueprint
(announced 2026-09-02). Not a literature review of every paper. Only sources
that change a Bittokx decision.

## 1. What we are actually building

Bittokx is a **merchant-side operations agent** for a Nepali clothing
e-commerce SMB, plus a **customer-care agent in Instagram / TikTok DMs**.
Customers already shop on Daraz and the owner's own site. We do not build a
storefront shopping agent. We do not take payment. We do not place orders.

Closest published analog: Anthropic's **merchant agent** + the shopping
agent's **customer-care** skill — not the shopping agent's search / cart /
checkout loop.

Closest commercial analog for CS: **Gorgias** (Shopify helpdesk with order /
refund tools). Difference: Nepal, Daraz, social DMs, hosted ERPNext, and an
Accounts role. Gorgias is Shopify-native and helpdesk-shaped.

WorkOS is **not** a CRM analog. It is auth / Fine-Grained Authorization for
governable agents. Relevant later for tenant + tool authorization, not MVP 1.

## 2. Verdict in one page

| Pattern | Copy for Bittokx? | Why |
|---|---|---|
| One model in one agent loop + skills | **Yes** | Anthropic production commerce: skills beat giant-prompt and subagents on quality, cost, latency |
| Intent router / subagent-per-domain | **No** | State-lossy handoffs; CS+Accounts work is one coupled session per thread |
| Subagent as a tool for self-contained reads | Later, not MVP 1 | Deep research / weekly market scan only |
| Skills by frequency (≥~1/3 of traffic → prompt) | **Yes** | Loading a skill costs a turn |
| Safety / legal / brand always in prompt | **Yes** | Non-negotiable |
| Tools call existing systems; do not reimplement ranking / cart / ledger | **Yes** | ERPNext, Daraz, Gmail already exist |
| The model stages; a person or a policy applies | **Yes (already ADR-003/012)** | Every serious finance/CX product does this |
| Server-issued IDs only (provenance gate) | **Yes — add** | Stops hallucinated order/product/invoice IDs |
| Caps on resulting state; serialize writes per conversation | **Yes — add** | Agents retry/parallelize in ways humans don't |
| Third-party content sanitized + fenced | **Yes (already sketched)** | Customer DMs, Gmail, PDFs, Daraz text |
| Typed facts in our DB; async extractor after the turn | **Yes — amend ADR-006** | Extractor reads user+assistant text only, never tool results |
| Mem0 / markdown chat memory | **No** | Untyped, unauditable |
| Snapshot evals as the measurement bar | **Yes — replace simulated-user as primary** | Simulated-user is for discovery, not scoring |
| Prompt cache: global → session → volatile last | **Yes** | Design for 90–99% hit rate |
| Skills as tool results (not system-prompt appends) | **Yes** | Keeps the global cache prefix stable |
| Computer-use / cloud VM (Grok Bot) | **No for MVP 1** | We have APIs; a VM is not a security boundary |
| Fork commerce-agents / Hermes / OpenClaw as the product | **No** | Wrong shape, unmaintained or personal-assistant |
| LLM "senior approver" | **No (already ADR-004)** | Policy engine + human |
| Model-reported confidence as the gate | **No (already ADR-003)** | RiskEval; Intuit uses history confidence |
| Fine-tuning in MVP 1 | **No (already ADR-005)** | NVIDIA recipe starts with traces |
| Multi-agent swarm (Kimi PARL, Magentic-One) | **No for writes** | Wide search only |

## 3. Anthropic commerce agents (primary source)

Announced 2026-09-02. Official posts:

- [Building commerce agents with Claude](https://claude.com/blog/claude-for-commerce-agents)
- [Anatomy of effective commerce agents](https://claude.com/blog/the-anatomy-of-effective-commerce-agents)
- [Solutions / commerce](https://claude.com/solutions/commerce)
- Repo: [github.com/anthropics/commerce-agents](https://github.com/anthropics/commerce-agents) (Apache 2.0)

### 3.1 What the repo is

A **reference implementation**, not a product. Anthropic does not maintain it
and does not accept contributions. Two agents: **shopping** (in the merchant's
app) and **merchant** (staff back office). Vertical demos: retail, travel,
telecom, ticketing.

**Do not fork it as Bittokx.** It is Claude-only, storefront-shaped, and
unmaintained. Fork patterns: gates, `StorefrontBackend` / `MerchantBackend`
split, skills, fencing, staging, eval-authoring ideas.

### 3.2 Architecture they actually ship

One model in a standard agent loop + skills. **No intent router. No
subagent-per-domain.**

Why subagents lost in their deployments: a commerce conversation is one
tightly coupled session. The orchestrator holds cart / staged changes /
preferences / history. Every handoff is state-lossy, costs tokens, and adds
seconds. Domains do not separate cleanly (a return needs order + cart +
catalog). Skills give per-domain modularity without the handoff tax.

Subagents only for:

1. Self-contained **read-heavy** work (deep research) that returns a compact
   answer.
2. A **handoff** that takes over the conversation (e.g. a dedicated compliance
   agent). Delegation that bounces a subagent in and out of one turn degrades
   on every exchange.

Bittokx mapping: Customer Service and Accounts are **roles** (persona, tool
allowlist, memory scope), not subagents. One conversation never fans out to
both. A weekly market-research job can be a later read-only role.

### 3.3 Skills vs system prompt

Decide by frequency. Loading a skill costs a model turn.

- ≥ ~1/3 of traffic → system prompt.
- Long tail → `SKILL.md`.
- If a skill is predictable from a signal you already have (page, channel,
  intent classifier), inject it from the harness before the first model call.
- Safety, legal, brand, key user facts: **always in the prompt**.

Shopping skills in the blueprint: search-discovery, purchase-research,
planning-goals, customer-care, memory-personalization. Merchant skills:
performance-insights, catalog-listings, inventory-operations,
pricing-promotions, marketing-campaigns.

Bittokx CS skills (proposed): `order-status`, `returns-refunds`,
`checkout-link`, `language-mix`. Prompt holds: grounding, language, safety,
escalation, "never invent an order/price". Accounts skills: `gmail-invoice`,
`daraz-order-email`, `payment-match`. Prompt holds: "amounts copied not
computed", never money-out.

### 3.4 Tools

Call **existing systems**. Do not reimplement ranking, cart, inventory, or
ledger math. Tool results are context: drop unused fields. Errors should
include the next step ("include a product ID when querying availability"),
not a bare 403.

UI components are tools (`present_products`, …), not custom tags. For Bittokx
MVP 1 the customer surface is Instagram/TikTok **text**, so presentation
tools are not needed on CS. The owner PWA can use presentation tools later
for charts in the daily brief; until then, structured cards in our UI are
enough.

### 3.5 Safety: enforcement lives in the harness

Quote of the architecture, not of the model: **"The model stages; a person or
a policy applies."**

Shopping: `StorefrontBackend` has **no charge / order method**. Checkout is a
`checkout_handoff` URL the model never sees. That is exactly J3: we send a
Daraz / own-site link; we do not place the order.

Merchant: every write is a **staged change** with a **server-generated ID**.
`apply_change` succeeds only after host approval. Guardrails are **re-checked
at apply time** against current limits, not the limits when the change was
staged.

**Provenance gate:** writes and renders accept only IDs the server issued
**this session**. Hallucinated, user-pasted, or planted-in-a-review IDs are
refused before the backend sees it. Presentation tools take IDs; the server
fills the records.

**Caps on resulting state**, not on the request. Cart writes **serialized per
session** so parallel tool calls cannot stack past a cap.

**Third-party content:** sanitized + fenced. Prompt says fenced text is
material to report on, never instructions. Split injection evals: user-authored
vs data-plane (product names, reviews, email bodies).

### 3.6 Memory

Typed facts in **your** database, not markdown. Three-layer read:

1. Always-in-context (tiny: language default, owner timezone, store name).
2. Pre-fetched per turn from signals (order-id-shaped text → pull that order).
3. Lookup tool for the rest.

Write path: **async extractor after the turn** (or every few turns). It added
nothing to user-facing latency and scored 13% higher fact recall than an
in-loop save tool on Anthropic's internal commerce memory eval. The extractor
reads **user + assistant text only, never tool results**, so a product
description cannot become a fact about the customer. A validator on the write
path decides which types of memories we are willing to hold.

Merchant memory is keyed **per operator**, not shared login. For MVP 1 we
have one owner; still key facts `tenant + user_id` so staff later do not
share memory.

This **amends ADR-006**. Untyped Mem0/Letta chat extraction remains forbidden.
Typed extraction into the `facts` table, after the turn, with a validator, is
in.

### 3.7 Evals

**Snapshot evals**, not simulated-user, as the measurement bar. Construct the
messages array + tool state, append one user message, run, grade **final
state + rendered response**, not the path.

Simulated-user (second model plays the customer) is for **discovering** cases,
then each case is written as a snapshot.

50–100 cases per flow. Pair every positive with a negative. Cover: core
traffic, context-dependent requests, safety (user vs data-plane injection),
interface, **multi-capability** requests (evals written per skill miss
"markdown + stock" style questions). Start a share of cases from long, messy,
contradictory histories, not clean state.

CI: core + every safety case always; a skill change also runs that skill's
cases **and neighbor boundary cases**. Full suite nightly / before release.
Gate pass rate over a few trials, plus cache hit rate and cost per turn.

Forced grounding (in the blueprint's `grounding.py` idea): before answering
terms / order / price, the agent must have a tool result in this session.
Already in our AC-1.3 / R4; make it a harness check, not a prompt hope.

### 3.8 Caching

Design for **90–99% hit rate**. Prefix order:

1. **Global** — persona, safety, tool definitions. Byte-identical across
   sessions. Cache breakpoint at the end.
2. **Session** — tenant facts, conversation history, loaded skills.
3. **Volatile last** — current time, "this message arrived via Instagram".
   Never put a timestamp at the top of the system prompt.

Skills load as **tool results**, not system-prompt appends, so the global
prefix stays stable. Hermes does the same idea by injecting skills as user
messages. Pick tool-results (Anthropic) for Bittokx; do not mix.

## 4. Lab runtimes (what to steal, what to ignore)

### 4.1 OpenAI — *A Practical Guide to Building Agents* (2025) + Agents SDK

Start **single-agent**. Multi-agent only when needed: manager vs decentralized.
Guardrails: LLM classifiers **plus** rules **plus** tool risk ratings **plus**
output validation. HITL: failure thresholds and high-stakes ops.

SDK primitives that map: `Agent` + `Runner`; **handoffs vs agent-as-tool**;
guardrails every turn; `needs_approval` **pause / resume**; tracing.

Bittokx: our approval queue **is** `needs_approval`. The run must be durable
across that pause (see LangGraph below). Do not introduce an OpenAI-SDK
dependency; copy the pause/resume shape.

### 4.2 xAI Grok Bot

Persistent **account-scoped cloud VM**, shared across bots, **not a security
boundary**. Computer-use + MCP. **Auto Review** = an independent model on
risky actions; it **complements** least privilege, it does not replace it.
Require Approval beats Always Allow. Passwords / 2FA / payment: human takes
control; secrets never in chat. No self-host. US computers.

**Do not copy computer-use for MVP 1.** Instagram, Gmail, Daraz, ERPNext have
APIs. A VM that can click around Gmail is a liability, not a shortcut. Auto
Review as a second LLM is the "senior approver" we already rejected
(ADR-004); our equivalent is the policy engine + owner.

### 4.3 Hermes (Nous, Python)

`AIAgent` loop, tool registry, SQLite FTS, gateway with platform adapters,
`SKILL.md`, prompt caching (skills as **user messages** to keep the system
prefix stable), iteration budget, optional skill auto-generation.
Personal-assistant shaped.

Steal: gateway → session → one runtime; skills; cache-stable prefix;
iteration budget. Do not fork (ADR-010).

### 4.4 OpenClaw (TypeScript)

Gateway monolith: Brain / Hands / Memory / Heartbeat / Channels / Skills.
Markdown identity (`SOUL.md` / `AGENTS.md`). `EXTERNAL_UNTRUSTED_CONTENT`.
Exec Approval Manager. Local-first, one user.

Steal: untrusted-content fencing name, exec-approval manager, heartbeat for
proactive work (daily brief, reminder sweep). Do not fork (ADR-010). Tracking
a 16k-PR upstream is not a solo-founder job.

### 4.5 Microsoft Magentic-One (arXiv 2411.04468) + Magentic-UI

Orchestrator + WebSurfer / FileSurfer / Coder / ComputerTerminal; task and
progress ledgers. Magentic-UI adds UserProxy + co-planning.

Fit: **open-ended web/file tasks**. Not transactional commerce with a ledger.
Ignore for MVP 1.

### 4.6 NVIDIA — *Small Language Models are the Future of Agentic AI*
(arXiv 2506.02153)

SLMs for repetitive specialized invocations; heterogeneous systems. The
conversion algorithm starts with **logging traces then clustering**. That is
why ADR-005 defers fine-tuning until we have design-partner traces.

### 4.7 Meta ARE + Gaia2 (arXiv 2509.17158)

Eval platform: asynchronous, noisy, collaborative agent evals. Useful later
when we have a second human in the loop (staff). Snapshot evals first.

### 4.8 LangGraph

`interrupt()` + durable checkpointer (`AsyncPostgresSaver`) for HITL
pause/resume. **No side effects before interrupt** — the node re-runs on
resume. LangGraph has **no built-in audit log**.

Bittokx does not have to use LangGraph. It **does** have to treat a `draft`
decision as: persist run state, emit no vendor write, resume only after
approve/edit/reject, **re-run policy at apply time**. If we pick LangGraph
later, the audit log stays ours.

### 4.9 Kimi K2.5 Agent Swarm / PARL (arXiv 2602.02276)

Parallel subagents for **wide search** (reported up to 4.5× latency win).
Train orchestrator, freeze workers. Not for write-heavy commerce. Same
carve-out as Anthropic: fan-out only for independent reads.

### 4.10 GLM-5 (arXiv 2602.15763)

Agentic RL training infra; OpenAI-compatible tools. Model capability, not
product architecture. Candidate for `cheap_structured` after the Nepali eval,
not an architecture input.

## 5. ERP and finance products

The pattern is universal: **propose → human or rule applies**. Confidence is
history / rules, not a verbalized score.

| Product | What they actually do | Bittokx take |
|---|---|---|
| **Ramp Policy Agent** | Policy PDF + autonomy slider + deterministic hard stops; reported 65%+ auto-approve of in-policy expenses | Our graduation slider + YAML rules |
| **Mercury Command** | Explicit approval every action; Agent Cards spend only inside human-set caps | Prototype all-draft; amount caps on resulting state |
| **Brex** | Drafts + deterministic checks + reviewer agent; Agent Mesh of **narrow** agents | Narrow roles, not a mesh of LLMs approving each other |
| **Sage Close / AP** | Auto-posts **recurring** JEs under rules; AP under threshold; same permissions as a human; audit "who tasked / who approved" | Recurring patterns graduate; audit fields already in ADR-007 |
| **QuickBooks** | Ready-to-post from **history confidence**, not model confidence; auto-post via **user-written bank rules** | AC-CATEGORISE-RULE vs WEAK; never trust verbal confidence |
| **Xero JAX** | Auto-reconcile only high confidence via Rule / Match / Memory / Prediction; opt-in per bank account; reversible; 80%+ target, >97% accuracy on auto lines | Payment match exact → can graduate; fuzzy stays draft |
| **Intuit + Claude** (quoted on Anthropic commerce launch) | Personalized "what's shifting and why" with human expertise in the loop | Daily brief + ask-my-business, numbers from tools |

We already chose ERPNext over Odoo (ADR-001). Nothing in this round changes
that. UK/AU later: same UI and agents, Xero/QuickBooks adapters; JAX-style
reconciliation is the Accounts target, not a year-1 feature.

## 6. CRM and CX products

| Product | Shape | Copy / reject |
|---|---|---|
| **Intercom Fin** | Procedures = NL + **deterministic** eligibility / threshold blocks + handoff | Copy: policy in code, conversation in LLM |
| **Sierra** | Constellation of models; **supervisors** intercept outputs; deterministic guards (auth before tools); τ-bench; Agent Data Platform memory; Journeys; **pay per resolution** | Copy: supervisors as **code** not LLM; τ-bench; per-resolution pricing analog. Reject: model constellation for MVP 1 |
| **Decagon** | AOPs (monolithic procedures); Watchtower QA on 100% of conversations; enterprise FDE model | Copy: 100% draft review in prototype is our Watchtower. Reject: FDE services business |
| **Salesforce Agentforce (2026)** | **Hybrid reasoning**: Agent Script `before_reasoning` / `after_reasoning` always run as code; Atlas is a **state machine**; LLM only on prompt-bearing nodes; Einstein Trust Layer; "transfer to human" is an action | Copy: deterministic before/after the model (that's our policy engine + provenance). Reject: Salesforce lock-in |
| **HubSpot Breeze** | Agents as **workflow primitives** (`Run Agent`); audit cards; omnichannel including Instagram / WhatsApp | Copy: audit cards in owner UI; Instagram as a first-class channel. Reject: HubSpot as the system of record |
| **Zendesk** | Helpdesk-native deflection / triage / copilot | Different product: tickets, not ERP + social-DM ops |
| **Gorgias** | Closest **e-commerce CS competitor**: Shopify orders/refunds, Temporal workflows for pause/resume | Compete later in UK Shopify shops; Nepal/Daraz/ERP is the wedge |
| **WorkOS** | Auth / FGA: RBAC + resource scope, scoped credentials, audit | Later: tenant isolation and "agent can call this tool on this order". Not a CRM |

## 7. Papers already cited in ADRs (still hold)

- MAST / Why MAS fail (NeurIPS 2025): multi-agent gains often minimal;
  specification and inter-agent misalignment dominate failures.
- Cognition "Don't Build Multi-Agents" vs Anthropic multi-agent research
  post: fan out only for independent read-heavy work.
- τ / τ²-bench: top models follow CS policy well on pass^1, much worse on
  pass^k — reliability is controls + evals.
- RiskEval (arXiv 2601.07767) and Answer/Refuse/Guess (arXiv 2503.01332):
  verbal confidence ≠ action quality; models rarely abstain.
- Mem0 / Zep / LongMemEval: structured + temporal memory beats chat logs;
  vendor benchmarks contested.
- IETF Agent Audit Trail draft: pre-execution recording, hash chaining.

Nothing in the 2026-09-02 commerce blueprint contradicts these. It
**operationalizes** them for commerce.

## 8. Mapping: research → Bittokx architecture

What changes in the spec after this round (see ADRs 006-amended, 013–018):

1. **Do not fork commerce-agents.** Borrow gates, staging, skills, fencing,
   snapshot evals, cache order.
2. **Provenance / server-issued IDs.** Writes and customer-facing figures
   only for IDs returned by tools this session.
3. **Skills vs prompt by frequency.** Safety always in prompt.
4. **Snapshot evals** as the measurement bar. Simulated-user only for
   discovery. 50–100 cases per flow; positives paired with negatives.
5. **Cache prefix order** global → session → volatile last. Skills as tool
   results.
6. **Async typed memory extractor** after the turn; user+assistant text
   only; validator on write. Softens ADR-006.
7. **Forced grounding reads** before answering terms / order / price /
   availability. Harness-enforced.
8. **Serialize writes per conversation**; caps on resulting state; policy
   re-checked at apply time.
9. **Approval = pause/resume** of a durable run (OpenAI `needs_approval` /
   LangGraph `interrupt` / Anthropic staged IDs). No vendor side effect
   before the interrupt.
10. **Gorgias** named as CS competitor in the PRD. **WorkOS** named as
    later auth, not a CRM analog.

What does **not** change: ERPNext as ledger (ADR-001), thin canonical model
(ADR-002), deterministic policy engine (ADR-003), one runtime with roles as
config (ADR-004), no fine-tuning in MVP 1 (ADR-005), hash-chained audit log
(ADR-007), LiteLLM (ADR-008), Frappe + separate FastAPI (ADR-009), do not
fork Hermes/OpenClaw (ADR-010), NPR pricing (ADR-011), all-draft prototype
(ADR-012).

## 9. Sources (primary)

Lab / open runtimes

- Anthropic, *Building commerce agents with Claude*, 2026-09-02,
  https://claude.com/blog/claude-for-commerce-agents
- Anthropic, *A guide to the anatomy of effective commerce agents*, 2026-09-02,
  https://claude.com/blog/the-anatomy-of-effective-commerce-agents
- anthropics/commerce-agents, Apache-2.0,
  https://github.com/anthropics/commerce-agents
- OpenAI, *A Practical Guide to Building Agents*, 2025
- OpenAI Agents SDK: handoffs, guardrails, `needs_approval`
- xAI Grok Bot product docs (computer-use, Auto Review, approval modes)
- Hermes Agent (Nous Research) — gateway, skills, cache-stable prefix
- OpenClaw — Brain/Hands/Memory/Heartbeat, untrusted-content fencing
- Magentic-One, arXiv 2411.04468
- NVIDIA SLM agents, arXiv 2506.02153
- Meta ARE / Gaia2, arXiv 2509.17158
- LangGraph `interrupt()` + Postgres checkpointer docs
- Kimi K2.5 PARL, arXiv 2602.02276
- GLM-5, arXiv 2602.15763
- MAST, NeurIPS 2025; τ / τ²-bench; RiskEval arXiv 2601.07767;
  Answer/Refuse/Guess arXiv 2503.01332

Finance / ERP / CX

- Ramp Policy Agent; Mercury Command; Brex Agent Mesh; Sage Close/AP agents
- Intuit QuickBooks Ready-to-post / bank rules; Xero JAX reconciliation
- Intercom Fin Procedures; Sierra supervisors + τ-bench; Decagon AOPs +
  Watchtower; Salesforce Agentforce hybrid reasoning (2026); HubSpot Breeze
  `Run Agent`; Zendesk copilot; Gorgias Shopify helpdesk + Temporal
- WorkOS: Fine-Grained Authorization for agents (auth, not CRM)
