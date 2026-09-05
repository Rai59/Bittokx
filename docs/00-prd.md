# Bittokx — Product Requirements (MVP 1 / Prototype)

Status: draft v0.3, 2026-09-05. Owner: founder. Scope: Nepal e-commerce, single design partner.
Evidence: `05-research-synthesis.md`. Cut list: `06-review.md`. Research does not override this file.

## 1. Problem

Small Nepali e-commerce businesses (1–10 staff, no ERP, no CRM) run operations by hand:
Instagram and TikTok DMs, Daraz notifications and supplier invoices in Gmail, orders on
Daraz or their own site, payments by COD / eSewa / Khalti / bank transfer, books in Excel
or nowhere. The owner spends most of the day answering messages and chasing paperwork
instead of on the product.

Existing Nepali software (Accknown, Lekhapal, Nepular, Thulo) is bookkeeping software:
it records what a human already did. Nothing does the work.

Closest global CS analog is Gorgias (Shopify helpdesk with order/refund tools and
Temporal pause/resume). Intercom Fin, Sierra, Decagon, Zendesk are helpdesk /
CX agents on English SaaS stacks. None of them host a Nepal-compliant ledger
or sit in Instagram/TikTok DMs next to Daraz. WorkOS is auth / fine-grained
authorization for agents, not a CRM — relevant later, not a competitor.

## 2. Product statement

**One line:** Bittokx is a hosted business OS for Nepali e-commerce SMBs — our UI on
ERPNext, one agent with Customer Service and Accounts roles, drafts for the owner to apply.

> A hosted business operating system for Nepali e-commerce SMBs. We host an ERPNext site
> per customer (with the Nepal compliance app) as ledger and inventory and put our own
> mobile-first UI on top; the customer never sees ERPNext. A single agent runtime with
> named roles (Customer Service, Accounts) works through typed tools against a thin
> canonical model; ERPNext is the first adapter, Xero/QuickBooks later for the UK.
> Customer Service handles inbound Instagram and TikTok conversations, answers from order
> and policy data, routes buyers to the Daraz or own-site checkout link, sends payment
> reminders, and collects evidence for returns and refunds against the owner's uploaded
> policy. Accounts drafts entries from Gmail (Daraz order mails, supplier invoices,
> receipts) and from confirmed orders for one-tap approval. A deterministic policy engine,
> not the model, decides what runs automatically; in the prototype every consequential
> action is a draft the owner approves, and all money movement is human-only. Every agent
> action is written to an append-only audit log. Pricing is base plus
> per-handled-conversation, in NPR.

Confirmed by founder 2026-09-04 as correct for MVP 1 and prototype.

## 3. Design partner

- Clothing brand run by a designer-owner. 5–6 staff.
- 50–100 inbound customer messages/day, Nepali (Devanagari) and English mixed.
- Channels in: Instagram DM, TikTok DM. Orders placed on Daraz and own website.
  Daraz notifications, most invoices and receipts arrive in Gmail.
- Owner's goal (verbatim intent): handle the business so she can focus on designing
  clothes and on decisions, not on operating the business.
- Success for her: she opens the app once or twice a day, approves a short list, and
  nothing important was missed.

## 4. Users and roles

| Role | Who | Primary surface |
|---|---|---|
| Owner / Manager | the designer | Mobile web app (approvals, daily brief, ask-my-business) |
| Agent: Customer Service | software | Instagram DM (TikTok later) |
| Agent: Accounts | software | Gmail (read), ERPNext (write via adapter) |
| Customer | buyer | Instagram / TikTok, unchanged |

**Staff** (packer / part-time helper) is not a prototype user. No staff jobs exist yet.
Add a login when a partner has a second person who needs one. WhatsApp approve-by-reply
is later; the web app is enough.

The agent is a junior employee operating the software. The software (ERPNext) does all
calculation. The human is the manager.

## 5. Goals (MVP 1)

1. Customer Service agent drafts or sends replies for ≥ 80% of inbound DMs without the
   owner typing, in the customer's language (Nepali or English).
