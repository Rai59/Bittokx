# Bittokx — Architecture (MVP 1)

Status: draft v0.4, 2026-09-05. Reasoning: `04-decisions.md`. Evidence:
`05-research-synthesis.md`. **If this file and the research file disagree, the
prototype cut in this file wins.** Research does not add work.

## Prototype cut (this is the build list)

Ship this and stop. Everything else in this file is labelled **later**.

| Piece | Prototype |
|---|---|
| Users | Owner only |
| Channels | **Gmail first** (orders, invoices, receipts); owner uploads a bank statement CSV to test matching; Instagram DMs for simple enquiry; web app to approve |
| Jobs | J6 → J7 → J11 → J1–J3. J4 after those work. |
| Runtime | One FastAPI loop. Two role prompts. Typed tools. `approvals` table. |
| Model | One Anthropic API key. Claude for customer text. Cheap model only if the bill hurts. |
| Memory | Uploaded return/refund policy + a few hand-entered facts. Conversation log in Postgres. |
| Audit | Append-only `audit_event` rows. A draft and an apply are **two rows**. No hash chain. |
| Apply | Owner hits apply. Code writes ERPNext. **No model on that path.** |
| ERPNext | One site per tenant. Thin mirror listed in §3. |
| Eval | 20 snapshot cases on the shipped flow + 2 injection cases |
| Not in the prototype | LiteLLM, Yapily, TrueLayer, schema-per-tenant Postgres, async memory extractor, skills framework, WhatsApp, staff login, Vue-vs-React decision, PWA, hash-chain verifier, graduation engine, Daraz Open Platform, TikTok DMs |

We are a **merchant-side ops agent + customer-care in DMs**, not a storefront
shopping agent. Customers check out on Daraz or the owner's site. See
`05-research-synthesis.md` §1 and ADR-013.

## 1. Overview

```
 Operations inbox                 Customers              Owner
 Gmail (orders, invoices)         Instagram DM           Mobile web app
 Bank statement CSV (upload)      (enquiry only)         approve / reject
        │                                │                      │
        └──────────────┬─────────────────┴──────────────────────┘
                       ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Channel Gateway  (mail / upload / DM → Message)         │
 └───────────────┬─────────────────────────────────────────┘
                 ▼
 ┌─────────────────────────────────────────────────────────┐
 │  Agent Runtime (Python / FastAPI)                       │
 │   ├─ Roles: accounts (main), customer_service (enquiry) │
 │   ├─ Tools: typed, per-role allowlist                    │
 │   ├─ Provenance: writes/renders only session-issued IDs  │
 │   ├─ Policy Engine (deterministic)  ── auto/draft/forbid │
 │   ├─ Approval Queue (durable pause / resume)             │
 │   └─ Audit Log (one row per decision, one per apply)     │
 └───────┬───────────────┬──────────────────────────────────┘
         │               │
         ▼               ▼
   Anthropic API    Canonical Model     Adapters
                    (Postgres)          ├─ ERPNext (site per tenant)
                                        ├─ Gmail (read)
                                        ├─ Statement upload (CSV)
                                        └─ (later) Yapily / TrueLayer / Daraz / TikTok / Xero
```

Two deployable services plus ERPNext:

1. **ERPNext bench** — one Frappe site per tenant, `erpnext` + `nepal-compliance` +
   a small `bittokx` Frappe app (custom fields, webhooks, a service user per tenant).
2. **Bittokx API** — Python/FastAPI: channel gateway, agent runtime, policy engine,
   approval queue, audit log, canonical model, adapters. Talks to ERPNext over REST only.
3. **Bittokx Web** — owner UI. Mobile-first. **Do not decide Vue vs React in this spec.**

## 2. Tenancy

- Tenant = one business. One ERPNext site, one set of channel credentials.
- **Prototype database:** one Postgres schema, `tenant_id` on every row. Every
  query, tool call, and object-store key is scoped by `tenant_id`. A missed
  `WHERE tenant_id = $1` is a P0.
- **Later:** schema-per-tenant if a second paying shop exists and a missed
  filter has burned us. One-database-per-tenant is never the prototype.

## 3. Canonical model (thin)

Purpose: one vocabulary for tools, memory, policy and audit. It is a **read model
plus a command interface**, not a second ledger.

**Prototype mirror** (nine entities). Everything else stays in ERPNext until a
shipped job needs it.

