# Bittokx — Approval Policy (action classes and MVP defaults)

Status: draft v0.4, 2026-09-05. Evidence: `05-research-synthesis.md`.
Prototype cut: `01-architecture.md`. Classes marked **later** are not build.

## 1. Principles

1. The model never decides whether an action needs approval. The policy engine does.
2. Three outcomes only: `auto` (execute and log), `draft` (queue for a human),
   `forbidden` (refuse and log). There is no fourth "ask the model again".
3. Money movement is `forbidden` for agents in MVP 1: refunds, payouts, transfers,
   supplier payments. The agent prepares; the human pays; the agent records afterwards.
4. **Consequential = draft.** A thing is consequential if the customer would
   hear a commitment **or** the ledger would change. Those are `draft`.
   **Not consequential (auto):** reads, escalation, an owner-approved holding
   template, and opening an internal `ReturnRequest` (`CS-RETURN-OPEN`) — that
   is opening a ticket, not promising a refund. **Forbidden:** money leaves
   the business. Graduation (section 4) is later; no slider UI in the
   prototype.
5. Same rules for every actor. If the owner later adds a second human user, the same
   matrix applies to them. This mirrors how Rillet, Sage and Ramp treat human-, system-
   and AI-originated entries identically.
6. Decisions are logged before execution with the rule id and policy version.
7. A `draft` is a durable pause: no vendor write until the owner acts, then
   policy is evaluated again against **current** limits and the **resulting**
   state (ADR-018). Caps cannot be stacked by parallel or retried tool calls.
8. After approval, the adapter runs **with no model in the loop** (Mercury
   Command). The model cannot retry a write it was not allowed to finish.

## 2. Action classes and MVP matrix

Legend: A = auto, D = draft (human approves), F = forbidden for agents.
"Prototype" = first 4 weeks with design partner. "MVP 1" = after graduation data exists.

### Customer Service

| Class | Example command | Prototype | MVP 1 target | Notes |
|---|---|---|---|---|
| CS-READ | lookup order, product, policy | A | A | Read-only |
| CS-REPLY-FACT | Reply with product/price/availability from catalogue | D | A | Must cite a tool result |
| CS-REPLY-STATUS | Reply with order/delivery status | D | A | Must cite a tool result |
| CS-LINK | Send Daraz / own-site checkout link | D | A | Link must come from `get_checkout_link` |
| CS-HOLD | Send pre-approved holding template ("checking, back in N hours") | A | A | Template text owner-approved once |
| CS-EVIDENCE | Ask customer for photo / order id / reason for a return | A | A | Template-based; no commitment made |
| CS-REMINDER | Payment reminder for unpaid own-site order | D | A after data | **Later than J1–J3.** Frequency cap: 1 per 48h per order |
| CS-RETURN-OPEN | Open ReturnRequest with collected evidence | A | A | Internal ticket only. No customer message. No money. Auto is correct. |
| CS-RETURN-DECISION | Tell customer refund approved / declined | D | D | Owner decides; agent drafts wording. Prototype: a due-date field + a line in the daily brief, not a 15-day “engine”. |
| CS-DISCOUNT | Offer discount, voucher, store credit | F | D above NPR 0 | **Later.** Off in prototype. |
| CS-ESCALATE | Hand thread to owner with summary | A | A | Always allowed; triggers on anger, legal words, "human", loop detection |
| CS-FREEFORM | Any reply not covered above | D | D | Stays draft |

### Accounts

