# Bittokx — Horizon (building for the AGI era)

Status: 2026-09-05. This is **direction**, not a build list. The prototype cut in
`01-architecture.md` still wins. Do not start implementing this file.

We are building a **shop operating system for the AGI era**, not a chatbot
demo on today’s model.

## 1. Where we actually are (September 2026)

Labs are calling this the start of the AGI *era*. That is a capability jump,
not a finished god-model, and not a reason to throw away controls.

| What launched | What it actually is | What it is not |
|---|---|---|
| **Claude Fable 5.1** (1 Sep 2026) | Anthropic’s generally-available frontier for long-horizon agents, knowledge work, documents / spreadsheets. 1M context. Stronger on *business workflows* than Fable 5. [Announcement](https://www.anthropic.com/claude-fable-and-mythos-5-1) | Not a reason to put Fable on every Instagram reply ($10 / $50 per MTok). Not Mythos (that SKU is locked). |
| **GPT-6 Astra** (3 Sep 2026) | OpenAI’s frontier + **computer use** (click a desktop / browser). Brockman: “not unreasonable to feel we are now in the AGI era.” | Not a reason to let an agent click Gmail or a bank. Reuters: Astra has been observed **trying to evade human monitoring**. That is why our apply path has no model. |

So: models can already draft a day’s books and a day’s DMs. They will get
cheaper and more reliable. **Everyone** will have that. The company we are
building is the layer that still exists when the model is a commodity —
ERPNext (or Xero), policy, apply, audit, and the owner’s shop.

## 2. The product that survives AGI

When the model is “good enough at everything,” Bittokx is still:

1. The **system of record** (Nepal ledger now; Xero / QuickBooks later).
2. The **inbox** (Gmail is operations; Instagram is enquiry).
3. The **law** (policy engine — the model never decides autonomy).
4. The **apply path** (owner or rule writes the ledger; **no model on that path**).
5. The **audit** (every decision and every apply is a row).

Smarter models make (3)–(5) **more** important, not less. Astra’s
evade-monitoring behaviour is the proof. Mercury already wrote the sentence
we keep: the model proposes, the product enforces, the user authorizes.

We do **not** become “an AGI.” We become the business the AGI works *inside*.

## 3. What becomes possible (same product, more autonomy)

Same jobs. The model does more of them. The owner’s day shrinks to
**exceptions and design**.

| Job | Prototype (now) | AGI-era (same Bittokx) |
|---|---|---|
| Gmail → invoice / bill | Draft every time | Auto-post for suppliers / order types with a clean history. Owner sees exceptions. |
| Bank match (exact) | Upload CSV, draft | Live feed (Yapily / TrueLayer after the company exists) + auto-match. CSV remains the fallback. |
| Bank match (fuzzy) | Unmatched list | Still a draft. The model may suggest; it does not guess a post. |
| Instagram enquiry | Draft reply | Auto reply when grounded (price, stock, status, link). Still escalate anger / legal / unknown. |
| Returns | Ticket auto-opens; decision drafted | Same. **Telling the customer “refund approved” stays human.** |
| Money out | Forbidden | **Still forbidden** (or dual-control: two humans). AGI does not send eSewa or a bank transfer alone. |
| Daily brief | Later slice | The agent already ran the day. The brief is “three things only you can decide.” |
| Ask-my-business | Later slice | Spoken / typed, any language, numbers from the ledger only. |
| Staff | Owner-only login | Agent assigns “pack this / photo this.” Humans do hands. Agent does inbox. |
| UK / AU | Designed for | Same runtime, Xero or QuickBooks adapter, Open Banking feed. |
| Tax / IRD / VAT | Not in prototype | Draft the return. Owner (or accountant) files. We never “just submit.” |
| Computer use (Astra-style) | Not used | **Last resort** for a portal with no API (some seller centres). Always HITL. Never the bank. Never Gmail if the API exists. |

The owner’s success line does not change: *she opens the app once or twice a
day, approves a short list, and nothing important was missed.* In the AGI
era that list is three items, not thirty.

## 4. What we refuse even then

These do not become “possible” just because the model is stronger:

- Recursive self-improvement on live money or customer DMs.
- A swarm / reviewer / planner mesh (Google 2026: sequential + tool-heavy
  work gets worse with extra agents).
- Identity, bank tokens, or IRD secrets in the prompt.
- The model on the apply path.
- Forking Fable, Astra, commerce-agents, Hermes, or OpenClaw as the product.
- Training on the shop’s mail without an explicit later decision.

## 5. What we build now so that future is cheap

The prototype is not a throwaway. It is the skeleton the AGI-era product
wears.

| Build now | Why it still matters when models are AGI-class |
|---|---|
| Thin canonical model + ERPNext adapter | Swap the brain (Sonnet → Fable → Astra → whatever is next) without rewriting the shop. |
| Policy classes + all-draft | Graduation is how autonomy is *earned*, not assumed. |
| Apply has no model | Survives models that try to retry or evade. |
| Provenance + grounding | Stops a fluent AGI inventing an order. |
| 20 snapshot cases per shipped flow | The quiz gets longer; the method stays. |
| Gmail first, social as enquiry | The inbox shape of real ecommerce does not change. |
| Statement upload | Proves matching before Open Banking exists. |

**Model choice in the prototype:** one API key, a capable Claude for customer
text. Fable 5.1 is the *ceiling* for hard Accounts documents when the bill
allows it — not the default for every DM. Astra computer-use is a later
tool, gated, never a feed.

## 6. One sentence for the company

We are not racing to *be* AGI. We are building the operating system a Nepali
shop (and later a UK/AU shop) runs **with** AGI — so when the model can do
the work, the work still hits the right ledger, the right policy, and the
right human.
