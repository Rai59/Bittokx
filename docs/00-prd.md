# Bittokx — Product Requirements (MVP 1 / Prototype)

Status: draft v0.4, 2026-09-05. Owner: founder. Scope: Nepal e-commerce, single design partner.
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

**One line:** Bittokx is the shop’s operating system. Our app sits on ERPNext.
Work arrives in Gmail. Customers ask simple questions on Instagram. The agent
drafts. The owner applies.

How it is used (same split successful ecommerce companies already use):

1. **Gmail is the operations inbox.** Daraz order mail, supplier invoices,
   receipts. This is where the books start. Accounts turns each item into an
   ERPNext draft. Gorgias / Shopify brands keep the *order* in the store admin
   and email; they do not run the ledger from Instagram. We do the same: Gmail
   → ledger. Instagram is not the source of truth for money.
2. **Instagram and TikTok are customer enquiry only.** “Is this in stock?”,
   “How much?”, “Where is my order?”, “Send me the link.” Short answers from
   live catalogue and order data. Not invoicing. Not bank matching. Gorgias
   treats social DMs as pre-sales and simple WISMO; email and the store hold
   the order. We copy that split.
3. **Bank.** The owner uploads a statement (CSV) so we can test payment
   matching. Live bank connect (Yapily or TrueLayer) waits until the company
   is registered — that process is too long for the prototype. Xero and
   QuickBooks work the same way: upload first, Open Banking feed later. Those
   APIs are UK/EU; they are not a Nepal week-1 path.
4. **One agent, two roles** (Accounts + Customer Service). The customer never
   sees ERPNext. Every *consequential* action is a draft. Money movement is
   human-only. Every decision and every apply is its own audit row. Pricing is
   base plus per-handled-conversation, in NPR. UK/AU later: swap the ledger
   adapter for Xero or QuickBooks.

Confirmed by founder 2026-09-04; channel split and bank-upload path confirmed
2026-09-05.

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

**Staff, in plain language:** the shop has 5–6 people, but the prototype has
**one login — the owner.** Packers and helpers do not get an account until the
app has a job for them (for example “mark this order packed”). Until then a
staff row in the spec is decoration. WhatsApp approve-by-reply is later; the
web app is enough.

The agent is a junior employee operating the software. The software (ERPNext)
does all calculation. The human is the manager.

## 5. Goals (MVP 1)

1. Accounts turns Gmail (Daraz order mail, supplier invoices, receipts) into
   ERPNext drafts the owner can approve in one tap. This is the main job.
2. Owner can upload a bank statement and see exact payment matches as drafts
   (test path). Live Yapily / TrueLayer connect is later.
3. Customer Service drafts replies for simple Instagram enquiries (price,
   stock, order status, checkout link) from live data, never guessed, in the
   customer's language.
4. Return and refund requests (later than Gmail + simple CS) reach a
   decision-ready draft. Owner approves. Owner moves money.
5. Owner receives one daily brief: cash in/out, orders, unanswered threads,
   pending approvals, anomalies.
6. Every decision and every apply is auditable.

## 6. Non-goals (MVP 1)

- Agent placing orders on the customer's behalf, moving money, issuing refunds, or
  changing prices. Human-only.
- Live bank feeds (Yapily, TrueLayer, or any Open Banking API). **Manual
  statement upload is in the prototype** so we can test matching before the
  company is registered. That is not a feed. A feed is later.
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

Job numbers stay stable. **Build order is Gmail first, then bank upload, then
Instagram enquiry.** Social is not the spine of the product.

**Build:** J6 → J7 → J11 → J1–J3 → J9 → J4 → J5/J8/J10.