| Entity | Lives | Notes |
|---|---|---|
| **Tenant** | us | Shop, locale, VAT flag, IRD credential pointer (secret store, never in the prompt). |
| **User** | us | Owner only in the prototype. |
| **Contact** | ERP + thin mirror | Customer. Channel identities hang off this. |
| **Conversation** | us | One thread on one channel. |
| **Message** | us | Inbound / outbound / draft. Raw payload stored; model sees a sanitised view. |
| **Product** | ERP + thin mirror | SKU, title, variants, stock qty (cached). |
| **Order** | ERP + thin mirror | The commercial promise (ERPNext Sales Order). |
| **Invoice** | ERP + thin mirror | Sales invoice or purchase bill. VAT fields on the draft when needed. |
| **Document** | us + object store | PDF / image. A draft invoice without a source document is a policy violation. |
| **ReturnRequest** | us → ERP | Opened from CS; Accounts issues the credit later. |
| **Task** | us | Owner to-do / draft approval. |

**Later (not prototype tables):** `OrderLine`, `Bill`, `Expense`, `Refund` as
first-class mirror rows. J11 drafts a Payment Entry in ERPNext from a statement
line; we do not need a Payment mirror table until matching is painful.

Rules:

- **Reads**: adapters mirror vendor data into the canonical tables. Agents read
  only from here. Every mirrored row carries `source_system`, `source_id`, `synced_at`.
- **Writes**: agents never write to a vendor. They emit **commands**. The policy
  engine classifies the command; the adapter executes it; the mirror updates from
  the vendor. No dual-write.
- **Conflict**: the system of record always wins.

**We do not add:** Agent, Skill-as-a-row, Workflow, Playbook-as-a-table, or
“Memory Palace.” Playbooks are markdown the owner uploaded. The agent is the
runtime, not a row.

## 4. Agent runtime

One model in a standard loop: assemble context → model call → tool calls →
repeat → final. No intent router. No subagent-per-domain.

Google (Jan 2026, *Towards a Science of Scaling Agent Systems*): sequential and
tool-heavy tasks get **worse** with extra agents (−39% to −70%). CS and Accounts
are that shape. See ADR-004.

Synchronous per conversation: one run at a time per `Conversation`. Write tools
are serialised on that lock (ADR-018).

### 4.1 Roles are configuration, not code paths

**Prototype:** one system prompt per role (`prompts/customer_service.md`,
`prompts/accounts.md`) plus the owner's uploaded return/refund policy. No
`SKILL.md` files until a second file exists in the repo and a job is worse
without it.

```yaml
role: customer_service
persona: prompts/customer_service.md        # safety, language, grounding, escalation
tools:
  - lookup_order
  - lookup_product
  - lookup_policy
  - get_checkout_link
  - draft_reply            # produces a command: SendMessage
  - request_evidence       # produces a command: SendMessage (template)
  - open_return_request    # produces a command
  - escalate_to_owner      # always allowed
model_policy: customer_facing
```

Accounts is the same shape with invoice / email tools. CS prompt holds:
grounding, language, safety, escalation, "never invent an order or a price".
Accounts prompt holds: "amounts copied not computed", never money-out.

**Later:** versioned `SKILL.md` files for long-tail procedures (ADR-015).
Owner-uploaded playbooks stay **data**, never executable scripts.

Subagents are allowed later only as a **read-only tool** for self-contained
work or as a **handoff**. They are not used inside a customer or accounts turn.

### 4.2 Tools

Typed (pydantic in, pydantic out). A tool either reads the canonical model or
returns a *command*. Tools never call vendors directly.

Tool results are context: return fields the model reasons with, drop the rest.
Error payloads include the next step ("include an order id"), not a bare code.

### 4.3 Provenance, grounding, untrusted content

- **Provenance gate (ADR-014):** the harness keeps a per-session set of IDs
  the server has handed the model. Writes and customer-facing figures
  (price, stock, order status, checkout URL) accept only those IDs.
  Hallucinated, user-pasted, or planted-in-an-email IDs are refused before
  any adapter sees them.
- **Forced grounding:** before a reply asserts terms / order / price /
  availability, this session must contain a matching tool result. No result
  → escalate (`CS-ESCALATE`), never guess. Enforced in the harness, not the
  prompt.
- **Untrusted content** (customer messages, email bodies, PDF text) is
  sanitised and wrapped in a fence before entering the prompt. Fenced text is
  material to report on, never instructions.
