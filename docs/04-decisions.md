# Bittokx — Decision Log

Short ADRs. Each records the decision, the evidence, and what would change it.
Evidence base: `05-research-synthesis.md`. ADR-001 … ADR-012 stand; ADR-006
is amended; ADR-013 … ADR-019 are the research-driven additions.

## ADR-001 ERPNext over Odoo as the hosted backend

Decision: ERPNext (Frappe) is the system of record for customers without their own
accounting software.

Evidence: Odoo Community ships Invoicing only; bank reconciliation, financial reports and
localisations are Enterprise (per-user paid). ERPNext ships full accounting under GPLv3
with the Frappe framework under MIT; native multi-site tenancy (one DB per site); auto
REST for every DocType; signed webhooks; a maintained Nepal compliance app (Bikram Sambat,
IRD CBMS sync, VAT registers); community UK MTD and Australian BAS apps;
`ecommerce_integrations` (Shopify/WooCommerce), `frappe_whatsapp`, Frappe CRM and
Helpdesk. Odoo 19 has native AI agents, which makes Odoo a competitor rather than a base.

Would change it: Frappe proving unworkable for the founder after the first month, or a
UK-first pivot where customers already own Xero (then no hosted ERP at all).

## ADR-002 Thin canonical model; vendor is always the system of record

Decision: agents read from a mirrored canonical model in Postgres and write only through
commands executed by adapters. No dual-write. ERPNext is the first adapter.

Evidence: per-adapter tooling multiplies work by the number of integrations and leaks
vendor concepts into prompts, memory and audit; a full second ledger creates conflict
and reconciliation problems. A read-mirror plus command interface gives one vocabulary
without owning the truth.

Would change it: never needing a second backend (then the mirror is overhead).

## ADR-003 Deterministic policy engine decides autonomy; the model never does

Decision: every agent command is classified by a rules engine into auto / draft /
forbidden before any side effect. Model-reported confidence is at most an input.

Evidence: RiskEval (arXiv 2601.07767, 2026) and "Answer, Refuse, or Guess?" (arXiv
2503.01332) show frontier models' verbal confidence is decoupled from action; they
almost never abstain even when abstention is optimal; enforcing the policy outside the
model works. Ramp, Rillet, Sage, Intuit, Mercury and Shopify all gate agent actions with
human-defined rules and thresholds, not model confidence.

Would change it: nothing in the foreseeable horizon; this is a control, not a tuning.

## ADR-004 One runtime, roles as configuration; no LLM "senior approver"

Decision: one agent loop; Customer Service and Accounts are role configs (persona,
tool allowlist, memory scope, model policy). The "senior" in the founder's hierarchy
metaphor is the policy engine plus the human, not another LLM.

Evidence: MAST (NeurIPS 2025) finds multi-agent gains over single-agent are often
minimal, with 41.8% of failures from specification/design and 36.9% from inter-agent
misalignment. Cognition's "Don't Build Multi-Agents" and Anthropic's research-system
post reconcile to: fan out only for independent read-heavy work; single decision-maker
for interdependent write-heavy work. Anthropic's 2026 commerce deployments: a single
agent with skills outperformed both one-giant-prompt and subagent-per-domain on quality,
cost, and latency; subagents only for self-contained reads or a conversation handoff.
Bittokx work is transactional. OpenAI's 2025 agents guide starts single-agent for the
same reason. Grok Bot "Auto Review" is a second model on risky actions — that is the
senior-approver pattern; we use the policy engine instead.

Would change it: a genuinely parallel, read-heavy job (e.g. weekly market research)
where an orchestrator-worker fan-out is warranted. That can be added as a role later.

## ADR-005 Specialisation by context, tools and evals; no fine-tuning in MVP 1

Decision: "expert in your business" is delivered by structured business memory, typed
tools over live data, the owner's policy as facts, and a τ-bench-style eval set built
from the design partner's real conversations. Fine-tuning small models for narrow
sub-tasks is deferred until traces exist.