| Class | Example command | Prototype | MVP 1 target | Notes |
|---|---|---|---|---|
| AC-READ | Query ledger, reports, aging | A | A | Read-only |
| AC-SI-FROM-ORDER | Sales Invoice draft from confirmed Daraz / site order | D | A | Derived from accepted document; amounts copied not computed by model |
| AC-SI-ADJUSTED | Sales Invoice with manual discount / price override | D | D | |
| AC-PI-FROM-DOC | Purchase Invoice / Expense draft from Gmail attachment | D | D → A per supplier after 20 clean | Attachment linked; supplier must exist or be drafted |
| AC-PAYMENT-MATCH-EXACT | Payment Entry when uploaded statement line matches amount + reference exactly | D | A | **Prototype (J11).** Source is an uploaded CSV, not Yapily / TrueLayer. |
| AC-PAYMENT-MATCH-FUZZY | Payment Entry with partial / ambiguous match | D | D | Stays draft. Never auto-guess. |
| AC-CATEGORISE-RULE | Categorise statement line matching an owner rule | D | A | **Later.** Not needed to test matching. |
| AC-CATEGORISE-WEAK | Categorise with weak or no history | D | D | **Later.** |
| AC-CREDIT-NOTE | Credit note for approved return | D | D | Money-adjacent. After J4. |
| AC-JE-MANUAL | Any manual journal entry | F | D | Never auto |
| AC-REFUND-RECORD | Record a refund the owner has already paid | D | D | Requires owner's approval of the return first |
| AC-MONEY-OUT | Pay supplier, transfer, payout, issue refund | F | F | Agents never move money in MVP 1 |
| AC-TAX | Anything touching VAT accounts, CBMS submission | F | D | **Later.** |
| AC-COA | Change chart of accounts, fiscal year, settings | F | F | **Later.** Human in ERPNext UI |
| AC-CLOSE | Period close | F | D | **Later.** |
| AC-BRIEF | Daily brief to owner | A | A | Read-only output. After J1–J3 and J6. |

## 3. Rule format

```yaml
policy_version: 2026-09-04.1
tenant: design-partner
rules:
  - id: cs-reply-fact-draft
    when: { command: SendMessage, class: CS-REPLY-FACT }
    require: { cites_tool_result: true }
    outcome: draft
  - id: cs-hold-auto
    when: { command: SendMessage, template: holding_reply_v1 }
    outcome: auto
  - id: ac-money-out-forbidden
    when: { class: [AC-MONEY-OUT] }
    outcome: forbidden
  - id: reminder-frequency-cap
    when: { class: CS-REMINDER }
    require: { last_reminder_hours_ago: ">= 48" }
    outcome: draft
    else: forbidden
default_outcome: draft
```

Rules are evaluated in order; first match wins; unmatched commands fall to
`default_outcome`. Every evaluation is logged with `matched_rule_ids` and
`policy_version`.

Apply-time extras:

- CS-REPLY-FACT / CS-REPLY-STATUS / CS-LINK drafts that do not cite a
  **session-issued** tool-result id are `forbidden` by the engine, not queued.
- `apply` of any staged command re-runs the matching rules. If the class has
  been demoted or a cap would be exceeded after the write, the approval returns
  to the queue with the new reason; it does not execute.
- Write commands for one `Conversation` are serialised.

## 4. Graduation (later — not a prototype engine)

**Prototype: all consequential classes stay `draft`.** There is no streak counter,
no proposal, no slider. After a shadow week the owner may flip one class in
config.

**Later**, when there is data:

- `clean_streak` = consecutive approvals with zero edits and no later reversal.
- When `clean_streak >= threshold` (default 50; 20 for per-supplier AC-PI-FROM-DOC),
  the system *proposes* moving the class to `auto`. Only the owner accepts.
- Any class can be demoted in one tap. Money-out classes cannot graduate.

## 5. Escalation triggers (always auto)

- Customer asks for a human, or expresses anger / threat / legal intent (classifier +
  keyword list in Nepali and English).
- Agent has no tool result to ground an answer about an order or a price.
- Conversation loops (same intent 3 times without resolution).
- Policy gap: the uploaded policy does not cover the case. The escalation message asks
  the owner to add a rule, following Ramp's "policy becomes a living document" pattern.

## 6. Owner controls (UI)

**Prototype:** approve / edit / reject on the web list. Upload the return/refund
policy. View "why did the agent do this" from a draft.

**Later:** per-class slider; amount caps; owner-only hidden notes (Ramp);
one-tap demote.