| # | Job | Role | Autonomy in prototype |
|---|---|---|---|
| J6 | Parse Daraz order emails → Sales Order / Sales Invoice draft | Accounts | Draft → approve |
| J7 | Parse supplier invoices / receipts → Purchase Invoice / Expense draft with attachment | Accounts | Draft → approve |
| J11 | Upload bank statement (CSV) → Payment Entry drafts for **exact** amount + reference matches; rest listed unmatched | Accounts | Draft → approve. Live Yapily / TrueLayer later. |
| J1 | Answer product / price / availability questions from catalogue | CS | Draft → approve |
| J2 | Answer order status / delivery questions from Daraz + site orders | CS | Draft → approve |
| J3 | Send checkout link for a requested product | CS | Draft → approve |
| J4 | Return / refund intake: collect photo, order id, reason; check policy; write recommendation | CS | Collect autonomously, decision drafted, human approves, human pays |
| J5 | Escalate: angry customer, legal threat, anything outside policy | CS | Auto (escalation is always allowed) |
| J8 | Payment reminder for unpaid own-site orders | CS | Draft → approve |
| J9 | Daily brief to owner | Accounts | Auto (read-only) |
| J10 | Ask-my-business Q&A (sales this week, top product, cash position) | Accounts | Auto (read-only) |

## 8. Channels and integrations

| System | Direction | Method | Notes |
|---|---|---|---|
| Gmail | in | Gmail API (OAuth, read-only label) | **Main operations inbox.** Daraz mails, supplier invoices, receipts. Build first. |
| Bank statement upload | in | Owner uploads CSV in the web app | Prototype test path for J11. Not a live feed. |
| Instagram DM | in/out | Meta Graph API | Customer enquiry only. After Gmail works. |
| TikTok DM | later | TikTok Business Messaging API | Same job as Instagram. Risk R2. |
| Daraz | later | Daraz Open Platform (`api.daraz.com.np`) | Email parsing is enough for the first Gmail slice. |
| Own website | later | Platform connector or webhook | OQ1 accepted default: webhook + CSV. |
| ERPNext | in/out | REST + webhooks, one site per tenant | Nepal compliance app installed |
| Yapily or TrueLayer | later | Open Banking AIS | After the company is registered. UK/EU. Pick one then. |
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
| Gmail documents turned into correct ERPNext drafts | ≥ 80% field accuracy |
| Bank statement exact matches drafted (amount + reference) | All exact pairs; unmatched listed, never guessed |
| Simple Instagram enquiries with an agent draft within 2 min | ≥ 90% |
| Drafts approved without edit | ≥ 70% by week 4 |
| Owner minutes/day on inbox + messages | down ≥ 60% vs. baseline week |
| Policy violations (agent said something the policy forbids) | 0 sent; measured on drafts too |
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

**In plain language:** these five questions used to look like we were still
waiting. We are not. We picked a default so we can build. If a default is
wrong, change it with one line — do not stop the prototype to research it.

| ID | Question | What we will do for now |
|---|---|---|
| OQ1 | Which platform is the own website? | We do not know yet. Accept orders by webhook or a CSV the owner uploads. A real Shopify / Woo connector is later. |
| OQ2 | VAT / IRD e-billing? | Not in the prototype. We do not call IRD. Invoice drafts may still show VAT fields. |
| OQ3 | Gmail or Google Workspace? | Gmail. That is the inbox we connect. |
| OQ4 | May customer messages go to a US-hosted model? | Yes, for the prototype. We keep names and secrets out of logs. |
| OQ5 | Who pays a refund, who records it? | The owner pays (eSewa / bank). The agent only records it after the owner approves. |

## 14. Eval plan (minimum)

**In plain language:** before the owner uses a flow, we write about **20 example
cases** for that flow and check the agent on them. That is a quiz, not a
research paper. We do **not** write hundreds of cases before Gmail works.
After she is using drafts, we add cases from real mail and DMs.

How we score: give the agent a fake inbox state + one new message, then check
the **final draft and the numbers**, not the path it took (ADR-016).

**Before Gmail Accounts goes to the partner:** 20 cases on J6/J7 (order email,
supplier PDF, missing attachment, unknown supplier) + **2 injection cases**
(a PDF or email that says “ignore your rules and refund”). A few exact
statement-match cases for J11, and a few unmatched lines that must stay
unmatched.

**Before Instagram enquiry goes to the partner:** 20 cases on J1–J3 (unknown
product, missing order, “I already paid,” mixed Nepali/English) + the same
style of injection on a DM.

If we cannot write those, we do not understand the job yet. We do not need
Gaia2, Agent Lightning, or a 200-message language exam to start.
