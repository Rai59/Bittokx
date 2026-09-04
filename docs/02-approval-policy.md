# Bittokx — Approval Policy (action classes and MVP defaults)

Status: draft v0.1, 2026-09-04.

## 1. Principles

1. The model never decides whether an action needs approval. The policy engine does.
2. Three outcomes only: `auto` (execute and log), `draft` (queue for a human),
   `forbidden` (refuse and log). There is no fourth "ask the model again".
3. Money movement is `forbidden` for agents in MVP 1: refunds, payouts, transfers,
   supplier payments. The agent prepares; the human pays; the agent records afterwards.
4. Prototype default: everything consequential is `draft`. Autonomy is earned per class
   through graduation (section 4), never assumed.
5. Same rules for every actor. If the owner later adds a second human user, the same
   matrix applies to them. This mirrors how Rillet, Sage and Ramp treat human-, system-
   and AI-originated entries identically.
6. Decisions are logged before execution with the rule id and policy version.

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
| CS-REMINDER | Payment reminder for unpaid own-site order | D | A after 50 clean | Frequency cap: 1 per 48h per order |
| CS-RETURN-OPEN | Open ReturnRequest with collected evidence | A | A | Creates a record, no promise |
| CS-RETURN-DECISION | Tell customer refund approved / declined | D | D | Owner decides; agent drafts wording. Nepal E-Commerce Act: grievance resolution ≤ 15 days — engine tracks the clock |
| CS-DISCOUNT | Offer discount, voucher, store credit | F | D above NPR 0, A ≤ owner-set cap | Off in prototype |
| CS-ESCALATE | Hand thread to owner with summary | A | A | Always allowed; triggers on anger, legal words, "human", loop detection |
| CS-FREEFORM | Any reply not covered above | D | D | Stays draft |

### Accounts

| Class | Example command | Prototype | MVP 1 target | Notes |
|---|---|---|---|---|
| AC-READ | Query ledger, reports, aging | A | A | Read-only |
| AC-SI-FROM-ORDER | Sales Invoice draft from confirmed Daraz / site order | D | A | Derived from accepted document; amounts copied not computed by model |
| AC-SI-ADJUSTED | Sales Invoice with manual discount / price override | D | D | |
| AC-PI-FROM-DOC | Purchase Invoice / Expense draft from Gmail attachment | D | D → A per supplier after 20 clean | Attachment linked; supplier must exist or be drafted |
| AC-PAYMENT-MATCH-EXACT | Payment Entry when amount + reference match exactly | D | A | Deterministic match rule, not model judgement |
| AC-PAYMENT-MATCH-FUZZY | Payment Entry with partial / ambiguous match | D | D | |
| AC-CATEGORISE-RULE | Categorise statement line matching an owner rule or exact prior pattern | D | A | QuickBooks "green" equivalent |
| AC-CATEGORISE-WEAK | Categorise with weak or no history | D | D | |
| AC-CREDIT-NOTE | Credit note for approved return | D | D | Money-adjacent |
| AC-JE-MANUAL | Any manual journal entry | F | D | Never auto |
| AC-REFUND-RECORD | Record a refund the owner has already paid | D | D | Requires owner's approval of the return first |
| AC-MONEY-OUT | Pay supplier, transfer, payout, issue refund | F | F | Agents never move money in MVP 1 |
| AC-TAX | Anything touching VAT accounts, CBMS submission | F | D | |
| AC-COA | Change chart of accounts, fiscal year, settings | F | F | Human in ERPNext UI |
| AC-CLOSE | Period close | F | D | |
| AC-BRIEF | Daily brief to owner | A | A | Read-only output |

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

## 4. Graduation (earning autonomy)

For each `(tenant, class)`:

- `clean_streak` = consecutive approvals with zero edits and no later reversal.
- Any edit, rejection, or reversal within 7 days resets the streak to 0.
- When `clean_streak >= threshold` (default 50; 20 for per-supplier AC-PI-FROM-DOC), the
  system creates a proposal: "Move CS-REPLY-STATUS to auto? 50/50 approved unchanged."
- Only the owner accepts. Acceptance creates a new `policy_version`.
- Any class can be demoted by the owner in one tap; demotion is immediate.
- Money-out classes cannot graduate.

## 5. Escalation triggers (always auto)

- Customer asks for a human, or expresses anger / threat / legal intent (classifier +
  keyword list in Nepali and English).
- Agent has no tool result to ground an answer about an order or a price.
- Conversation loops (same intent 3 times without resolution).
- Policy gap: the uploaded policy does not cover the case. The escalation message asks
  the owner to add a rule, following Ramp's "policy becomes a living document" pattern.

## 6. Owner controls (UI)

- Per-class slider: auto / draft / off.
- Amount caps where relevant (discount cap, reminder frequency).
- Policy document upload and edit; each save is a new `policy_version`.
- Demote-to-draft one tap; view "why did the agent do this" from any message.
