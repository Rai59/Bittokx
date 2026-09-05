# Bittokx Open Source Stack Research

**Date:** 5 September 2026  
**Purpose:** Decide whether ERPNext / Frappe is the right ERP foundation, pick a CRM, and map other open-source projects we should reuse instead of building from scratch.

This is a decision document, not a product spec. Live GitHub numbers were checked on 5 September 2026.

---

## Recommendation in one page

| Decision | Choice | Why |
| --- | --- | --- |
| **ERP** | **Yes — ERPNext on Frappe** | Fully open source (no Enterprise paywall), covers accounting / inventory / manufacturing / sales / buying in one system, and is designed to be extended with our own apps. |
| **CRM** | **Frappe CRM, same site as ERPNext** | First-party product, same framework, official Deal → Quotation → Customer handoff. Avoid a second stack unless sales UX becomes the product. |
| **Do not pick as CRM** | ERPNext’s built-in CRM module | Feature-frozen. Frappe is moving sales work to Frappe CRM. |
| **Do not pick first** | Twenty, SuiteCRM, EspoCRM, Krayin | Strong products, but they force a second database, second language, and a custom ERP sync. |
| **Build last** | Custom ERP or CRM from zero | Reuse Frappe DocTypes, workflows, permissions, and accounting. Write only what the ecosystem does not already do. |

**The useful rule:** stay inside the Frappe ecosystem until a gap is proven. The expensive mistake is running ERPNext *and* a fashionable TypeScript CRM *and* a PHP helpdesk, then spending the next year writing sync jobs.

---

## What we are optimizing for

Bittokx is a greenfield repository. There is no domain spec in the repo yet. The research assumes we want what the request implies:

1. Use existing open-source products instead of inventing an ERP or CRM.
2. ERPNext / Frappe is the current ERP preference.
3. CRM is still open.
4. We will likely extend the stack into a product (custom modules, branding, maybe multi-tenant later).

If Bittokx is closer to an all-in-one business OS (ERP + POS + CRM + HR + finance), Frappe is a better home than a CRM-first product. If Bittokx is a modern sales CRM that happens to invoice later, Twenty would win. Those are different products.

---

## 1. Is ERPNext the right ERP?

**Yes, for this project, with eyes open.**

It is the best *fully open* ERP we can build on. It is not the most polished ERP, and it is not free of operational cost.

### Why it fits

**It is actually open.** Frappe Framework is MIT. ERPNext is GPL-3.0. Every module ships in the public repo: accounting, stock, buying, selling, manufacturing, assets, projects, quality. There is no “Community edition missing MRP / payroll / multi-company Studio.” That is the main difference from Odoo.

**It is a platform, not only a product.** Custom DocTypes, Client/Server Scripts, workflows, roles, print formats, and REST APIs are first-class. Our work should be **Frappe apps** (`bittokx_*`) installed next to ERPNext, not a fork of `frappe/erpnext`.

**The ecosystem already covers the usual second products.** Official or first-party apps exist for CRM, HR/payroll, helpdesk, analytics, LMS, website builder, drive, payments, and lending. Community POS and webshop apps exist. We can assemble a suite before we write a line of domain UI.

**License cost scales with compute, not seats.** Self-host or Frappe Cloud. Unlimited users. That matters if we sell to SMEs with many warehouse / shop-floor / sales users.

**It is alive.** `frappe/erpnext` has ~38.9k stars, ~12.7k forks, and was pushed the same day as this research. The project has been in production since 2008.

### What we give up (vs Odoo and vs building)

| Risk | Reality | What to do |
| --- | --- | --- |
| **UX is Desk-shaped** | ERPNext forms feel like an ERP, not like HubSpot. Salespeople will dislike the old CRM screens. | Put sales on **Frappe CRM** (Vue, kanban, PWA). Keep Desk for finance, stock, manufacturing. |
| **Smaller app store than Odoo** | Odoo has tens of thousands of modules. Frappe has hundreds of real ones. | Prefer first-party Frappe apps. Treat community apps as optional and pin versions. |
| **Ops is not trivial** | Bench + MariaDB + Redis + Node + workers + socketio. Major version upgrades are real projects. | Use `frappe_docker`, one site, a documented upgrade path, staging first. |
| **Localization is uneven** | India GST is excellent. EU / US / CIS / Central Asia need work. Multi-country localization apps can leak fields across companies. | Budget a **country compliance app** early. Do not assume Uzbekistan / multi-country tax is free. |
| **Multi-company isolation is soft** | Several companies can live in one site, but masters (items, custom fields, scripts) are not fully isolated. | One site per legal isolation boundary, or accept shared masters. Do not sell “hard multi-tenant SAP” on one database without custom work. |
| **GPL on ERPNext** | Custom apps that are derivative of ERPNext inherit GPL obligations if distributed. Framework-only apps can stay MIT. | Keep Bittokx-specific product code in our apps. Get legal review before we sell a hosted modified ERPNext. |
| **POS / retail depth** | Built-in POS exists; high-volume offline retail usually needs POS Awesome, POSNext, or X POS. | If retail is core, evaluate those apps in week one. Do not rebuild POS. |

