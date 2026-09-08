# Quantvesting v3

> **From portfolio data to decision intelligence.**

Quantvesting is a quantitative portfolio/decision-support framework with an independent **Python/Jupyter path** and a **Cloudflare-native Web assessment path**. Both are intended to use the same portfolio, market-snapshot and methodology contracts.

## Current customer journey

```text
00 START HERE
      ↓
01 ONBOARD MY PORTFOLIO
      ↓
02 MY PORTFOLIO
      ↓
03 MY DECISIONS
      ↓
04 QUANTVESTING OPPORTUNITIES
      ↓
05 MY QUANTVESTING JOURNEY
```

The Web UI provides the same concepts through **My Portfolio**, **Review Areas**, **Opportunity Universe**, **My Journey**, and **How to Read**. Onboarding is the Web upload flow.

## Current capabilities

- Minimum-input portfolio onboarding: `Symbol, Shares, AvgCost`
- Broker/export aliases such as `Ticker`, `Quantity`, and `Average Price`
- Portfolio health, allocation and concentration analysis
- Review areas and advisory capital-rotation review
- Quantvesting opportunity universe and ranking
- Longitudinal portfolio journey/EOD history
- Canonical market snapshots and Python ↔ Web parity fixtures
- Cloudflare-native background assessment processing
- Persisted assessment/report links using opaque report tokens
- Active customer notebooks plus historical notebook archive

## Important product positioning

Quantvesting is assessment/review oriented. It does not execute trades, manage client funds, guarantee returns, or expose internal action codes as customer-facing trading instructions.

The standard disclosure is maintained consistently across the active notebooks and Web UI. See the consolidated project document for the canonical wording and customer terminology.

## Repository

```text
quantvesting_v3/
├── README.md
├── docs/QUANTVESTING.md       # consolidated active project context + roadmap
├── config/
├── market_data/
├── portfolio_data/
├── portfolio_template/
├── src/quantvesting/
├── notebooks/                 # active customer + admin notebooks
├── scripts/
├── tests/
└── web/                       # Cloudflare Worker + Web UI
```

Historical phase/changelog Markdown files have been consolidated into `docs/QUANTVESTING.md`. Historical notebooks remain under `notebooks/archive/` because they are useful reference material.

## Persisted report links

After a Web assessment completes, Quantvesting persists that assessment and provides a stable URL such as:

```text
/report/<opaque-token>
```

The report is independent of the browser session and does not require Jupyter to be running. The link is intentionally treated as private because possession of the complete link grants access to the saved assessment.

## WhatsApp roadmap

WhatsApp is **not implemented in the current release**. It remains deliberately deferred until a suitable WhatsApp provider/API is selected. The future design keeps report persistence independent from WhatsApp and uses separate consent for report delivery and optional Weekend Quantvesting broadcasts.

See **`docs/QUANTVESTING.md` → Roadmap → Deferred: WhatsApp**.

## Tests

From the repository root:

```bash
PYTHONPATH=src python -m pytest -q tests
npm run check:worker
npm run test:cloudflare
```

Do not claim a change is complete until the relevant regression tests pass.
