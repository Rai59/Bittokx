# Bittokx

Open-source-first business platform. We build on existing projects instead of writing an ERP or CRM from scratch.

## Current stack decision

| Layer | Choice | Status |
| --- | --- | --- |
| ERP | [ERPNext](https://github.com/frappe/erpnext) on [Frappe](https://github.com/frappe/frappe) | Adopt |
| CRM | [Frappe CRM](https://github.com/frappe/crm) on the same site | Adopt |
| Everything else | Official Frappe apps first, then Chatwoot / n8n / Metabase when a gap is real | See research |

Full comparison, rejected alternatives (Odoo, Twenty, SuiteCRM, EspoCRM, …), licenses, and architecture:

**[docs/open-source-stack-research.md](docs/open-source-stack-research.md)**