### ERPNext vs the other open ERPs

| | ERPNext | Odoo Community | Dolibarr | Axelor / Tryton / iDempiere |
| --- | --- | --- | --- | --- |
| License | GPL-3.0, full product | LGPL core + proprietary Enterprise | GPL-3.0 | Mostly GPL |
| Stars (Sep 2026) | ~38.9k | ~54.2k (whole monorepo) | ~7.6k | Smaller |
| Accounting / stock / MRP in free tier | Yes | Partial (many advanced features are Enterprise) | Basic | Varies |
| Extend by writing apps | Frappe DocTypes | Odoo modules | PHP modules | Java / Python, steeper |
| Best for | Teams that will customize and want no paywall | Teams that want polish and will pay Enterprise later | Freelancers / micro-SMEs | Heavy enterprise Java shops |
| Verdict for Bittokx | **Pick** | Strong alternative only if we accept open-core | Too small | Wrong talent bet |

**Odoo is the only serious rival.** It has a better default UI and a larger partner market. It is the wrong default if the goal is “use as much open source as possible and own the full stack.” Community edition is intentionally thinner than Enterprise (Studio, some accounting localizations, advanced MRP, marketing automation). If we start on Odoo CE, we will feel that wall.

**Dolibarr** is fine for a 5-person trading company. It is not a platform to build Bittokx on.

**Do not fork ERPNext.** Forks die at the first major upgrade. The Frappe pattern is: `bench get-app` our apps, hook events, add DocTypes, override via fixtures and form scripts.

### When ERPNext would be the wrong choice

- We only need a sales CRM and light invoicing — then Twenty or EspoCRM is less ERP overhead.
- We need SAP-grade multi-entity consolidation, hard data isolation, and statutory packs for 10+ countries on day one.
- The team refuses Python / MariaDB and only wants TypeScript.
- We plan to resell a closed-source modified ERP and cannot live with GPL/AGPL.

None of those is implied by “ERP + undecided CRM, prefer open source.”

---

## 2. Which CRM?

### Default: Frappe CRM

