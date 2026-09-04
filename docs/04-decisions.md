# Bittokx — Decision Log

Short ADRs. Each records the decision, the evidence, and what would change it.

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
for interdependent write-heavy work. Bittokx work is transactional.

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

## ADR-006 Memory is structured and bi-temporal; no free-text memory extraction in MVP 1

Decision: three layers — operational (canonical model), business knowledge (facts table
with valid_from/valid_to and source), episodic (thread/task state). No Mem0/Letta-style
automatic fact extraction from chat.

Evidence: for a business, most "memory" is the ERP. Temporal validity is what
distinguishes Zep/Graphiti's higher LongMemEval scores on knowledge-update questions and
also yields an audit trail. Vendor memory benchmarks are contested (LOCOMO flaws).

Would change it: a need for multi-hop graph traversal across entities; then adopt
Graphiti self-hosted behind the same facts interface.

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
manager, heartbeat/cron for proactive work. Do not fork.

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