- **Caps on resulting state:** frequency caps are checked against the state
  after the write. Policy is **re-checked at apply time**.

### 4.4 No self-granted autonomy

The model can request any tool in its allowlist. Whether the resulting
command executes, drafts, or is refused is decided by the policy engine.
Checkout is a handoff URL (`get_checkout_link`); there is no "place order"
or "charge" tool.

The model never sees raw channel JSON, never sees another tenant, never sees
IRD or Meta tokens. Identity and secrets stay in the runtime (ADR-019).

## 5. Policy engine

Deterministic. Input: a `Command` plus context. Output: `auto | draft | forbidden`
plus the matched rule id and policy version. Details in `02-approval-policy.md`.

- Evaluated before any side effect; the decision is written to the audit log
  *pre-execution*.
- Rules are data (YAML per tenant, versioned).
- Model-reported confidence is never the rule.
- **What “consequential” means (so auto vs draft is not a leak):**
  - **Draft:** the customer would hear a commitment (price, status, refund
    yes/no, checkout link) **or** the ledger would change (invoice, bill,
    payment match).
  - **Auto:** read, escalate, send an owner-approved holding template, or
    **open an internal record** that promises nothing (`CS-RETURN-OPEN`).
    Same as opening a ticket in Gorgias — the ticket is not a refund.
  - **Forbidden:** money leaves the business.
  There is no graduation UI. Moving a class to `auto` later is a config
  change after a shadow week.

## 6. Approval queue (durable pause / resume)

A `draft` decision is a **pause**, not a fire-and-forget ticket. Shape matches
OpenAI `needs_approval` and LangGraph `interrupt()` (ADR-018). **We do not
take LangGraph as a dependency.** The prototype is this loop plus an
`approvals` table. If pause/resume becomes painful, *then* consider LangGraph.

1. Policy engine returns `draft`.
2. Runtime persists run state and a **server-generated staging id**. **No
   vendor side effect** before this point — a resumed node may re-run.
3. An `Approval` is created: command, summary, evidence, policy rule, staging id.
4. Owner: approve, edit-then-approve, or reject-with-reason **in the web app**.
5. On approve: policy is **re-evaluated against current limits**. If still
   allowed, the **adapter executes with no model in the path** (Mercury
   Command). If not, the item returns to the queue.

Timeouts: customer-facing drafts unanswered for 30 min send a holding reply
(pre-approved template). Accounting drafts have no timeout; they roll into
the daily brief.

**Later:** WhatsApp approve-by-reply. Web app is enough for the prototype.

## 7. Memory

**Prototype:**

1. Owner types a few facts (return window, COD policy).
2. Owner uploads a playbook (PDF / markdown). We extract, show a diff, owner
   accepts.
3. Conversation log in Postgres. ERPNext is not memory — stock and invoices
   are state; we read them.

**Later:** async typed extractor after a thread closes (LangMem / Anthropic
shape). The live turn does not write memory. Bi-temporal `valid_from` /
`valid_to`. Owner-only hidden notes. Not in v1.

**What we refuse to store:** channel tokens, IRD secrets, another tenant’s
facts, card digits from a payment screenshot.

## 8. Audit log

Append-only table `audit_event`. **Every decision and every execution has a
row** (a draft then an approve is two rows, not one).

```
id, tenant_id, occurred_at, record_phase (pre_execution|post_execution),
agent_role, run_id, conversation_id,
action_type (tool_call|decision|approval|execution|error),
tool_name, arguments_digest, result_digest,
policy_id, policy_version, decision (auto|draft|forbidden), matched_rule_ids,
staging_id,
approver_user_id, approved_at,
reason_text, model_id, prompt_digest
```

**Correct count (use this, not “one row per action”):**

| What happened | Rows |
|---|---|
| Agent drafts a sales invoice | 1 row: `decision` = draft |
| Owner taps apply | 1 more row: `execution` (and an `approval`) |
| Agent refuses money-out | 1 row: `decision` = forbidden |

A draft that is later applied is **two events**, so **at least two rows**.
Saying “exactly one row per action” was wrong.

**Who can read:** owner. **Who can edit:** nobody. The model never writes this
table. The runtime does, after the tool succeeds or the owner applies.

**Later:** `prev_hash` / `record_hash` chain and an offline verifier, when a
second tenant or UK compliance appears. Do not cite EU AI Act or IETF drafts
as a Nepal-prototype requirement.

