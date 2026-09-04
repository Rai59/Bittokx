# Bittokx — Architecture (MVP 1)

Status: draft v0.2, 2026-09-04. Reasoning: `04-decisions.md`. Evidence:
`05-research-synthesis.md`. If this file and the research file disagree, the
research file wins until an ADR records the override.

## 1. Overview

```
 Customers                      Owner
 Instagram DM / TikTok DM       Mobile web app (PWA) / WhatsApp
        │                              │
        ▼                              ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Channel Gateway  (webhooks in, normalised Message out)  │
 └───────────────┬─────────────────────────────────────────┘
                 ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Agent Runtime (Python / FastAPI)                       │
 │   ├─ Roles: customer_service, accounts  (config)        │
 │   ├─ Skills: SKILL.md long tail; safety always in prompt │
 │   ├─ Tools: typed, per-role allowlist                    │
 │   ├─ Provenance: writes/renders only session-issued IDs  │
 │   ├─ Memory: operational | facts | episodic + extractor  │
 │   ├─ Policy Engine (deterministic)  ── auto/draft/forbid │
 │   ├─ Approval Queue (durable pause / resume)             │
 │   └─ Audit Log (append-only, hash-chained)               │
 └───────┬───────────────┬─────────────────┬────────────────┘
         │               │                 │
         ▼               ▼                 ▼
   LiteLLM proxy    Canonical Model     Adapters
   (routing, caps)  (Postgres)          ├─ ERPNext (site per tenant)
                                        ├─ Daraz Open Platform
                                        ├─ Gmail
                                        ├─ Own-site connector
                                        └─ (later) Xero / QuickBooks / HubSpot
```

Two deployable services plus ERPNext:

1. **ERPNext bench** — one Frappe site per tenant, `erpnext` + `nepal-compliance` +
   a small `bittokx` Frappe app (custom fields, webhooks, a service user per tenant).
2. **Bittokx API** — Python/FastAPI: channel gateway, agent runtime, policy engine,
   approval queue, audit log, canonical model, adapters. Talks to ERPNext over REST only.
3. **Bittokx Web** — owner UI (Vue + `frappe-ui`, or React; decide when the full-stack
   hire joins). Mobile-first PWA.

We are a **merchant-side ops agent + customer-care in DMs**, not a storefront
shopping agent. Customers check out on Daraz or the owner's site. See
`05-research-synthesis.md` §1 and ADR-013.

## 2. Tenancy

- Tenant = one business. One ERPNext site, one Postgres schema, one set of channel
  credentials, one LiteLLM virtual key with a monthly cap.
- No shared tables across tenants in the canonical model. Schema-per-tenant in Postgres;
  the agent runtime receives the tenant id from the gateway and cannot query outside it.

## 3. Canonical model (thin)

Purpose: one vocabulary for tools, memory, policy and audit. It is a **read model plus a
command interface**, not a second ledger.

Entities (v1): `Contact`, `Conversation`, `Message`, `Product`, `Order`, `OrderLine`,
`Invoice`, `Payment`, `Bill` (supplier), `Expense`, `ReturnRequest`, `Refund`,
`Document` (email/PDF/image attachment), `Task`.

Rules:

- **Reads**: adapters mirror vendor data into the canonical tables (webhooks + periodic
  sync). Agents read only from here. Every mirrored row carries `source_system`,
  `source_id`, `synced_at`.
- **Writes**: agents never write to a vendor. They emit **commands**
  (`CreateSalesInvoiceDraft`, `SendMessage`, `RecordRefund`, …). The policy engine
  classifies the command; the adapter executes it against the system of record; the
  mirror updates from the vendor's response or webhook. No dual-write.
- **Conflict**: the system of record always wins. If ERPNext and the mirror disagree,
  the mirror is wrong.

## 4. Agent runtime