**Repo:** [frappe/crm](https://github.com/frappe/crm) — ~3.5k stars, Vue, **AGPL-3.0**, last push 4 September 2026.

Frappe built this because their own sales team found ERPNext’s CRM too form-heavy. It is a dedicated sales app on the same framework:

- Leads, deals, organizations, contacts
- Kanban, saved views, filters, forecast widgets, mobile PWA
- Email, Twilio / Exotel calling, WhatsApp (via Frappe WhatsApp)
- Facebook / Instagram lead ads
- Assignment rules, sales hierarchy, deal SLAs
- Official ERPNext integration

**Same-site integration (the path we want):**

1. Install CRM and ERPNext on one Frappe site.
2. Enable ERPNext in CRM settings and set the company.
3. ERPNext Items sync to CRM Products (ERPNext is source of truth, including price lists).
4. A won (or configured) deal can create a Customer.
5. **Create Quotation** opens a pre-filled ERPNext Quotation from the deal.
6. Quotation → Sales Order → Invoice stays in ERPNext.

Leads, emails, and activities stay in Frappe CRM. That is correct: sales workspace vs ledger.

**Remote (two-site) integration is thinner** — customer/prospect creation only, no item sync. Do not start that way.

### Frappe CRM vs ERPNext’s built-in CRM

| | Frappe CRM | ERPNext CRM module |
| --- | --- | --- |
| Daily sales UX | Dedicated Vue app | Desk forms |
| New features | Active | Effectively frozen |
| Quotes / orders / commissions / contracts | Handoff to ERPNext | Native, deeper commercial records |
| Campaigns / UTM into invoices | Weaker | Stronger today |
| Telephony / WhatsApp | Built in | Not a sales product |
| Frappe’s direction | **This is the future sales UI** | Do not invest here |

Use Frappe CRM for pipeline work. Keep ERPNext for money and stock. If we need Email Campaigns, Contracts, Appointments, Competitors, or commission trees, keep those records in ERPNext and link them — do not wait for Frappe CRM to clone every ERPNext DocType.

### Why not Twenty (even though it is the star of 2026)

[twentyhq/twenty](https://github.com/twentyhq/twenty) — ~56.3k stars, TypeScript (NestJS + React), AGPL-3.0 with some `@license Enterprise` files.

Twenty is the best *standalone* open-source Salesforce/HubSpot-shaped CRM: custom objects, GraphQL, modern UI, AI/MCP story. It is the wrong *first* CRM for an ERPNext shop because:

- No official ERPNext connector. We would write and maintain sync (orgs, contacts, items, quotes, invoices).
- Second runtime (Node + Postgres + Redis) next to Frappe (Python + MariaDB + Redis).
- Open-core: SSO and some permission features are commercial.
- AGPL + enterprise-file split is messier if we productize a hosted CRM.
- It does not do accounting, stock, or manufacturing. We would still run ERPNext.

**Revisit Twenty only if** Bittokx’s product *is* the CRM (AI-native sales workspace) and ERPNext is a back office we integrate later.

### The rest of the CRM shortlist

| Project | Stars | Stack / license | Use it if… | Skip if… |
| --- | --- | --- | --- | --- |
| **Frappe CRM** | 3.5k | Vue / Frappe, AGPL-3.0 | We chose ERPNext | We abandoned Frappe |
| **Twenty** | 56.3k | TS, AGPL + enterprise files | CRM is the product, TypeScript team | We need native ERP quotes |
| **Krayin** | 23.8k | Laravel, MIT | We are a PHP/Laravel shop building our own product | We already chose Frappe |
| **SuiteCRM** | 5.7k | PHP, AGPL-3.0 | Replacing Salesforce, need campaigns/contracts/forecasting depth | We care about modern UX or Frappe unity |
| **EspoCRM** | 3.3k | PHP, AGPL-3.0 | Small team, fast self-host, no ERP | We need ERPNext sync |
| **Odoo CRM** | (inside Odoo) | Python | We picked Odoo as ERP | We picked ERPNext |
| **CiviCRM** | — | PHP, AGPL | Nonprofits / memberships | We are commercial ERP |
| **Monica** | — | PHP | Personal relationships | Business CRM |
| **Fat Free CRM** | 3.6k | Rails | Learning / tiny internal tool | Production SME suite |

Krayin’s MIT license is attractive for a commercial fork, but it does not buy us ERPNext accounting or stock. That would be building two products.

### CRM decision rule

```
if ERP is ERPNext:
    CRM = Frappe CRM on the same site
    do not enable ERPNext CRM as the sales UI
elif product is "modern AI CRM" and ERP is later:
    CRM = Twenty
    integrate ERPNext via n8n + REST later
elif nonprofit / membership:
    CRM = CiviCRM
else:
    EspoCRM (small) or SuiteCRM (Salesforce-shaped)
```

---

## 3. Other open-source projects we should use

Do not invent these. Install or integrate them.

### 3.1 Stay on Frappe first (same bench, same users, same permissions)

| Need | Project | Notes |
| --- | --- | --- |
| ERP / accounting / stock / MRP | [ERPNext](https://github.com/frappe/erpnext) | Core |
| Sales CRM | [Frappe CRM](https://github.com/frappe/crm) | Same site |
| HR & payroll | [Frappe HRMS](https://github.com/frappe/hrms) (~8.7k★) | Official |
| Ticketing / customer service | [Frappe Helpdesk](https://github.com/frappe/helpdesk) (~3.4k★) | Official; Vue, like CRM |
| BI / dashboards | [Frappe Insights](https://github.com/frappe/insights) (~1.0k★) | Good enough to start |
| Website / landing | [Frappe Builder](https://github.com/frappe/builder) | Visual pages on the same platform |
| Files | [Frappe Drive](https://github.com/frappe/drive) | |
| Docs | [Frappe Wiki](https://github.com/frappe/wiki) | |
| Payments | [Frappe Payments](https://github.com/frappe/payments) | Gateways |
| Lending / credit | [Frappe Lending](https://github.com/frappe/lending) | Only if BNPL / loans are in scope |
| Education | [Frappe LMS](https://github.com/frappe/lms) | Partner / staff training |
| Print layouts | [Print Designer](https://github.com/frappe/print_designer) | Invoices, packing slips |
| Internal discussion | [Gameplan](https://github.com/frappe/gameplan) | Lightweight; not Jira |
| eCommerce | [Webshop](https://github.com/frappe/webshop) + [ecommerce_integrations](https://github.com/frappe/ecommerce_integrations) | WooCommerce / shop sync |
| POS | [POS Awesome](https://github.com/yrestom/POS-Awesome), [POSNext](https://github.com/BrainWise-DEV/POSNext), [X POS](https://github.com/kodlyft/xpos) | Pick one after a retail spike |
| Telephony / WhatsApp | Frappe telephony apps + [frappe_whatsapp](https://github.com/shridarpatil/frappe_whatsapp) | Used by CRM |

Catalogs to browse, not to blindly install: [awesome-frappe](https://github.com/gavindsouza/awesome-frappe), [frappegems.com](https://frappegems.com/best-frappe-apps).

### 3.2 Best-in-class adjacent tools (second stack is OK here)

These solve problems Frappe does not need to own. Integrate with REST / webhooks. Do not rewrite them.

| Need | Project | Stars (Sep 2026) | Why it is worth a second service |
| --- | --- | --- | --- |
| Omnichannel inbox (web, WhatsApp, IG, email) | [Chatwoot](https://github.com/chatwoot/chatwoot) | 36.5k | Stronger live-chat product than Helpdesk if support is a product surface |
| Workflow / iPaaS | [n8n](https://github.com/n8n-io/n8n) | 203k | ERPNext ↔ banks, SMS, marketplaces, Twenty, Chatwoot without custom glue services |
| Product / warehouse storefront | [Medusa](https://github.com/medusajs/medusa) | 36.1k | Headless commerce if Webshop is too ERP-ish |
| Alternative commerce | [Saleor](https://github.com/saleor/saleor) | 23.3k | GraphQL commerce; heavier |
| Deep BI | [Metabase](https://github.com/metabase/metabase) | 49.1k | When Insights is not enough; read-only SQL on MariaDB |
| Identity / SSO | [Keycloak](https://github.com/keycloak/keycloak) or [Authentik](https://github.com/goauthentik/authentik) | — | Staff SSO into Frappe, Metabase, n8n |
| Email newsletters | [Listmonk](https://github.com/knadh/listmonk) | — | Lightweight; or **Mautic** if we need marketing automation |
| Scheduling | [Cal.com](https://github.com/calcom/cal.com) | — | Book demos / field visits |
| Product analytics | [PostHog](https://github.com/PostHog/posthog) | — | If Bittokx has its own SaaS UI |
| Errors | [GlitchTip](https://gitlab.com/glitchtip/glitchtip) or Sentry (OSS core) | — | Watch Frappe workers |
| Object storage | [MinIO](https://github.com/minio/minio) | — | S3-compatible files for Frappe |
| Reverse proxy / TLS | Caddy or Traefik + Let’s Encrypt | — | Front the bench |
| Reverse ETL / extra warehouse | Optional later | — | Do not start here |

Chatwoot vs Frappe Helpdesk: start with **Helpdesk** if tickets are back-office. Add **Chatwoot** when we need a shared inbox on the website and social channels. They can coexist (Chatwoot captures, Helpdesk / ERP owns the account).

n8n vs Frappe workflows: Frappe workflows are for document approval (Submit / Cancel / role). n8n is for “when deal is won, notify Telegram, create Chatwoot contact, push to a bank API.”

### 3.3 Do not start with these (for this project)

| Project | Why not first |
| --- | --- |
| IDURAR, Twenty-as-ERP, Akaunting | Incomplete ERP vs ERPNext |
| Apache OFBiz, iDempiere | Java enterprise; huge hire cost |
| Bitrix24, Vtiger (open-core / odd licenses) | License and product-split risk |
| Building our own auth, inbox, or dashboard | Already solved |
| Forking Odoo + ERPNext “to take the best of both” | Two platforms, no leverage |

---

## 4. Suggested architecture

```
                    ┌──────────────────────────────┐
   Staff SSO        │  Keycloak / Authentik (later) │
                    └─────────────┬────────────────┘
                                  │
                    ┌─────────────▼────────────────┐
                    │     One Frappe site           │
                    │  ERPNext + Frappe CRM         │
                    │  + HRMS + Helpdesk + Insights │
                    │  + our apps: bittokx_*        │
                    └───────┬───────────┬───────────┘
           quotes/invoices  │           │ tickets / items
                            │           │
              ┌─────────────▼──┐   ┌────▼─────────┐
              │ POS / Webshop  │   │ n8n (glue)   │
              │ (if retail)    │   └───┬──────────┘
              └────────────────┘       │
                                 Chatwoot / Listmonk / banks / tax APIs
```

**Hosting:** `frappe_docker` on our VMs, or Frappe Cloud until we have ops. One site, not a site-per-app.

**Our code lives in:**

- `bittokx_core` — company branding, roles, fixtures, country settings
- `bittokx_compliance` — tax, e-invoice, local reports (when we know the country)
- optional verticals later (`bittokx_retail`, `bittokx_lending`, …)

Never copy ERPNext DocTypes into our repo. Extend them.

---

## 5. License notes (we will need this)

| Software | License | Practical effect |
| --- | --- | --- |
| Frappe Framework | MIT | Our framework-only apps can be closed or any license |
| ERPNext | GPL-3.0 | Distributing a modified ERPNext or a tightly coupled derivative likely requires offering source |
| Frappe CRM, Helpdesk | AGPL-3.0 | Network use: if we modify and offer it as a service, source-offer obligations are stronger than GPL |
| Twenty | AGPL + commercial files | Same AGPL idea; some features are not OSS |
| Odoo | LGPL Community / proprietary Enterprise | Mixing Enterprise code locks us in |
| Krayin | MIT | Easiest to commercialize; no ERP |
| n8n | Sustainable Use (source-available, not OSI) | Fine internally; check before we embed it in a SaaS we sell |
| Chatwoot | Open-core (check current LICENSE) | Core is usable; some features may be enterprise |

Get a lawyer before we sell “Bittokx Cloud” running patched ERPNext + CRM. Internal use and on-prem customer deploys of *unmodified* upstream plus our separate apps are the usual path.

---

## 6. What to validate next (not more reading)

1. **Stand up one site** with ERPNext v16 + Frappe CRM + HRMS using `frappe_docker`.
2. Walk a real flow: lead → deal → quotation → sales order → delivery → invoice → payment.
3. Try POS Awesome or POSNext with 50 SKUs if retail matters.
4. List statutory needs (VAT, e-invoice, payroll language, chart of accounts) for the first country. That is the largest hidden build.
5. Decide isolation: one company, multi-company one site, or site-per-tenant.
6. Only after that, consider Chatwoot / n8n / Metabase. Not before.

---

## 7. Sources

- [Frappe CRM](https://frappe.io/crm) and [ERPNext integration docs](https://docs.frappe.io/crm/erpnext)
- [Frappe CRM GitHub](https://github.com/frappe/crm), [ERPNext GitHub](https://github.com/frappe/erpnext)
- [Frappe license table](https://docs.frappe.io/legal/others/license-and-trademark)
- [ERPNext CRM vs Frappe CRM](https://www.cratorlabs.ai/blog/erpnext-crm-vs-frappe-crm) (rtCamp migrator, feature gaps)
- [Frappe June 2026 product updates](https://frappe.io/blog/product-updates/product-updates-for-june-2026) (CRM ↔ ERPNext sync controls)
- [awesome-frappe](https://github.com/gavindsouza/awesome-frappe)
- GitHub API star / license / push dates, 5 September 2026
- Comparative write-ups: OSSAlt CRM guide, OpenSourceProjects CRM list, ERPNext vs Odoo 2026 comparisons (used for market context; product facts checked against official repos)

---

## Bottom line

ERPNext / Frappe is the right ERP bet if we want to **compose an open business system** and write only the Bittokx layer. The matching CRM is **Frappe CRM on the same site**, not Twenty and not ERPNext’s old CRM module.

Twenty, SuiteCRM, and EspoCRM are good projects to learn from. They are the wrong second database until Frappe CRM is proven insufficient.

The rest of the stack should be **official Frappe apps first**, then Chatwoot / n8n / Metabase / a POS app when a concrete gap appears.