## 9. Models

**Prototype: no LiteLLM.** One Anthropic API key. `tenant_id` in our own log
line. Claude for customer-facing text. A cheaper model only if the bill hurts.

**Later:** LiteLLM or equivalent, three groups (`cheap_structured`,
`customer_facing`, `owner_facing`), cache-prefix routing (ADR-017).

**Do not log prompts as training data.** Owner-exportable, tenant-scoped.
**We do not run our own models. We do not fine-tune.** When the bill forces
it, revisit ADR-005.

## 10. Channels

| Channel | Prototype | Notes |
|---|---|---|
| Gmail | **First** | Gmail API watch on a label; attachments to `Document`. Read-only. Operations inbox. |
| Bank statement CSV | Yes | Owner upload in the web app. Exact match → Payment Entry draft. Unmatched listed. |
| Instagram DM | After Gmail | Enquiry only. Meta webhook in; Graph API send. |
| Owner web app | Yes | Approvals. Daily brief later. |
| TikTok DM | Later | Same job as Instagram. |
| Daraz Open Platform | Later | Email parsing is enough for the first Gmail slice. |
| Own site | Later | OQ1. |
| Yapily / TrueLayer | Later | After the company is registered. UK/EU Open Banking. Pick one then. |
| WhatsApp (owner) | Later | Web app is enough. |
| ERPNext | Yes | Webhooks on doc events → mirror; REST via adapter. |

The gateway normalises everything to `Message{tenant, channel, external_thread_id,
sender, text, attachments[], received_at}`.

## 11. Security baseline

- Tenant isolation at `tenant_id`, ERPNext site, and API credentials.
- **Identity:** session start binds tenant + principal to an unguessable
  session id. Later requests carry only that id. **No tool argument names a
  user** (commerce-agents `docs/safety.md`).
- Secrets in a vault/env, **never in prompts, tool args, or logs**. Checkout
  URLs are attached after the model call.
- PII minimised in model logs. Session id is a credential; log a digest.
- Tool allowlists per role; write tools produce commands only.
- Signed webhooks, idempotency keys on commands.
- Untrusted-content sanitise + fence.
- Provenance gate: adapters refuse IDs not issued this session.
- Writes serialised per `Conversation`.
- Apply path has **no model**.

## 12. Repository layout (proposed)

```
apps/
  api/            # FastAPI: gateway, runtime, policy, approvals, audit, adapters
  web/            # owner UI
  frappe_bittokx/ # Frappe app installed on every tenant site
docs/
evals/            # snapshot evals, safety fixtures
infra/            # docker-compose for bench + api + postgres
```

No `skills/` directory until a `SKILL.md` exists. No LiteLLM container in the
prototype compose file.

## 13. Build order (prototype)

1. ERPNext bench with one tenant site + nepal-compliance. Postgres. One API key.
2. Canonical model + ERPNext adapter (read mirror + draft-write commands).
3. Policy engine (all-draft) + approval queue + append-only audit + minimal web UI
   (approve / edit / reject).
4. **Gmail → Accounts → J6/J7 drafts.** This is the product spine.
5. **Statement upload → J11** exact payment-match drafts. Not Yapily. Not TrueLayer.
6. **20 snapshot cases** on J6/J7 + a few J11 cases + 2 injection cases.
7. Instagram → Customer Service → J1–J3 enquiry drafts; provenance + grounding.
8. 20 snapshot cases on J1–J3.
9. Return/refund intake (J4). Daily brief (J9). Ask-my-business (J10).
10. TikTok, Daraz API, own-site connector, Yapily/TrueLayer as the company exists.

Do not start with LiteLLM, hash chains, extractors, a skills framework, or an
Open Banking application.

## 14. What this file refuses to contain

- A third role that does not have a job in the PRD.
- A vector database as a substitute for ERPNext search on SKUs and invoices.
- A “multi-agent society,” A2A mesh, LangGraph/CrewAI/AutoGen as a week-1
  dependency, or an MCP server we do not yet consume.
- Training, RL, or “self-evolving” loops on production conversations.
- Browser-use / computer-use as a default tool.
- Forking Anthropic commerce-agents, Hermes, or OpenClaw as the product.
- A live bank feed (Yapily / TrueLayer) before the company is registered.
  Manual CSV upload is the prototype path, same as Xero / QuickBooks.
