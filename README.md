# Bittokx

AI shop operating system: agents draft, owner applies, ERPNext is the silent ledger.

## Prototype stack (do this)

| Layer | Choice |
| --- | --- |
| Ledger | ERPNext, one site per tenant (never the owner UI) |
| CRM | **None.** Contact in ERPNext; conversations in our app |
| Product | FastAPI runtime + owner approve UI |
| Channels | Gmail first, then Instagram enquiry |

Do **not** start with Frappe CRM, Twenty, HRMS, Helpdesk, Insights, Keycloak, POS, n8n, or Chatwoot.

## Docs

- Product / architecture: [PR #1](https://github.com/Rai59/Bittokx/pull/1)
- Open-source ERP/CRM options: [docs/open-source-stack-research.md](docs/open-source-stack-research.md)