One model in a standard loop: assemble context → model call via LiteLLM → tool
calls → repeat → final. No intent router. No subagent-per-domain. Anthropic's
2026 commerce deployments found skills beat both a giant prompt and
subagents on quality, cost, and latency; Bittokx work is the same shape
(transactional, shared cart/order/policy context). See ADR-004, ADR-013, ADR-015.

Synchronous per conversation: one run at a time per `Conversation`. Write tools
are serialised on that lock so parallel tool calls cannot stack past a cap
(ADR-018). Following the gateway pattern used by Hermes / OpenClaw.

### 4.1 Roles are configuration, not code paths

```yaml
role: customer_service
persona: prompts/customer_service.md        # safety, language, grounding, escalation
skills:                                     # long tail; loaded as tool results
  - skills/cs/order-status.md
  - skills/cs/returns-refunds.md
  - skills/cs/checkout-link.md
  - skills/cs/language-mix.md
tools:
  - lookup_order
  - lookup_product
  - lookup_policy
  - get_checkout_link
  - draft_reply            # produces a command: SendMessage
  - request_evidence       # produces a command: SendMessage (template)
  - open_return_request    # produces a command
  - escalate_to_owner      # always allowed
memory_scope: [operational, business_knowledge, episodic]
model_policy: customer_facing              # see LiteLLM section
```

Accounts is the same shape with `skills/accounts/{gmail-invoice,daraz-order-email,payment-match}.md`.

### 4.2 Skills vs system prompt (decide by frequency)

Loading a skill costs a model turn. Rule (ADR-015):

- Anything needed on ≥ ~1/3 of traffic, or any safety / legal / brand rule,
  lives in the role persona (system prompt).
- Long-tail procedures live in `SKILL.md` files and are loaded as **tool
  results**, never appended to the system prompt (keeps the global cache prefix
  stable — ADR-017).
- If a skill is predictable from a signal we already have (channel, a cheap
  classifier, "this email is a Daraz order"), the harness injects it before
  the first model call and skips the extra turn.

CS prompt holds: grounding, language, safety, escalation, "never invent an
order or a price". Accounts prompt holds: "amounts copied not computed", never
money-out.

Subagents are allowed later only as a **read-only tool** for self-contained
work (weekly market scan) or as a **handoff** that takes over the conversation.
They are not used inside a customer or accounts turn.

### 4.3 Tools

Typed (pydantic in, pydantic out). A tool either reads the canonical model or
returns a *command*. Tools never call vendors directly and never reimplement
ERPNext / Daraz / Gmail logic — they call adapters.

Tool results are context: return fields the model reasons with, drop the rest.
Error payloads include the next step ("include an order id"), not a bare code.

Customer-facing CS in MVP 1 is Instagram / TikTok **text**. Presentation-as-tools
(Anthropic `present_products`) are deferred until the owner PWA needs charts;
structured cards in our UI are enough.

### 4.4 Provenance, grounding, untrusted content

- **Provenance gate (ADR-014):** the harness keeps a per-session set of IDs
  the server has handed the model. Writes and customer-facing figures
  (price, stock, order status, checkout URL) accept only those IDs.
  Hallucinated, user-pasted, or planted-in-an-email IDs are refused before
  any adapter sees them.
- **Forced grounding:** before a reply asserts terms / order / price /
  availability, this session must contain a matching tool result. No result
  → escalate (`CS-ESCALATE`), never guess. Enforced in the harness, not the
  prompt.
- **Untrusted content** (customer messages, email bodies, PDF text, Daraz
  fields) is sanitised and wrapped in a fence before entering the prompt.
  The prompt says fenced text is material to report on, never instructions.
  Tool results are data, not instructions.
- **Caps on resulting state:** frequency caps, discount caps, reminder caps
  are checked against the state after the write, not against the request.
  Policy is **re-checked at apply time** (when the owner approves), not only
  when the draft was staged.

### 4.5 No self-granted autonomy

The model can request any tool in its allowlist. Whether the resulting
command executes, drafts, or is refused is decided by the policy engine.
Checkout is a handoff URL (`get_checkout_link`); there is no "place order"
or "charge" tool — matching Anthropic's `StorefrontBackend` having no charge
method.

