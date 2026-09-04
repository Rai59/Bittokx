# Bittokx — Architecture (MVP 1)

Status: draft v0.1, 2026-09-04. See `04-decisions.md` for the reasoning behind each choice.

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
 │   ├─ Tools: typed, per-role allowlist                    │
 │   ├─ Memory: operational | business knowledge | episodic │
 │   ├─ Policy Engine (deterministic)  ── decides auto/     │
 │   │                                    draft/forbidden   │
 │   ├─ Approval Queue                                       │
 │   └─ Audit Log (append-only, hash-chained)                │
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

- One loop: assemble context → model call via LiteLLM → tool calls → repeat → final.
  Synchronous per conversation; conversations are serialised per thread (one run at a
  time per `Conversation`), following the gateway pattern used by Hermes/OpenClaw.
- **Roles are configuration**, not code paths:

```yaml
role: customer_service
persona: prompts/customer_service.md        # tone, language rules, escalation rules
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

- **Tools are typed** (pydantic in, pydantic out). A tool either reads the canonical
  model or returns a *command*. Tools never call vendors directly.
- **Untrusted content** (customer messages, email bodies, PDF text) is wrapped with
  explicit boundary markers before entering the prompt; instructions found inside it are
  not followed. Tool results are data, not instructions.
- **No self-granted autonomy**: the model can request any tool in its allowlist; whether
  the resulting command executes, drafts, or is refused is decided by the policy engine.

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

## 6. Approval queue

- Every `draft` decision creates an `Approval` with: the command, a human-readable
  summary, the agent's stated reason, the evidence (tool results), and the policy rule.
- Surfaces: web app list (primary) and WhatsApp message with reply-to-approve for items
  the owner marks urgent. Approve, edit-then-approve, reject-with-reason.
- Timeouts: customer-facing drafts unanswered for 30 min send a holding reply
  ("we're checking, will get back within N hours") — itself a pre-approved template.
  Accounting drafts have no timeout; they roll into the daily brief.

## 7. Memory

| Layer | What | Store | Retrieval |
|---|---|---|---|
| Operational | orders, invoices, customers, tickets | canonical model (Postgres) | SQL via tools |
| Business knowledge | policies, SOPs, supplier terms, owner preferences, learned rules | `facts` table: `(tenant, subject, predicate, object, valid_from, valid_to, source, confidence)` — bi-temporal, superseded facts are closed not deleted | keyword + embedding over active facts, scoped by role |
| Episodic | per-conversation and per-task state | `Conversation`, `Task` tables | by thread id |

Nothing customer-facing is "remembered" from free text without becoming a fact row with
a source. Policy documents are chunked into facts with `source = policy_doc_v{n}`.

## 8. Audit log

Append-only table `audit_event`, one row per agent action or decision:

```
id, tenant_id, occurred_at, record_phase (pre_execution|post_execution),
agent_role, run_id, conversation_id,
action_type (tool_call|decision|approval|execution|error),
tool_name, arguments_digest, result_digest,
policy_id, policy_version, decision (auto|draft|forbidden), matched_rule_ids,
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
- Prompt caching on the persona + policy prefix; Batch API for nightly document parsing.

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
- Untrusted-content boundaries; no tool result is ever treated as an instruction.

## 12. Repository layout (proposed)

```
apps/
  api/            # FastAPI: gateway, runtime, policy, approvals, audit, adapters
  web/            # owner UI
  frappe_bittokx/ # Frappe app installed on every tenant site
docs/
evals/            # Nepali eval set, τ-bench-style harness, policy adherence tests
infra/            # docker-compose for bench + api + postgres + litellm
```

## 13. Build order (prototype)

1. Infra: ERPNext bench with one tenant site + nepal-compliance; Postgres; LiteLLM.
2. Canonical model + ERPNext adapter (read mirror + `CreateSalesInvoiceDraft`).
3. Audit log + policy engine (all-draft matrix) + approval queue + minimal web UI.
4. Instagram gateway → Customer Service role → J1–J3 with drafts.
5. Nepali eval set and harness; pick models.
6. Gmail → Accounts role → J6/J7 drafts.
7. Return/refund intake (J4) with policy facts.
8. Daily brief (J9), ask-my-business (J10).
9. TikTok, Daraz API, own-site connector as access permits.
