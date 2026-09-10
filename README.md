# Quantvesting v3

> **From portfolio data to decision intelligence.**

Quantvesting is a quantitative portfolio/decision-support framework with an independent **Python/Jupyter path** and a **Cloudflare-native Web assessment path**. Both are intended to use the same portfolio, market-snapshot and methodology contracts.


### Web assessment table behavior

The Web Portfolio Holdings table shows the security-level holding count, allocation percentage, profit percentage and remaining upside. Its column headers are clickable for ascending/descending sorting. Review Areas are ordered by Remaining upside ascending, with unavailable values last. Opportunity Universe is constructed from the top 40 ranked securities and then filtered to `Upside % > 20`.

The homepage also previews the current Opportunity Universe independently of any uploaded portfolio, using the same canonical ranking/filtering logic. Beta users can optionally book a Discovery Call from the homepage or an In-depth Portfolio Assessment after completing an assessment via the external TopMate profile. The Web UI uses a deliberately quiet visual hierarchy: the homepage is optimized for discovery and the assessment is optimized for structured analysis. On mobile, the wide holdings table is replaced by compact holding cards while the desktop sortable table remains intact.

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

The Web UI provides the same concepts through **My Portfolio**, **Review Areas**, **Opportunity Universe**, **My Journey**, and **How to Read** alongside the assessment report. The homepage provides **Assess My Portfolio**, **About Quantvesting**, and **How to Prepare & Upload** tabs; the preparation tab also offers a downloadable sample `myPortfolioStocks.csv` that can be filled in and uploaded directly. Onboarding is the Web upload flow.

## Web UI / responsive design

The Web UI follows a **quiet financial intelligence** direction: strong hierarchy, generous whitespace, restrained borders, minimal decorative treatment and progressive disclosure. `Assess My Portfolio` is the primary homepage action; About, preparation guidance, Opportunity Universe and TopMate are secondary discovery paths.

The assessment deliberately supports greater analytical density than the homepage. Current Value and Deployed Value are emphasized as primary KPIs, while Portfolio Health, concentration and Review Areas provide the next layer of interpretation. The full sortable holdings table remains available on desktop/tablet; narrow mobile layouts use holding cards so the 11-column dataset is not simply squeezed into a horizontal scroll region.

Shared Web action buttons use the same visual primitive and primary/secondary hierarchy before and after assessment.

## Current capabilities

- Minimum-input portfolio onboarding: `Symbol, Shares, AvgCost`
- Broker/export aliases such as `Ticker`, `Quantity`, and `Average Price`
- Portfolio health, allocation and concentration analysis
- Review areas and advisory capital-rotation review
- Quantvesting opportunity universe and ranking
- Longitudinal portfolio journey/EOD history
- Canonical market snapshots and Python ↔ Web parity fixtures
- Cloudflare-native background assessment processing
- Downloadable assessment PDFs generated on demand from the completed result
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

## Assessment PDF delivery

After a Web assessment completes, the user can download a PDF copy of the assessment. The PDF is generated on demand from the completed assessment result and is not stored as a public report artifact.

The guest flow therefore does not expose a persistent bearer-style report URL. Assessment/job data needed for processing and the active registered-user workflow remains stored according to the existing repository model.

The PDF includes the portfolio summary, market-data timestamp, allocation and concentration, holdings, review areas, capital-rotation review, opportunity universe, journey and disclosure.

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