2. Every order-related question (status, delivery, price, availability, size) is answered
   from live data, never guessed.
3. Buyers who want to order are sent the correct Daraz / own-site product link.
4. Return and refund requests are handled to the point of a decision-ready draft:
   evidence collected, policy check done, recommendation written. Owner approves;
   owner moves money.
5. Accounts agent turns Daraz order emails, supplier invoices and receipts in Gmail into
   ERPNext drafts (Sales Invoice, Purchase Invoice, Expense) with attachments, for
   one-tap approval.
6. Owner receives one daily brief: cash in/out, orders, unanswered threads, pending
   approvals, anomalies.
7. Every agent action is auditable: what, why, which policy version, who approved.

## 6. Non-goals (MVP 1)

- Agent placing orders on the customer's behalf, moving money, issuing refunds, or
  changing prices. Human-only.
- Bank feeds. Statements are uploaded manually. **Do not add a bank-statement CSV
  job** — that is a bank feed by another name.
- Payroll, payments infrastructure, marketing campaigns, supplier ordering.
- UK / Australia adapters (Xero, QuickBooks, HubSpot). Designed for, not built.
- WhatsApp as a customer channel. Owner-side approve-by-reply is also later;
  prototype approvals are the web app only.
- Fine-tuned models. Roles are configuration; see `01-architecture.md`.
- Publishing the code. Private for MVP 1.
- A storefront shopping agent (search / cart / checkout in our UI). Checkout is
  a Daraz or own-site link. We do not fork Anthropic commerce-agents as the
  product (ADR-013).
- Computer-use / a cloud VM clicking Gmail or Instagram (Grok Bot shape). APIs only.
- LiteLLM, hash-chained audit, async memory extractor, skills framework, or
  schema-per-tenant Postgres in the prototype. Those are later. See `06-review.md`.
- A second agent, reviewer, planner, or swarm. Google (Jan 2026): sequential +
  tool-heavy work gets worse with extra agents. See ADR-004.

## 7. Jobs to be done

Product jobs. **Prototype build order is J1–J3, then J6/J7, then J4.** Do not
treat this table as week-1 sequence. Instagram CS first.

| # | Job | Role | Autonomy in prototype |
|---|---|---|---|
| J1 | Answer product / price / availability questions from catalogue | CS | Draft → approve |
| J2 | Answer order status / delivery questions from Daraz + site orders | CS | Draft → approve |
| J3 | Send checkout link for a requested product | CS | Draft → approve |
| J4 | Return / refund intake: collect photo, order id, reason; check policy; write recommendation | CS | Collect autonomously, decision drafted, human approves, human pays |
| J5 | Escalate: angry customer, legal threat, anything outside policy | CS | Auto (escalation is always allowed) |
| J6 | Parse Daraz order emails → Sales Order / Sales Invoice draft | Accounts | Draft → approve |
| J7 | Parse supplier invoices / receipts → Purchase Invoice / Expense draft with attachment | Accounts | Draft → approve |
| J8 | Payment reminder for unpaid own-site orders | CS | Draft → approve |
| J9 | Daily brief to owner | Accounts | Auto (read-only) |
| J10 | Ask-my-business Q&A (sales this week, top product, cash position) | Accounts | Auto (read-only) |

## 8. Channels and integrations

| System | Direction | Method | Notes |
|---|---|---|---|
| Instagram DM | in/out | Meta Graph API (Instagram Messaging) | Prototype channel. Business account + app review. |
| TikTok DM | later | TikTok Business Messaging API | Risk R2. Ship Instagram first. |
| Gmail | in | Gmail API (OAuth, read-only label) | After J1–J3. Daraz mails, supplier invoices, receipts. |
| Daraz | later | Daraz Open Platform (`api.daraz.com.np`) | Email parsing is enough for the first Gmail slice. |
| Own website | later | Platform connector or webhook | OQ1 accepted default: webhook + CSV. |
| ERPNext | in/out | REST + webhooks, one site per tenant | Nepal compliance app installed |
| WhatsApp (owner) | later | Meta Cloud API | Not in the prototype. Web app for approvals. |
| LLMs | — | One Anthropic API key | LiteLLM later, when cost or a second model appears |