Evidence: fine-tuning changes behaviour, not knowledge, and roughly three-quarters of
fine-tuning projects could be replaced by prompt work and structured outputs; the NVIDIA
SLM paper's own recipe starts with logging traces and clustering tasks. τ²-bench shows
top models at 95–99% pass^1 on policy-following customer service with much lower pass^k,
so reliability must come from controls and evals, not model choice alone.

Would change it: eval data showing a specific narrow task (e.g. Nepali intent
classification) where a LoRA-tuned small model beats routing on cost and accuracy.

## ADR-006 Memory is structured, bi-temporal, and extracted asynchronously

Decision: three layers — operational (canonical model), business knowledge
(`facts` table with `tenant + user_id`, valid_from/valid_to, source), episodic
(thread/task state). Reads are three-layer (always-in-context, pre-fetch,
lookup tool). Writes are an **async extractor after the turn** that reads
**user + assistant text only, never tool results**, through a predicate
validator. No Mem0 / Letta-style untyped chat memory. No in-loop "save memory"
tool on the customer-facing path.

Evidence: Anthropic commerce agents (2026-09-02) store typed facts in the
application DB; an async extractor scored 13% higher fact recall than a save
tool and added no user-facing latency; extractor isolation stops listings /
reviews becoming user facts. Zep/Graphiti's LongMemEval gains on knowledge-update
questions come from temporal validity, which we keep. Vendor memory benchmarks
are contested (LOCOMO flaws).

Would change it: a need for multi-hop graph traversal across entities; then
adopt Graphiti self-hosted behind the same facts interface. A jurisdiction that
forbids this class of memory: per-deployment switch off (extractor no-ops).

## ADR-007 Append-only, hash-chained audit log from day one

Decision: one `audit_event` row per action/decision, pre-execution recording for
draft/forbidden decisions, SHA-256 chain per tenant.

Evidence: EU AI Act Art. 12 record-keeping obligations effective August 2026; IETF
Agent Audit Trail draft specifies pre-execution recording for escalations/denials and
hash chaining; Rillet/Sage cite the audit log ("who gave the task, who approved") as the
core customer-trust feature. Cheap now, very expensive to retrofit.

## ADR-008 LiteLLM self-hosted as the model gateway

Decision: LiteLLM proxy with per-tenant virtual keys and caps; model groups
`cheap_structured`, `customer_facing`, `owner_facing`; Claude Sonnet 5 default for
customer-facing text until the Nepali eval clears cheaper models.

Evidence: LiteLLM is open source, self-hosted, OpenAI-compatible, supports fallbacks,
cost/latency routing and per-key spend tracking; OpenRouter adds a 5.5% fee and cannot be
self-hosted. Current list prices: Sonnet 5 $2/$10 per MTok (cache read $0.20), Haiku 4.5
$1/$5, DeepSeek V4 Flash $0.14/$0.28. Estimated inference COGS at 50–100 msgs/day:
$5–12/month with routing, ~$25 without.

Would change it: Nepali eval showing cheap models are unusable for customer text (cost
rises; routing still valid), or a hard data-residency requirement (self-hosted
open-weight models behind the same proxy).

## ADR-009 Frappe as platform, agent runtime as a separate Python service

Decision: ERPNext bench provides tenancy, auth, jobs, REST and webhooks; the agent
runtime, policy engine, adapters and audit log live in a separate FastAPI service that
talks to Frappe over REST only.

Evidence: keeps the LLM loop testable in isolation, lets the incoming AI engineer and
full-stack developer split cleanly, and avoids coupling agent code to MariaDB/Frappe
internals. Frappe still saves months of platform work.

Would change it: solo-founder velocity demanding everything inside one Frappe app for
the prototype; acceptable if the runtime keeps a REST-only boundary to Frappe.

## ADR-010 Do not fork Hermes Agent or OpenClaw; borrow patterns

Decision: borrow gateway → session → single runtime, skills as Markdown, exec-approval
manager, heartbeat/cron for proactive work. Do not fork. Same stance on Anthropic
commerce-agents (ADR-013).

