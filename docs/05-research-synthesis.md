# Bittokx — Research synthesis (primary sources)

Status: 2026-09-05, pass 3. Pass 2 read primary sources. This pass adds the
papers and blogs from the founder’s 2026-09-05 list, and **stops treating this
file as architecture**.

**If this file and the PRD / prototype cut disagree, the PRD and prototype cut
win.** Research may add an ADR only when a ship decision changes. Do not grow
`01-architecture.md` from a paper.

How to read: §0 is the coverage checklist (every name you listed). §1 is the
verdict for Bittokx. The rest is evidence, with URLs and, for commerce-agents,
file paths from the cloned repo.

## 0. Coverage checklist (what you asked for)

| You asked | What I opened | Primary URL / path |
|---|---|---|
| 2025–2026 agent papers | Anthropic *Building effective agents* (Dec 2024, still the lab's stated patterns); Anthropic multi-agent research system; NVIDIA SLM agents arXiv 2506.02153; Meta ARE arXiv 2509.17158 + Gaia2; Magentic-One arXiv 2411.04468 (cited); MAST / τ-bench / RiskEval already in ADRs | links in §3 |
| Anthropic | Official commerce blogs + **cloned** `anthropics/commerce-agents` (Apache 2.0). Read `README.md`, `docs/safety.md`, `docs/backends.md`, `shopping_agent/gates.py`, `grounding.py`, `fencing.py`, `memory.py`, `skills/customer-care/SKILL.md`, `merchant_agent/gates.py` | https://github.com/anthropics/commerce-agents |
| OpenAI | *A Practical Guide to Building Agents* (2025) + Agents SDK primitives (handoffs, guardrails, `needs_approval`) as documented by OpenAI | see §3.2 |
| SpaceX AI | Treated as **xAI**. Official: *Designing Grok Bot* (2026-09-03) + `docs.x.ai/grok-bot/approvals-security-and-privacy` | https://x.ai/news/designing-grok-bot |
| GLM | GLM-5 agentic-RL paper (arXiv 2602.15763) — model training infra, not a product architecture. Candidate for `cheap_structured` after Nepali eval | arXiv 2602.15763 |
| Kimi | K2.5 Agent Swarm / PARL (arXiv 2602.02276) — parallel subagents for **wide search**, not write-heavy commerce | arXiv 2602.02276 |
| Meta | ARE + Gaia2: async, noisy, collaborative eval environments. Snapshot evals first for us | arXiv 2509.17158 |
| Microsoft | Magentic-One: Orchestrator + WebSurfer/FileSurfer/Coder/ComputerTerminal. Open-ended web/file, not a ledger | arXiv 2411.04468 |
| NVIDIA | *Small Language Models are the Future of Agentic AI*. Heterogeneous systems; conversion starts with **logging traces then clustering** | https://arxiv.org/abs/2506.02153 |
| LangChain | LangGraph `interrupt()` + durable checkpointer. Official docs: node **re-runs** on resume → no side effects before interrupt | https://docs.langchain.com/oss/python/langgraph/interrupts |
| Sage (“sega”) | Sage Intacct Close Automation / Close agent. Official: does **not** post without approval | https://www.sage.com/en-us/sage-business-cloud/intacct/product-capabilities/extended-capabilities/close-automation/ |
| Brex | *Agents on Brex*: Assistant, Review agent, Audit agent. Policy/SOP trained; human for exceptions | https://www.brex.com/platform/intelligent-finance |
| Mercury | Mercury **Command** (the bank, not mercuryagent.sh). Principal-engineer post: model proposes, product enforces, user authorizes; **apply bypasses the AI** | https://mercury.com/blog/security-principles-command |
| Ramp | Policy Agent GA (2026-01-13) + help center. Starts review-only; RAG cites policy; hidden notes; living policy | https://ramp.com/blog/ramp-policy-agent-ga-launch |
| QuickBooks | Intuit Assist / Ready-to-post (history confidence, user-written bank rules). Not re-fetched as a PDF this pass; pattern matches Ramp/Sage | Intuit product line |
| Xero | Official JAX page: permissioned **chat**, same Xero roles, no training on customer data, does nothing until opened. Do **not** treat marketing “80% auto-reconcile” as architecture without a primary page that states it | https://www.xero.com/us/ai-in-accounting/jax/ |
| Decagon | Official AOPs + Watchtower layered-guardrails post | https://decagon.ai/product/aop |
| Intercom Fin | Fin Procedures + $0.99/outcome. Procedures = multi-step + backend actions; native helpdesk | https://fin.ai/learn/what-is-fin-ai-agent |
| WorkOS | **Not a CRM.** Auth + Fine-Grained Authorization for agents (resource-scoped RBAC, OBO intersection check) | https://workos.com/blog/agents-need-authorization-not-just-authentication |
| Salesforce | Agentforce Builder 2026: Atlas as a **graph**; Agent Script for deterministic `before`/`after` reasoning | Salesforce Trailhead Agentforce Builder |
| HubSpot | Breeze agents as workflow primitives (`Run Agent`), omnichannel including Instagram/WhatsApp. Helpdesk-native, not our wedge | HubSpot product |
| Sierra | Official *Agents as a service*: Agent OS, Agent Data Platform, Ghostwriter, Journeys, pay for outcomes. Enterprise CX | https://sierra.ai/blog/agents-as-a-service |
| Zendesk | Helpdesk copilot / autonomous agents inside tickets. Different product shape | Zendesk product |
| Anthropic commerce agent (open source) | **Deep-read.** See §2 | cloned 2026-09-04 |
| Grok Bot internals | Official design + security docs. See §4.1 | x.ai + docs.x.ai |
| Hermes internals | Official architecture + gateway internals. See §4.2 | https://hermes-agent.nousresearch.com/docs/developer-guide/architecture |
| OpenClaw internals | Official architecture + memory. See §4.3 | https://docs.openclaw.ai/concepts/architecture |

Honest gaps this pass (ask if you want them next): full PDF of OpenAI’s 2025 agents guide; full GLM-5 and Kimi PARL PDFs beyond the abstract; HubSpot/Zendesk/Intuit engineering blogs (product pages only); Salesforce Agent Script language spec.

## 1. Verdict for a specialised e-commerce ops agent

Bittokx is **not** a storefront shopping agent. Customers already buy on Daraz and
the owner’s site. We are a **merchant-side operations agent** (Gmail → ledger)
plus **simple customer enquiry** in Instagram/TikTok DMs.

**How successful ecommerce companies split channels (2026):** Gorgias and
Shopify brands put the *order* in the store admin and email. Social DMs are
pre-sales and simple “where is my order / is this in stock.” Gorgias’s AI
even treats email/chat as the automated path first; social is often still
rules + humans. Accounting products (Xero, QuickBooks, Sage) take bills from
email/documents and take bank lines from an **upload** until Open Banking
(Yapily / TrueLayer / Plaid) is allowed. We copy that split: **Gmail is the
operations inbox. Instagram is enquiry. Bank CSV now; live feed later.**

Closest published analog: Anthropic’s **merchant agent** + the shopping agent’s
**customer-care** skill (`shopping-agent/skills/customer-care/SKILL.md`). Closest
commercial CS analog: Gorgias (Shopify helpdesk). Closest finance analog: Mercury
Command’s propose → enforce → authorize loop.

What every serious system in this round actually does:

1. **One loop + skills**, not an intent router or subagent-per-domain, for
   coupled commerce/support conversations.
2. **The model stages. The product enforces. A person or a rule applies.**
   After approval, the write hits the backend **without the model in the path**
   (Mercury, stated in their security post; Anthropic `apply_change` is the same
   shape).
3. **Safety is code**, not a prompt. Provenance IDs, fencing, caps on resulting
   state, serialised writes, grounding forced by the harness.
4. **Identity and secrets never enter the model.** Tool arguments do not carry
   user ids or payment URLs (commerce-agents `docs/safety.md`, `docs/backends.md`).
5. **Evals are snapshots** of final state, not simulated-user conversations, as
   the measurement bar.
6. **Do not fork** commerce-agents, Hermes, or OpenClaw as the product.

## 2. Anthropic commerce-agents (read from the repo)

Cloned 2026-09-04: https://github.com/anthropics/commerce-agents (Apache 2.0).

Official posts (also read):

- https://claude.com/blog/claude-for-commerce-agents (2026-09-02)
- https://claude.com/blog/the-anatomy-of-effective-commerce-agents (Shazal & Koen)

### 2.1 What the repo is

From `README.md`: two agents, each defined once (prompt, skills, tool contracts,
gates) and runnable on Messages API, Claude Agent SDK, and Managed Agents.
Verticals: retail, travel, telecom, entertainment.

It is a **reference implementation**. Anthropic does not maintain it as a product
and does not accept contributions. **Do not fork it as Bittokx.** It is
Claude-only and storefront-shaped. Steal the harness.

Explicit product constraint in the README:

> Nothing places an order, charges a card, or changes a live listing:
> `checkout` renders the cart for the host to complete, and every merchant
> write is staged until a person approves it.

### 2.2 Layout (what actually exists)

| Path | Role |
|---|---|
| `commerce-common/` | fencing, memory, skills, grounding, executor, events |
| `shopping-agent/core/` | `StorefrontBackend`, prompt, tools, **gates**, executor |
| `merchant-agent/core/` | `MerchantBackend`, **change guardrails**, gates |
| `*/runtime-messages-api/` | turn loop |
| `*/runtime-agent-sdk/` | same contracts, SDK runs the loop |
| `*/managed-agents/` | MCP servers |
| `shopping-agent/skills/` | search-discovery, purchase-research, planning-goals, **customer-care**, memory-personalization |
| `merchant-agent/skills/` | performance-insights, catalog-listings, inventory-operations, pricing-promotions, marketing-campaigns |
| `docs/safety.md` | every rule, the module that enforces it, and what a deployment must add |
| `plugins/commerce-builder/` | Claude Code plugin: scaffold, add flow, author evals, review |

Three runtimes share **one executor**. A gate inside a tool call holds on all
three paths (`docs/safety.md`).

### 2.3 Architecture they ship (anatomy post + code)

One model in a standard agent loop + skills. **No intent router. No
subagent-per-domain.** Commerce conversations are one coupled session (cart /
staged changes / history). Handoffs are state-lossy and expensive. Skills won
on quality, cost, and latency in their enterprise deployments.

Subagents only for (1) self-contained read-heavy work (deep research) that
returns a compact answer, or (2) a **handoff** that takes over the conversation.
The merchant **analysis delegate** (`docs/safety.md`) gets read tools only and
**adds nothing to the IDs the session may write to**.

Skills vs prompt: ≥ ~1/3 of traffic → system prompt. Long tail → `SKILL.md`.
Safety / legal / brand always in the prompt. Skills load as **tool results**,
not system-prompt appends (cache prefix).

### 2.4 Gates we copied from code, not from the blog

**Cart provenance** (`shopping-agent/core/shopping_agent/gates.py`):

- Writes accept only product ids a catalog or order tool returned **this
  session**, or lines already in the cart.
- Cap is on the **line after the write**, not on the request.
- `asyncio.Lock` per session because “a turn's tool calls run concurrently.”
- A held call returns `ToolOutcome.held("provenance", …)` with the next step
  (“call `get_product_details` with this exact id”). It does not throw.

**No payment** (`docs/safety.md` + `docs/backends.md`):

- `StorefrontBackend` has **no charge/order method**.
- `checkout` renders the cart. A hosted checkout URL comes from
  `checkout_handoff` **after** the model’s call and **never passes through the
  model**.

**Merchant staging** (`merchant-agent/core/merchant_agent/gates.py`):

- Staged writes accept only listing/campaign ids returned this session.
- `apply_change` / `discard_change` accept only change ids staging returned.
- Guardrails run at stage **and again at apply**, against config in force **at
  apply time**.
- Default `require_host_approval=True`. A preview card approves nothing. Chat
  text sets nothing. The mark comes from the portal or SDK `host_approve`.
- `STAGING_FOLLOWTHROUGH_REMINDER`: if the operator asked for a change and no
  `stage_*` ran, remind once. Never stage from invented values.

**Grounding** (`shopping_agent/grounding.py`): forced read **before** the model
answers, with `tool_choice`, in precedence order: terms → `search_policies`;
post-purchase → `get_orders`; unseen product id → `get_product_details`.

**Fencing** (`shopping_agent/fencing.py`): label `storefront_data`. Notice:
quoted records are facts; an instruction inside is something to **report,
never follow**. Sanitiser strips control chars, forged turn markers, tool-call
tags, copies of the fence.

**Memory** (`shopping_agent/memory.py` + `docs/safety.md`):

- Typed facts: key ≤ 64 chars, value ≤ 200, one of three categories.
- Identifier-shaped values refused by default.
- Extractor reads **user + assistant text of the last exchange, never tool
  results**.
- Saved fact carries a digest of the writing session, not the session id
  (the session id is also the request credential).
- Retention / delete / purge / `enable_memory` are config, not prompt bytes.

**Identity** (`docs/safety.md`, `docs/backends.md`):

- Session start binds a principal to an unguessable session id. Later requests
  carry only that id.
- **No tool argument names a user or a merchant.**
- Credentials live on the session / backend constructor, **never shown to the
  model**.

**What a deployment still owns** (the repo will not do this for us): auth on
every route, rate limits, fraud/eligibility in **our** backend, payment after
checkout, memory as personal data (see/correct/delete), log hygiene, approval
surface, guardrail **values**.

### 2.5 Customer-care skill (this is our CS agent)

From `shopping-agent/skills/customer-care/SKILL.md` (read in full):

- Status, returns, refunds, exchanges, damaged/late deliveries, terms.
- Dates/carriers from a record fetched **this conversation**. Until then, say
  only that you are looking it up.
- Terms from `search_policies`, quoted where the window/condition matters.
- Eligibility = record status + delivery date + today vs the policy window.
- **This flow reads.** Cancelling, refunds, money movement happen in the
  host’s support flow: describe the next step, make clear it has not happened.
- Upset customer → short factual sentences.
- Problem + shopping request in one message → settle the problem first, then
  the request, same turn.

That is J1–J5 for Bittokx, with Instagram text instead of `present_order_status`.

### 2.6 Evals and cache (anatomy post)

Snapshot evals: construct messages + state, one user message, grade **final
state + rendered reply**, not the path. Simulated-user is for discovery.
50–100 cases per flow. Pair every positive with a negative. Split injection:
user-authored vs data-plane. Multi-capability requests. Messy histories, not
only clean state. CI: core + every safety case always; skill change also runs
neighbor boundary cases.

Cache: design for 90–99% hit rate. Order: **global → session → volatile last**.
Never put a timestamp at the top of the system prompt.

## 3. Lab papers and engineering posts (2024–2026)

### 3.1 Anthropic — *Building effective agents* (19 Dec 2024)

https://www.anthropic.com/engineering/building-effective-agents

Still the lab’s stated pattern language (the page now points at Managed Agents
for current tooling):

- **Workflows** = LLM + tools on predefined code paths. **Agents** = the model
  directs its own tool use.
- Start with the simplest thing. Many apps need one LLM call + retrieval, not
  an agent.
- Patterns: prompt chaining, routing, parallelization (sectioning / voting),
  orchestrator-workers, evaluator-optimizer, then a tool-using loop.
- Three principles: keep it simple; show the plan; invest in the
  **agent-computer interface** (tool docs as carefully as prompts).
- **Customer support is listed as a canonical agent application**: conversation
  + tools for data/actions + measurable resolution. Usage-based pricing that
  charges only for successful resolutions is cited as evidence of confidence.
- Frameworks hide prompts; start with the API; if you use a framework, know
  what it does.

Bittokx: CS is exactly their appendix A. Accounts is a workflow with an agent
loop inside each document class, gated by code. We do not start with
orchestrator-workers.

### 3.2 Anthropic — multi-agent research system

https://www.anthropic.com/engineering/multi-agent-research-system

Fan-out of subagents for **breadth-first research**. They are explicit that
this is for open-ended search, not for interdependent writes. Matches MAST /
Cognition: fan out only for independent reads. Bittokx writes are
interdependent (order + policy + draft reply).

### 3.3 OpenAI — *A Practical Guide to Building Agents* (2025) + Agents SDK

Start single-agent. Multi-agent only when needed (manager vs decentralized).
Guardrails: classifiers **plus** rules **plus** tool risk ratings **plus**
output validation. HITL at failure thresholds and high-stakes ops.

SDK shape we copy, not the SDK itself: `Agent` + `Runner`; handoffs vs
agent-as-tool; guardrails every turn; `needs_approval` **pause/resume**;
tracing.

### 3.4 NVIDIA — SLMs are the future of agentic AI (arXiv 2506.02153)

https://arxiv.org/abs/2506.02153
https://research.nvidia.com/labs/lpr/slm-agents/

Position: many agent invocations are **narrow and repetitive**; small models
are enough, cheaper, and a better fit; heterogeneous systems (SLM + LLM) are
the default when conversation still needs a frontier model. Conversion
algorithm: **log traces, cluster tasks, then specialise**. That is why
ADR-005 defers fine-tuning until design-partner traces exist.

### 3.5 Meta ARE + Gaia2 (arXiv 2509.17158)

Research platform for environments with rules, tools, verifiers. Gaia2 is
async, noisy, collaborative, time-constrained. No model dominated all axes.
Useful later when we have staff in the loop. Snapshot evals first.

### 3.6 Microsoft Magentic-One (arXiv 2411.04468)

Orchestrator + WebSurfer / FileSurfer / Coder / ComputerTerminal; task ledger
+ progress ledger. Magentic-UI adds UserProxy + co-planning. Built for
open-ended computer/web work. Not a transactional ledger product.

### 3.7 LangChain / LangGraph

Official: https://docs.langchain.com/oss/python/langgraph/interrupts
Engineering: https://www.langchain.com/blog/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt

- `interrupt(value)` pauses, persists via a **checkpointer**, waits indefinitely.
- Resume with `Command(resume=…)`.
- **The node restarts from the beginning** on resume. Any side effect before
  `interrupt()` will run twice. Production needs a durable checkpointer
  (e.g. Postgres).
- LangGraph has **no built-in audit log**. If we use it later, audit stays ours.

Bittokx does not have to use LangGraph. It does have to treat `draft` as this
pause, with **no ERPNext write before the pause**.

### 3.8 Kimi PARL / GLM-5

Kimi Agent Swarm / PARL: parallel subagents for wide search (latency win on
that shape). GLM-5: agentic RL training, OpenAI-compatible tools. Both are
**model capability**, not a product architecture for e-commerce ops. GLM/Kimi
flash tiers remain `cheap_structured` candidates after the Nepali eval.

## 4. Grok Bot, Hermes, OpenClaw (architectures from official docs)

### 4.1 xAI Grok Bot (SpaceXAI)

Read:

- https://x.ai/news/designing-grok-bot (3 Sep 2026)
- https://docs.x.ai/grok-bot/approvals-security-and-privacy

**Product objects (they hid the rest):** Bots, Chats, Prompts (once / Skills /
Routines), Tools, Artifacts. The sidebar is a **Bot roster**, not a chat
history. A Bot has identity, memory, runtime, tools, and **its own computer**.

**Computer:** persistent account-scoped cloud VM (Firecracker). All Bots on one
account **share that computer**. Docs: do not use separate Bots as a security
boundary. Files, browser sessions, logins are shared. Passwords / 2FA /
payments: human **takes control**; secrets not in chat.

**Approvals:** Auto Review is a **second model** on tool calls and computer
actions. Require Approval always wins over Always Allow. Docs: Auto Review
**complements, does not replace**, least privilege.

**Coordination:** tools/skills at **account** level; memory and Routines at
**Bot** level. Group chats share project context; each Bot keeps specialised
memory. Routines start work without a prompt (schedule / event).

**Bittokx:** do **not** copy computer-use. Instagram, Gmail, Daraz, ERPNext
have APIs. A VM that can click Gmail is a liability. Auto Review as a second
LLM is the “senior approver” we rejected (ADR-004). Steal: persistent **roles**
(our CS / Accounts), Routines → daily brief / reminder sweep, “show the work”
for the owner, capabilities shared / memory scoped per role.

### 4.2 Hermes Agent (Nous Research)

Official:

- https://hermes-agent.nousresearch.com/docs/developer-guide/architecture
- https://hermes-agent.nousresearch.com/docs/developer-guide/gateway-internals
- https://github.com/NousResearch/hermes-agent/

**Shape:** personal autonomous agent. One `AIAgent` loop
(`agent/conversation_loop.py`) served by CLI, gateway, ACP, cron, API.

**Data flow:** platform event → adapter → `MessageEvent` → authorize → session
key `agent:main:{platform}:{chat_type}:{chat_id}` → `AIAgent.run_conversation`
→ deliver.

**Gateway:** 20+ adapters; two-level busy guard; `/approve` `/deny` `/stop`
bypass the guard inline; DM pairing; serialise per session while a run is
active.

**Prompt system:** ordered tiers `stable → context → volatile` (identity/tools/
skills, then context files, then memory/timestamp). Design principle:
**“System prompt doesn't change mid-conversation”** except `/model`. Prompt
caching via Anthropic breakpoints. Skills as `SKILL.md` (agentskills.io).

**Tools:** 70+ in a registry, import-time registration. Terminal backends
include Docker/SSH/Modal. `tools/approval.py` for dangerous commands.
Subagent via `delegate_tool.py`.

**Memory:** SQLite + FTS5; pluggable memory providers (Honcho); flush on
session end.

**Bittokx steal:** gateway → normalised message → one runtime; session key
per channel thread; skills; cache-stable prefix; iteration budget; cron as
first-class agent tasks (daily brief). **Do not fork:** one-user,
file/SQLite memory, no ledger, no tenancy.

### 4.3 OpenClaw (docs.openclaw.ai)

Official:

- https://docs.openclaw.ai/concepts/architecture
- https://docs.openclaw.ai/concepts/memory
- https://github.com/openclaw/openclaw

**Shape:** self-hosted **Gateway** (WS on `127.0.0.1:18789`) owns all channels
(WhatsApp, Telegram, Slack, Discord, Signal, iMessage). Clients and **nodes**
(macOS/iOS/Android) connect with device pairing. One Gateway per host; one
Baileys session.

**Loop:** ingress → `sessionKey` → **lane/queue (serial per session)** → agent
run → tools → reply on the same channel. Idempotency keys on side-effecting
methods.

**Memory:** Markdown in `~/.openclaw/workspace`: `USER.md`, `MEMORY.md`,
`memory/YYYY-MM-DD.md`. Dreaming sweep (sleep-time compute, arXiv 2504.13171)
promotes daily notes. **Memory does not enforce policy** — approvals and
sandboxing do. Untrusted candidates are taint-gated out of promotion.

**Heartbeat:** periodic turn; `HEARTBEAT.md` checklist; `HEARTBEAT_OK` is
suppressed.

**Bittokx steal:** serial per conversation; heartbeat → daily brief; untrusted
content fencing; exec-approval as a **platform** feature. **Do not copy**
Markdown as the system of record for a business, or a local-first one-user
gateway as the product.

## 5. ERP / finance agents (official pages)

The pattern is identical across Sage, Mercury, Ramp, Brex: **assume the model
will hallucinate; make harm impossible in code.**

### 5.1 Sage Intacct Close agent

https://www.sage.com/en-us/sage-business-cloud/intacct/product-capabilities/extended-capabilities/close-automation/

Close agent tracks tasks, flags issues, guides the close. FAQ, quoted:

> The Close agent doesn’t post entries or make changes without your approval.
> Every action happens within the boundaries you set, with full visibility and
> audit trails.

Trained on years of Sage financial data; embedded in Intacct, not a bolt-on.
Bittokx Accounts drafts are the same contract: we never post without the owner.

### 5.2 Mercury Command

https://mercury.com/command
https://mercury.com/blog/introducing-mercury-command
https://mercury.com/blog/security-principles-command (Manthan, principal engineer, 16 Jul 2026)

Sequence they will put in writing:

1. The model proposes.
2. The product enforces.
3. The user authorizes.

They “are not accepting ‘the model is careful’ as an answer.” After approval
they **call the backend directly, bypassing the AI entirely**, so the model
cannot retry a payment. Existing payment approval rules, daily limits,
dual-admin, spend controls carry over. Card numbers / SSNs / credentials never
go to the model. Hundreds of evals. Out of scope → human support.

This is the strongest primary source for ADR-018: **apply has no model**.

### 5.3 Ramp Policy Agent

https://ramp.com/blog/ramp-policy-agent-ga-launch (13 Jan 2026)
https://support.ramp.com/policy-agent-overview

- Starts **review-only**. You decide when it may auto-approve in-policy spend.
- Reviewers always retain final authority.
- Interprets policy semantically; **RAG cites the exact clause**.
- Outcomes: approval / rejection / review.
- Policy becomes a living document; **hidden notes** (e.g. “VP and above”)
  guide the agent without exposing them to employees.
- Partner: OpenAI; they state OpenAI does not train on Ramp customer data.
- Claimed: 1,000+ teams; 4–5 hours/week back; 7× more out-of-policy caught;
  reviewers see 10–15% of transactions.

Bittokx: graduation slider; cite policy fact ids (we already do); add
**owner-only hidden notes** on the policy document.

### 5.4 Brex intelligent finance

https://www.brex.com/platform/intelligent-finance

Three agents: **Assistant** (employee expenses), **Review** (auto-approve
low-risk, escalate exceptions), **Audit** (violations by risk). Train on
policy + SOPs + feedback. Data not used to train third-party models. Actions
transparent and reversible. 98% compliance claim (marketing). Narrow agents,
not an LLM mesh approving each other.

### 5.5 Xero JAX (correction)

https://www.xero.com/us/ai-in-accounting/jax/

What the official page actually says: JAX is a **chat** in the nav bar; same
Xero roles/permissions; does nothing until opened; third-party LLMs (AWS,
Azure, GCP, OpenAI) process input and **do not train** on it; user reviews
output. That is a copilot, not an auto-poster.

Earlier notes about “80% auto-reconcile / JAX bank rec” are **not** on this
page. Until we have a primary Xero page that states auto-post rules, Bittokx
must not copy that number. Payment-match graduation stays: exact match can
graduate; fuzzy stays draft — that comes from QuickBooks/Ramp, not from this
JAX page.

### 5.6 QuickBooks / Intuit

Ready-to-post from **history**, not verbalised model confidence; auto-post via
**user-written bank rules**. Matches ADR-003. Intuit Assist is the product
umbrella. Intuit also quoted on Anthropic’s commerce launch (Claude for
“what’s shifting and why”).

## 6. CRM / CX agents

### 6.1 Decagon

https://decagon.ai/product/aop
https://webflow2.decagon.ai/blog/designing-layered-guardrails-for-reliable-ai-agents

**AOPs:** natural-language SOPs that compile to agent behaviour; Git
versioning for engineering; CX can edit. **Watchtower:** QA on **every**
conversation. Layered guardrails: before / during / after; some models run
**in parallel** with generation and gate the send. Duet: generate AOPs from
transcripts. Enterprise + FDE motion. Bittokx prototype all-draft **is** our
Watchtower. We do not sell FDEs.

### 6.2 Intercom Fin

https://fin.ai/learn/what-is-fin-ai-agent
https://fin.ai/learn/ai-agent-procedures-aops-journeys

Fin Procedures: multi-step workflows with business logic and backend actions
(e.g. return: gather order → eligibility → refund via connected payments).
Priced **per outcome** (~$0.99). Native helpdesk so escalation does not cross
a system boundary. Deterministic eligibility blocks inside Procedures =
policy in code, conversation in LLM. Our CS-RETURN flow is the same job
without Fin issuing the money.

### 6.3 Sierra

https://sierra.ai/blog/agents-as-a-service

Agent OS + Agent Data Platform (memory) + Agent Studio + **Ghostwriter**
(agent that builds the agent from SOPs/transcripts) + Explorer (research over
your conversations). Voice/chat/email, 30+ languages, sandbox validation
before ship. Fortune-50 CX. Pay for outcomes. Supervisors / deterministic
guards historically; Ghostwriter is the 2025–26 rearchitecture around a
headless harness. Too heavy for a Nepal prototype; steal: evals as the PRD,
sandbox before apply, outcome pricing analog.

### 6.4 Salesforce Agentforce (2026)

Trailhead: Atlas upgraded to a **graph**; not everything is LLM-interpreted.
Agent Script encodes deterministic `if/else` and **before/after reasoning**
hooks. Simulate vs Live Test. “Transfer to human” is an action. Einstein
Trust Layer. Copy: deterministic before/after the model (our policy engine +
provenance). Reject: Salesforce lock-in.

### 6.5 HubSpot Breeze / Zendesk

Helpdesk-native agents and copilots, omnichannel (HubSpot includes Instagram /
WhatsApp). Audit cards. We are not a helpdesk; we are ERP + social-DM ops.
Steal omnichannel gateway ideas; do not become a Zendesk.

### 6.6 WorkOS (not a CRM)

https://workos.com/blog/agents-need-authorization-not-just-authentication
https://workos.com/blog/developers-guide-to-ai-agent-authentication-and-authorization
https://workos.com/docs/fga

Quote of their thesis: **you cannot rely on an LLM to police itself; you need
a deterministic resource graph.** FGA = RBAC attached to a resource hierarchy
(vertical inheritance, no lateral movement). For agents acting on behalf of a
user: **intersection check** (agent AND user must be allowed) — Confused
Deputy. Later for Bittokx when staff exist: “this agent may `lookup_order` on
tenant A’s orders, not tenant B.” Prototype: `tenant_id` on every row is the
coarse version. Schema-per-tenant is later.

## 7. Mapping → Bittokx (what this pass adds)

Already in the spec from pass 1, and **confirmed in primary sources**: one
loop + skills; provenance; snapshot evals; cache order; async typed extractor;
forced grounding; serialised writes; durable pause; do not fork the three
runtimes.

**New, from this pass, now in architecture/ADRs:**

1. **Apply bypasses the model.** After the owner taps approve, the adapter
   runs. No second model call. (Mercury Command security post; Anthropic
   `apply_change`.)
2. **Identity and secrets stay off the wire to the model.** No user id in tool
   args; checkout URL filled after the tool call; Gmail/Daraz tokens on the
   session. (commerce-agents `docs/safety.md`, `docs/backends.md`.)
3. **Owner-only hidden notes** on the policy document, like Ramp, so “refunds
   over NPR X always go to me” is not in the customer-facing prompt.
4. **Xero JAX is a permissioned copilot** on the official page, not an
   auto-poster. Do not cite 80% auto-reconcile until we have a primary source.
5. **Customer-care skill text** is the template for our CS `SKILL.md` (status
   then terms then next step; this flow reads; money is a handoff).

What still does **not** change: ERPNext, thin canonical model, deterministic
policy engine, all-draft prototype, money-out human-only, Frappe + FastAPI
split, NPR pricing.

What the **prototype cut** (`01-architecture.md`, `06-review.md`) now defers,
even though this file described them: LiteLLM, hash-chained audit, async
extractor, skills framework, schema-per-tenant, 50–100 eval cases per flow.
Those remain good *later* ideas. They are not week-1 work.

## 8. Source list (primary)

Anthropic / commerce

- https://github.com/anthropics/commerce-agents (cloned; files cited above)
- https://claude.com/blog/claude-for-commerce-agents
- https://claude.com/blog/the-anatomy-of-effective-commerce-agents
- https://www.anthropic.com/engineering/building-effective-agents
- https://www.anthropic.com/engineering/multi-agent-research-system

Labs

- OpenAI, *A Practical Guide to Building Agents*, 2025; Agents SDK
- https://x.ai/news/designing-grok-bot
- https://docs.x.ai/grok-bot/approvals-security-and-privacy
- https://arxiv.org/abs/2506.02153 (NVIDIA SLM agents)
- https://arxiv.org/abs/2509.17158 (Meta ARE / Gaia2)
- https://arxiv.org/abs/2411.04468 (Magentic-One)
- https://docs.langchain.com/oss/python/langgraph/interrupts
- https://www.langchain.com/blog/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt
- MAST (NeurIPS 2025); τ / τ²-bench; RiskEval arXiv 2601.07767; Answer/Refuse/Guess arXiv 2503.01332
- Kimi PARL arXiv 2602.02276; GLM-5 arXiv 2602.15763

Open runtimes

- https://hermes-agent.nousresearch.com/docs/developer-guide/architecture
- https://hermes-agent.nousresearch.com/docs/developer-guide/gateway-internals
- https://github.com/NousResearch/hermes-agent/
- https://docs.openclaw.ai/concepts/architecture
- https://docs.openclaw.ai/concepts/memory

Finance

- https://www.sage.com/en-us/sage-business-cloud/intacct/product-capabilities/extended-capabilities/close-automation/
- https://mercury.com/blog/security-principles-command
- https://mercury.com/blog/introducing-mercury-command
- https://ramp.com/blog/ramp-policy-agent-ga-launch
- https://support.ramp.com/policy-agent-overview
- https://www.brex.com/platform/intelligent-finance
- https://www.xero.com/us/ai-in-accounting/jax/

CX / auth

- https://decagon.ai/product/aop
- https://webflow2.decagon.ai/blog/designing-layered-guardrails-for-reliable-ai-agents
- https://fin.ai/learn/what-is-fin-ai-agent
- https://sierra.ai/blog/agents-as-a-service
- https://workos.com/blog/agents-need-authorization-not-just-authentication
- Salesforce Trailhead, Agentforce Builder 2026

## 9. 2026 papers and catalogues (2026-09-05) — use vs skip

Read: JetBrains *Top Agentic Frameworks 2026*; LangChain HITL / `interrupt`
post; Google *Towards a Science of Scaling Agent Systems*; VoltAgent
awesome-ai-agent-papers (watch list); the founder’s named papers.

### 9.1 Use

| Source | What it changes |
|---|---|
| Google *Science of Scaling Agent Systems* (Jan 2026, arXiv 2512.08296; [blog](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/)) | 180 configs. Sequential tasks: **every** multi-agent variant **39–70% worse**. Tool-heavy work pays a coordination tax. Independent swarms amplify errors **17.2×**. **Strengthens ADR-004.** Do not add a reviewer / planner / swarm. |
| JetBrains (Jun 2026) [frameworks post](https://blog.jetbrains.com/pycharm/2026/06/top-agentic-frameworks-for-building-applications-2026/) | Graph (LangGraph, OpenAI Agents SDK) for production HITL; role (AutoGen, CrewAI) for prototypes; chain (LangChain) for speed. **Catalogue, not a shopping list.** Prototype = FastAPI loop + `approvals` table. Consider LangGraph only if pause/resume becomes painful. |
| LangChain [HITL `interrupt` post](https://www.langchain.com/blog/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt) | Persist, pause before a side effect, human edits, resume. **Node re-runs** on resume → no write before the pause. We already copied the *shape* (ADR-018). We do not take their runtime. |
| Stanford *Adaptation of agentic AI* | Adapt **tools and prompts** first; SFT/RL after traces. Confirms ADR-005. |
| NVIDIA SLMs (already in §3.4) | Log traces, then consider a small model. Already ADR-005. |
| Kirsch *Domain-Specialized Agent Systems in Enterprise AI* | Use the **title**, not the machinery. We are already CS + Accounts on ERP. Do not add a “domain OS” layer. |

### 9.2 Skip (do not implement, do not add ADRs)

| Paper | Why skip |
|---|---|
| Stanford comprehensive review of agents | Background. Perceive–reason–act. We already have the loop. |
| DeepMind foundation agents (brain / emotion / reward) | We are not building a cognitive architecture. |
| Titans (test-time neural memory, 2M tokens) | Typed facts + ERP beat a neural memory module. |
| DeepSeek-R1 | Training a reasoner is not our job. |
| Meta RL compute scaling (400k GPU-hours) | We are not running that. |
| Microsoft Agent Lightning | RL on an existing agent, later if ever. |
| Meta ARE / Gaia2 | Later eval platform. 20 snapshot cases first. |
| AlphaEvolve | Algorithm discovery, not e-commerce ops. |
| Cambridge self-evolving agents (arXiv 2607.07663) | **No recursive self-improvement** on money or customer DMs. |
| VoltAgent/awesome-ai-agent-papers (364+ papers, 2026) | A **watch list**, not a build list. |

### 9.3 LangChain.com generally

The LangChain blog is a product + evals + HITL stream. Useful patterns:
interrupt before side effects; put the right tools and facts in the window, not
the whole company. That argues **against** a giant skills catalogue and
**against** always-on memory extraction in week 1. It does not argue for
adding LangChain or LangGraph as a dependency.