## 5. Policy engine

Deterministic. Input: a `Command` plus context (tenant, role, amount, counterparty type,
policy-match result, history stats). Output: `auto | draft | forbidden` plus the matched
rule id and policy version. Details and the MVP matrix in `02-approval-policy.md`.

Properties:

- Evaluated before any side effect; the decision is written to the audit log
  *pre-execution* (an escalation logged after the fact proves nothing).
- Rules are data (YAML per tenant, versioned). The owner edits them in the UI; the
  default set ships with the product.
- Model-reported confidence may appear as an input to a rule, never as the rule.
- Graduation: per action class, count consecutive owner approvals with zero edits.
  At threshold (default 50) the system *proposes* moving the class to `auto`. Only the
  owner can accept.

## 6. Approval queue (durable pause / resume)

A `draft` decision is a **pause**, not a fire-and-forget ticket. Shape matches
OpenAI Agents SDK `needs_approval`, LangGraph `interrupt()`, and Anthropic
staged change IDs (ADR-018):

1. Policy engine returns `draft`.
2. Runtime persists run state (conversation, tool results, staged command with
   a **server-generated staging id**). **No vendor side effect** before this
   point — a resumed node may re-run.
3. An `Approval` is created: command, human-readable summary, agent's stated
   reason, evidence (tool results), policy rule, staging id.
4. Owner: approve, edit-then-approve, or reject-with-reason (web app; WhatsApp
   for items marked urgent).
5. On approve: policy is **re-evaluated against current limits** (graduation
   may have changed; inventory may have moved). If still allowed, the adapter
   executes using the staging id. If not, the item returns to the queue with
   the new reason.

Timeouts: customer-facing drafts unanswered for 30 min send a holding reply
("we're checking, will get back within N hours") — itself a pre-approved
template. Accounting drafts have no timeout; they roll into the daily brief.

## 7. Memory

| Layer | What | Store | Retrieval |
|---|---|---|---|
| Operational | orders, invoices, customers, tickets | canonical model (Postgres) | SQL via tools |
| Business knowledge | policies, SOPs, supplier terms, owner preferences, learned typed facts | `facts` table: `(tenant, user_id, subject, predicate, object, valid_from, valid_to, source, confidence)` — bi-temporal, superseded facts are closed not deleted | three-layer read below |
| Episodic | per-conversation and per-task state | `Conversation`, `Task` tables | by thread id |

**Read, three layers** (Anthropic commerce memory; ADR-006):

1. Always-in-context: tiny set (store name, owner timezone, language default).
2. Pre-fetched per turn from signals we already have (order-id-shaped text →
   that order; "return" → return policy facts).
3. Lookup tool for everything else.

**Write:** an **async extractor** runs after the turn (not a save tool in the
user-facing loop). It reads **user + assistant text only, never tool results**,
so a Daraz product title or a supplier PDF cannot become a fact about the
customer. Every write goes through a validator that allows only declared
predicates (size, language preference, "asks for photos before refund", …).
Untyped Mem0/Letta chat memory is forbidden.

Key facts `tenant + user_id` even while MVP 1 has one owner, so later staff
do not share memory. Policy documents are chunked into facts with
`source = policy_doc_v{n}`. Retention period TBD with OQ4 (start: 18 months).

## 8. Audit log

Append-only table `audit_event`, one row per agent action or decision:

```
id, tenant_id, occurred_at, record_phase (pre_execution|post_execution),
agent_role, run_id, conversation_id,
action_type (tool_call|decision|approval|execution|error),
tool_name, arguments_digest, result_digest,
policy_id, policy_version, decision (auto|draft|forbidden), matched_rule_ids,
staging_id,   -- server-issued; apply only succeeds for this id
approver_user_id, approved_at,
reason_text, model_id, prompt_digest,
prev_hash, record_hash   -- SHA-256 over canonical JSON of the row + prev_hash
```