Evidence: both are MIT and personal-assistant shaped (one user, file memory, chat in /
actions out); neither has tenancy, ledgers or approval policy as first-class concepts.
Tracking a fast-moving upstream (OpenClaw 2.0 shipped ~16k PRs) is not worth it for a
solo founder.

## ADR-011 Pricing: NPR base plus per-handled-conversation

Decision: base NPR 3,000–5,000/month with ~1,000 conversations included; NPR 3–5 per
additional handled conversation; frontier-model cap per tenant.

Evidence: Nepali accounting SaaS NPR 500–3,000/month; Kathmandu CSR NPR 13,000–40,000/
month; estimated COGS USD 12–30/tenant/month; Intercom Fin and Sierra price per
resolution. A flat USD 40–60 is 3–10× the local software market yet underprices a
customer that replaces a NPR 25,000 employee.

Would change it: design-partner refusal at the tested price, or measured COGS above
USD 30/tenant/month after routing.

## ADR-012 Prototype starts all-draft; autonomy is earned per class

Decision: in the first four weeks every consequential action is a draft; graduation to
auto is proposed per action class after 50 unedited approvals; money-out never
graduates.

Evidence: Ramp began suggestion-only and expanded autonomy as trust grew; QuickBooks
"Ready to post" derives confidence from the customer's own history. All-draft also
produces the labelled data the eval set and graduation logic need.

## ADR-013 Do not fork Anthropic commerce-agents; borrow the harness