## 9. Language

Nepali (Devanagari) and English, often mixed. Requirements:

- Agent replies in the language of the customer's last message.
- Claude for customer text until we have enough real threads to eval a cheaper model.
- Policy document may be uploaded in Nepali or English.

## 10. Pricing (hypothesis to test with design partner)

- Base NPR 3,000–5,000 / month: hosted ERPNext, UI, invoicing, Accounts agent,
  ~1,000 handled conversations included.
- NPR 3–5 per handled conversation beyond quota.
- Anchors: Nepali accounting SaaS NPR 500–3,000/month; Kathmandu CSR salary
  NPR 13,000–40,000/month; estimated COGS USD 12–30/tenant/month at 50–100 msgs/day.
- Design partner has agreed in principle if the product works as specified.

## 11. Success metrics (prototype, 4 weeks with design partner)

| Metric | Target |
|---|---|
| Inbound DMs with an agent draft within 2 min | ≥ 90% |
| Drafts approved without edit | ≥ 70% by week 4 |
| Owner minutes/day on messages | down ≥ 60% vs. baseline week |
| Policy violations (agent said something the policy forbids) | 0 sent; measured on drafts too |
| Gmail documents turned into correct ERPNext drafts | ≥ 80% field accuracy |
| Owner NPS on "can I focus on design now" | asked weekly |

## 12. Risks

| ID | Risk | Mitigation |
|---|---|---|
| R1 | Nepali quality of cheap models is poor → cost 2–3× | Nepali eval before routing; Claude for customer-facing text until eval passes |
| R2 | TikTok DM API access denied or limited | Ship Instagram first; TikTok via manual forward; check TikTok Shop APIs |
| R3 | Meta app review delays | Apply week 1; use test users meanwhile |
| R4 | Agent invents order facts | Provenance gate: only session-issued IDs; grounding harness check; no tool result → escalate |
| R5 | Prompt injection via customer messages or supplier PDFs | Sanitise + fence; evals split user-authored vs data-plane injection; policy engine ignores model text |
| R6 | ERPNext learning curve (founder solo) | Use stock DocTypes; custom app only for Bittokx metadata |
| R7 | Owner approval fatigue | Daily brief batching; graduation to auto per action class after 50 clean approvals |

## 13. Open questions (accepted prototype defaults)

These are **accepted defaults**, not blockers. Change them with a one-line ADR
amendment, not a new research pass.

| ID | Question | Accepted default |
|---|---|---|
| OQ1 | Which platform is the own website (Shopify, WooCommerce, custom)? | Webhook + CSV import. Own-site connector is later. |
| OQ2 | Is the business VAT-registered / required to use IRD e-billing? | Not in prototype. CBMS sync deferred. Invoice drafts may still carry VAT fields; we do not call IRD. |
| OQ3 | Does the owner use Gmail or Google Workspace? (OAuth scopes differ) | Gmail |
| OQ4 | Is sending customer messages to US-hosted models acceptable for the prototype? | Yes, with PII kept out of logs |
| OQ5 | Who executes refunds today (eSewa, bank) and who should record them? | Owner pays; agent records in ERPNext after approval |

## 14. Eval plan (minimum)

Measurement bar is **snapshot evals** (ADR-016). Grade **final state + rendered
reply**, not the path. Simulated-user is for finding gaps, then each gap becomes
a snapshot.

**Before Instagram CS goes to the partner:** **20 cases** covering J1–J3,
including missing invoice / unknown product, “I already paid,” refund demand,
and **two injection attempts** (user-authored + data-plane). Pair a few
positives with a negative. If we cannot write those, we do not understand the
job.

**Not 50–100 cases per flow, and not hundreds of cases before Instagram works.**
Grow the set from real DMs after the partner is using drafts.

Later, when a cheap model is considered for customer text: Nepali language
correctness on whatever real threads we have (≥ 95%). We do not need Gaia2,
a custom RL env, or Agent Lightning. We do not evaluate bank-statement or
tax-close cases.