Hash chain per tenant. Verifiable offline. Aligns with the IETF Agent Audit Trail draft
and EU AI Act Art. 12 expectations so the UK launch does not require a redesign.

## 9. Model routing (LiteLLM)

- Self-hosted LiteLLM proxy; one virtual key per tenant with a monthly USD cap; fallbacks
  configured per model group.
- Model groups:
  - `cheap_structured`: classification, extraction, language detection, summaries.
    Candidates: Claude Haiku 4.5, DeepSeek V4 Flash, GLM/Qwen flash tiers.
  - `customer_facing`: anything a customer will read, and refund recommendations.
    Default Claude Sonnet 5 until the Nepali eval clears a cheaper model.
  - `owner_facing`: daily brief, ask-my-business. `cheap_structured` first, escalate on
    low tool-coverage.
- Prompt caching designed for 90–99% hit rate (ADR-017). Request order:
  1. **Global** — persona, safety, tool definitions. Byte-identical across
     sessions. Cache breakpoint at the end.
  2. **Session** — tenant facts, conversation history, loaded skills.
  3. **Volatile last** — current time, inbound channel. Never a timestamp at
     the top of the system prompt.
  Skills arrive as tool results, not system-prompt appends.
- Batch API for nightly document parsing.

## 10. Channels

| Channel | Inbound | Outbound | Notes |
|---|---|---|---|
| Instagram DM | Meta webhook → gateway | Graph API send | Business account, app review |
| TikTok DM | TikTok webhook if API access granted; else owner forwards screenshots to the app (OCR path) | as above | Access risk; ship Instagram first |
| Gmail | Gmail API watch on a label; attachments to `Document` | none in MVP | read-only scope |
| Daraz | Open Platform order pull every N min + email fallback | none in MVP | OAuth seller authorisation |
| Own site | platform connector or order webhook | none | OQ1 |
| WhatsApp (owner) | Cloud API webhook | Cloud API send | approvals, alerts |
| ERPNext | webhooks on doc events → mirror | REST via adapter | service user per tenant |

The gateway normalises everything to `Message{tenant, channel, external_thread_id,
sender, text, attachments[], received_at}`. Agents do not know which channel a message
came from except through metadata.

## 11. Security baseline

- Tenant isolation at DB schema, ERPNext site, and LiteLLM key.
- Secrets in a vault/env, never in prompts or logs. PII minimised in model logs.
- Tool allowlists per role; write tools produce commands only.
- Signed webhooks (Meta, Frappe HMAC), idempotency keys on commands.
- Untrusted-content sanitise + fence; no tool result is ever treated as an instruction.
- Provenance gate: adapters refuse IDs not issued this session.
- Writes serialised per `Conversation`; caps enforced on resulting state.

## 12. Repository layout (proposed)

```
apps/
  api/            # FastAPI: gateway, runtime, policy, approvals, audit, adapters
  web/            # owner UI
  frappe_bittokx/ # Frappe app installed on every tenant site
docs/
evals/            # snapshot evals (primary), Nepali language set, safety fixtures
skills/           # SKILL.md per role, long-tail procedures
infra/            # docker-compose for bench + api + postgres + litellm
```

## 13. Build order (prototype)

1. Infra: ERPNext bench with one tenant site + nepal-compliance; Postgres; LiteLLM.
2. Canonical model + ERPNext adapter (read mirror + `CreateSalesInvoiceDraft`).
3. Audit log + policy engine (all-draft matrix) + approval queue + minimal web UI.
4. Instagram gateway → Customer Service role → J1–J3 with drafts; provenance
   gate and grounding check in the harness.
5. Snapshot eval set (50–100 cases per flow: J1–J5 plus injection) and Nepali
   language eval; pick models. Simulated-user only to discover cases.
6. Gmail → Accounts role → J6/J7 drafts.
7. Return/refund intake (J4) with policy facts.
8. Daily brief (J9), ask-my-business (J10).
9. TikTok, Daraz API, own-site connector as access permits.