Decision: treat [anthropics/commerce-agents](https://github.com/anthropics/commerce-agents)
(Apache 2.0, announced 2026-09-02) as a **pattern catalog**, not a dependency
and not our product. We are closer to their **merchant agent + shopping
customer-care skill** than to their storefront shopping agent. Customers shop
on Daraz / own site; our CS agent lives in Instagram / TikTok DMs.

Borrow: one loop + skills; `StorefrontBackend` has no charge method (our
checkout is a link); merchant writes are staged IDs applied after approval;
provenance gates; fencing; snapshot evals; cache prefix order; async typed
memory extractor.

Do not borrow: Claude-only runtime, shopping search/cart/checkout loop,
presentation-as-tools on the customer channel, computer-use, their eval plugin
as a required toolchain.

Evidence: Anthropic does not maintain the repo and does not accept
contributions. It is a blueprint for teams that already have a storefront.
Forking an unmaintained Claude-specific shopping agent would fight our
ERPNext + Daraz + social-DM shape.

Would change it: Anthropic starting to maintain the repo as a real SDK *and*
us needing a storefront shopping agent. Unlikely in MVP 1.

## ADR-014 Provenance gate: writes and figures only use session-issued IDs

Decision: the harness records every ID a tool returned this session. Commands
and customer-facing numbers (price, stock, order status, checkout URL) that
cite any other ID are refused before the adapter. The server fills records
from those IDs; the model does not supply amounts.

Evidence: Anthropic commerce harness: cart and merchant writes accept only
server-issued IDs; hallucinated / user-pasted / planted-in-a-review IDs never
reach the backend. Our R4 (invented order facts) is the same failure. Salesforce
Agentforce runs deterministic `before_reasoning` / `after_reasoning` scripts
for the same reason — the LLM is not the last check.

Would change it: a channel where the customer must be allowed to paste an
external order id we have never seen (then: lookup tool first, and only the
lookup's returned id becomes writable).

## ADR-015 Skills for the long tail; safety and high-frequency in the prompt

Decision: `SKILL.md` files for procedures used on a minority of turns; anything
on ≥ ~1/3 of traffic, plus all safety / legal / brand rules, stays in the role
system prompt. If a skill is predictable from channel or a cheap classifier,
the harness injects it before the first model call. Skills load as tool
results, never as system-prompt appends.

Evidence: Anthropic anatomy post: loading a skill costs a turn; skills beat
subagents because the main agent keeps the whole history. Hermes and OpenClaw
use the same Markdown skill pattern. Intercom Fin Procedures and Decagon AOPs
are the CX equivalent: procedure text, deterministic eligibility in code.

Would change it: evals showing a skill used on most turns (promote it into the
prompt) or a prompt that has grown past cache / quality limits (demote the
coldest sections into skills).

## ADR-016 Snapshot evals are the measurement bar

Decision: grade agents by constructing a messages array + tool/canonical state,
appending one user message, running, and scoring **final state + rendered
reply**, not the path. 50–100 cases per flow. Every positive case has a
negative twin. A share of cases start from long / messy / contradictory
histories. Simulated-user (second model as customer) is for **discovering**
cases only. CI always runs core traffic + every safety case; a skill change
also runs that skill and its neighbors' boundary cases. τ²-bench-style pass^k
remains the gate for routing a model customer-facing (policy adherence).

Evidence: Anthropic commerce evals: the API is stateless, so any conversation
state can be a snapshot; simulated-user pairs two non-deterministic systems
and is a poor measuring instrument. τ / τ²-bench still useful as a
policy-following floor. Meta ARE/Gaia2 is for later multi-human async evals.

Would change it: a flow that cannot be snapshotted (true multi-hour async
with a human in the middle) — then add an ARE-style scenario runner beside
snapshots, not instead of them.

## ADR-017 Prompt cache prefix is global → session → volatile last

Decision: design for 90–99% cache hit rate. Byte-identical global prefix
(persona, safety, tool defs) → session (tenant facts, history, loaded skills)
→ volatile last (time, channel). Skills as tool results. Never put a timestamp
or "current page" at the top of the system prompt.

Evidence: Anthropic: cached reads are ~10× cheaper and 1.5–2× faster at ~100k
tokens; best commerce deployments hit 90–99%. Hermes injects skills as user
messages for the same prefix stability. LiteLLM already exposes Anthropic-style
cache controls.

Would change it: a provider with no prefix cache (then the order still does
not hurt); or a hard requirement to rotate the global prompt per tenant in a
way that kills the global cache (accept the cost).

## ADR-018 Draft is a durable pause; policy is re-checked at apply time

Decision: a `draft` outcome persists run state and a server-generated staging
id, emits **no vendor write**, and resumes only after approve / edit / reject.
On approve, the policy engine runs again against **current** limits and the
**resulting** state, then the **adapter executes with no model in the path**.
Writes for one `Conversation` are serialised. Caps (reminders, discounts) are
enforced on the post-write state so parallel or retried tool calls cannot
stack past them.

Evidence: Mercury Command security post (16 Jul 2026): "The model proposes.
The product enforces. The user authorizes." After approval they "directly call
our backend to take the action, bypassing the AI entirely." Anthropic merchant
agent: `apply_change` only for approved staged ids; guardrails re-checked at
apply; cart writes serialised per session (`merchant_agent/gates.py`,
`shopping_agent/gates.py` in anthropics/commerce-agents). Sage Close agent:
does not post without approval. OpenAI Agents SDK `needs_approval`. LangGraph
`interrupt()` + durable checkpointer: the node **re-runs** on resume, so no
side effects before interrupt. Gorgias uses Temporal for the same pause/resume.

Would change it: adopting a workflow engine (Temporal) for the queue when we
have more than one human actor and long-running waits; the pause/resume
contract stays.

## ADR-019 Identity and secrets never enter the model

Decision: session start binds tenant + principal to an unguessable session id.
Later requests carry only that id. Tool arguments never include a user id,
payment credential, or checkout URL. Tokens live on the session / adapter.
Checkout URLs from `checkout_handoff` are attached **after** the model call.
Policy **hidden notes** (owner-only) are facts the customer-facing prompt never
sees. Model logs record a digest of the session id, not the id.

Evidence: commerce-agents `docs/safety.md` and `docs/backends.md` (identity
held by the server; no tool argument names a user; credentials never shown to
the model; checkout URL never through the model; session id is also the
request credential). Mercury: card numbers, SSNs, credentials never passed to
the underlying model. Ramp: hidden policy notes. WorkOS: LLM cannot police
itself; authorization is a resource graph.

Would change it: a regulator requiring the model to "see" a national ID in
order to answer — then a dedicated, scoped tool with redaction, not free text.
