# Zephrok visual system

Working brand guidelines. Not a logo. Not a moodboard.

Open `index.html` in a browser, or:

```bash
python3 -m http.server 4173 --directory brand
```

Then visit `http://localhost:4173`.

## What this is

Zephrok is an AI-native operating system for running an online business. The visual system has to feel like **control without complexity**. Orange is a verb. Numbers are identity. AI is a record of work.

Four principles:

1. **The Spine** — 3px Ember mark for the current context
2. **Warm Ledger** — paper canvas, ink type, hairline rules
3. **One Orange Verb** — spine + focus + one primary action
4. **The Record** — when / what / numbers; humans and system share the same ledger

## Files

| Path | Role |
| --- | --- |
| `index.html` | Living brand book (rule → reason → correct → incorrect) |
| `css/system.css` | Primitives used by the book and the examples |
| `tokens/tokens.css` | Canonical CSS variables |
| `tokens/tokens.json` | Same tokens for tools |
| `tokens/shadcn-theme.css` | tweakcn / shadcn export. Do not increase radius. |
| `examples/dashboard.html` | Operations OS |
| `examples/ledger.html` | Finance table |
| `examples/operations.html` | System / AI activity |
| `examples/marketing.html` | Public page |

## Colour (light)

- Ember `#E24A1B` — recognition (not small text)
- Ember Strong `#BE3A0E` — primary buttons, AA on white
- Ink `#1C1917` · Paper `#F6F3EE` · Surface `#FFFCF8`
- Draft `#8A5A00` · Posted `#2C6A4A` · Error `#B42318` · Info `#3F5C73`

## Type

- **Source Serif 4** — marketing display only
- **Source Sans 3** — product, body, tables, money (tabular nums)
- **IBM Plex Mono** — IDs, timestamps, policy names. Never money.

## Paper

This system is HTML/CSS, which is what Paper reads and writes. When the Paper MCP is connected, create 1440-wide artboards and `write_html` from these pages without restyling. Do not invent a logo in Paper.

## Do not

- Design or imply a logo
- Flood screens with orange
- Use Inter, cool gray, 12px+ radius, glass, blobs, robots, sparkles
- Hide failed payments behind friendliness
