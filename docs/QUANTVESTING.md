# Quantvesting — Project Context, Architecture & Roadmap

**Current baseline:** E6 SEBI/customer-language synchronization repository

This is the consolidated active project document. Historical phase notes, changelogs and setup notes that previously existed as separate Markdown files have been consolidated here so the repository has one active documentation source in addition to `README.md`.


### Web assessment table behavior

The Web Portfolio Holdings table shows the security-level holding count, current allocation percentage and remaining upside. Its column headers are clickable for ascending/descending sorting. Review Areas are ordered by Remaining upside ascending, with unavailable values last. Opportunity Universe is constructed from the top 40 ranked securities and then filtered to `Upside % > 20`.

## 1. Product purpose

Quantvesting is a quantitative portfolio/decision-support platform with two independent execution modes:

- **Jupyter/Colab/Python** — research, analysis, validation and customer-facing notebooks.
- **Cloudflare Web App** — customer-facing assessment experience that does not require Jupyter to be running.

The core contract is:

> Same portfolio + same market snapshot + same configuration => equivalent Python and Cloudflare assessment outputs.

The product is assessment/review oriented. It does not execute trades, manage client funds, or present engine action codes as customer-facing trading instructions.

## 2. Current customer journey

The active notebook sequence is:

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

The customer-facing Web UI exposes:

- Assess My Portfolio
- About Quantvesting
- How to Prepare & Upload
- My Portfolio
- Review Areas
- Opportunity Universe
- How to Read

My Journey remains an underlying data/API and notebook capability but is intentionally not exposed in the first customer-facing Web assessment.

Onboarding is the Web upload flow rather than a separate Web tab.

## 3. Customer language — canonical

Use these labels consistently in Web UI, active notebooks and customer documentation:

| Internal output | Customer-facing label |
|---|---|
| `BUY_CANDIDATE` | **Review candidate** |
| `EXIT_TARGET` | **Target reached — review** |
| `WAIT_FOR_EXIT_WINDOW` | **Legacy holding — review** |
| `REVIEW_ROTATION` | **Rotation review** |
| `STRONG_ROTATION_REVIEW` | **Strong rotation review** |
| `HOLD` | **No current review** |

Portfolio categories:

| Internal concept | Customer-facing label |
|---|---|
| Core allocation | **Core Holdings** |
| Legacy allocation | **Legacy Holdings** |
| Out-of-universe allocation | **Outside Quantvesting Universe** |
| In-portfolio health | **Portfolio Health** |

Never expose internal enums as the primary customer language.

## 4. Compliance positioning

The standard customer disclosure is:

> Quantvesting is not a SEBI-registered Investment Adviser. The information and assessment outputs are provided for educational and informational purposes only and are based on a rules-based analytical framework and data available at the stated time. They are not investment advice or a recommendation to buy, sell or hold any security. Quantvesting does not execute trades or manage client funds. Please make independent investment decisions and consider consulting a SEBI-registered Investment Adviser where appropriate. Market data and analytical inputs may be delayed, incomplete or subject to error. Any historical performance or scenario figures are not indicative of future results.

This is conservative product language, not a legal opinion or certification of SEBI compliance.

## 5. Architecture

```text
Market Data Provider
  yfinance today / licensed provider later
          ↓
Canonical Market Snapshot
          ↓
Cloudflare R2
     ↙          ↘
Python/Jupyter   Cloudflare Worker
     ↓                 ↓
Quantvesting       Quantvesting
Engine             Engine
     ↘                 ↙
       Consistent assessment
                ↓
        Web / notebooks
```

Core rule:

> Notebooks orchestrate. Engine calculates. Repositories persist. Reporting presents. Web presents the same methodology through a Cloudflare-native execution path.

Do not put yfinance directly into the customer-facing Worker.

## 6. Repository structure

```text
quantvesting_v3/
├── README.md
├── docs/
│   └── QUANTVESTING.md
├── config/
├── market_data/
├── portfolio_data/
├── portfolio_template/
├── src/quantvesting/
├── notebooks/
│   ├── 00_START_HERE.ipynb
│   ├── 01_ONBOARD_MY_PORTFOLIO.ipynb
│   ├── 02_MY_PORTFOLIO.ipynb
│   ├── 03_MY_DECISIONS.ipynb
│   ├── 04_QUANTVESTING_OPPORTUNITIES.ipynb
│   ├── 05_MY_QUANTVESTING_JOURNEY.ipynb
│   ├── admin/
│   └── archive/
├── scripts/
├── tests/
└── web/
    ├── engine/
    ├── public/
    └── worker.js
```

Historical notebooks remain under `notebooks/archive/`. They are reference material, not the current customer workflow.

Generated caches such as `.pytest_cache/` and Python `__pycache__/` are not part of the distributable repository.

## 7. Data and parity rules

### Portfolio aggregation

Portfolio economics are aggregated by `Symbol`.

- Shares are summed.
- AvgCost is a weighted average rounded to two decimals.
- Account membership is retained as a combined value such as `DM+SV`.
- The exact Ankit parity fixture remains 118 source rows → 86 security-level holdings.

### Market data

The intended architecture is:

```text
Provider → canonical snapshot → R2 → Python + Cloudflare
```

Snapshot metadata includes snapshot ID, timestamp, source, schema/version and file fingerprints where available.

Periodic snapshots must not be described as tick-level real-time data.

### FTT semantics

- `NTT` strategy: FTT = Target.
- `BTT` strategy: FTT = Target.
- Other strategies such as `ATH`: FTT = historical Max.
- A holding without a current prospect/framework record does **not** receive an invented FTT, even if a screener ATH% exists.
- Cloudflare derives Max from `CMP / (1 - ATH% / 100)` where required by the snapshot contract.

Target and rotation calculations use FTT rather than always using Target.

## 8. Assessment PDF delivery — current feature

The guest Web assessment no longer exposes a persistent public report URL. Once an assessment is complete, the user can use **Print / Save Assessment PDF**. The primary flow creates a print-ready copy of the same Web assessment DOM, reveals all report tabs sequentially, and uses the browser's native Print / Save as PDF flow.

Flow:

```text
Portfolio CSV
    ↓
Assessment
    ↓
Completed assessment result
    ↓
Print-ready copy of Web assessment DOM
    ↓
All report tabs shown sequentially
    ↓
Browser Print / Save as PDF
```

The print view uses the same `/styles.css` as the Web UI plus A4-specific print rules for fonts, spacing, tables, cards, page breaks and print colors. The upload guidance and interactive How to Read tab, along with report controls, are excluded from the PDF.

The print-only page geometry now uses explicit A4-safe gutters inside `.print-document` (`12mm` top, `10mm` left/right, `14mm` bottom) with `@page` margins set to zero. This makes PDF borders and content consistently breathe away from the physical page edges even when browser print-margin settings are minimal, without changing the Web UI appearance.

The legacy Worker endpoint `GET /api/jobs/<id>/pdf` remains available as a compatibility/fallback presentation endpoint, but the primary customer button does not call it because its text-only generator cannot reproduce the Web UI closely enough. The existing job/result persistence required for processing remains intact, as does the protected registered-user assessment path.

The PDF keeps customer-facing terminology aligned with the active notebooks and Web assessment. Technical provenance such as snapshot ID, source and engine version remains available in the assessment result for auditability, while the Web UI presents a human-readable market-data date/time in IST.

## 9. Notebook ↔ Web synchronization

The Python and Web paths must continue to share:

- customer-facing terminology
- methodology and FTT semantics
- portfolio aggregation rules
- market snapshot semantics
- disclosure language
- parity fixtures

The Web PDF is a delivery/presentation feature, not a second calculation engine.

Active notebooks remain independent and continue to run the Python engine directly. The notebooks should explain the same customer concepts and labels as the Web UI rather than reproducing Web-specific implementation details.

## 9A. Quantvesting Journal — current implementation

The Web product includes a first-party static Journal. The live Journal is served by the Cloudflare Worker at:

`https://quantvesting-v3.rathi-ankit.workers.dev/blog/`

The GitHub Pages project URL is a redirect layer:

`https://ankit-rathi.github.io/quantvesting_v3/blog/`

The Journal is **not** a top-level homepage tab. It remains a separate `/blog/` destination reached contextually from About Quantvesting and selected Journal CTAs. The assessment flow remains **My Portfolio → Review Areas → Opportunity Universe**, with **How to Read** as the educational reference.

The Journal is intentionally separate from portfolio assessment data. It has no database, CMS, comments, customer account dependency or portfolio-data dependency. Source content lives in `_posts/` and each post filename begins with its publication date:

```text
_posts/YYYY-MM-DD-slug.md
```

Required front matter:

```yaml
---
title: "Post title"
excerpt: "Short description used in the Journal index and metadata."
tags:
  - portfolio
  - investing
---
```

`scripts/build_blog.py` validates filenames/front matter, orders posts reverse chronologically, renders Markdown to static HTML, creates the Journal index, topic filters, RSS feed and sitemap, and writes the actual Worker asset bundle to `web/public/blog/`.

The topic cloud is an accessible filtering control rather than a decorative word cloud. Tag frequency influences emphasis, every topic remains a real button with `aria-pressed`, and the selected topic is reflected in the `?topic=` query parameter so filtered Journal views are shareable.

Journal typography intentionally reuses the Web UI's existing font family, base sizing, heading hierarchy, palette, spacing conventions and shared button primitives. `web/blog/blog.css` provides Journal-specific layout/reading styles without redefining the product's core typography system. Individual article pages load `../../../styles.css` because the article URL is nested under `/blog/posts/<slug>/`.

A sample post is intentionally kept in `_posts/` as a visual/content reference. Generated files under `web/public/blog/` must not be edited manually.

### Markdown-only publishing

Journal assets are now built as part of the **single Quantvesting Worker deployment** in `.github/workflows/deploy-worker.yml`. A push that changes `_posts/`, the Web app, the strategy configuration or the relevant build scripts runs the Journal build, strategy-contract generation, regression tests and Web cohesion checks before deploying the Worker and its static assets together. This prevents the Journal index and article assets from being deployed from separate lifecycles.

`.github/workflows/deploy-pages.yml` remains a separate GitHub Pages redirect layer. The Worker deployment is the source of truth for the actual Journal HTML assets.

Therefore the normal author workflow is simply **add/edit `_posts/*.md` → push to `main`**. No manual Web deployment and no per-post redirect configuration are required.

### One-time GitHub setup

Set **Repository → Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Add these repository secrets once:

- `CLOUDFLARE_API_TOKEN` — permitted to deploy the `quantvesting-v3` Worker.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID that owns the Worker.

Do not commit either secret.

## 10. Existing capabilities that must remain intact

- Python Quantvesting engine
- customer onboarding with minimum `Symbol, Shares, AvgCost`
- broker/export aliases such as `Ticker`, `Quantity`, `Average Price`
- optional investment history
- outside-universe handling
- portfolio health and allocation analysis
- concentration analysis
- review areas and capital rotation review
- opportunity universe/ranking
- longitudinal journey/EOD history
- run IDs, strategy versions, validation and reproducibility metadata
- canonical market snapshots and R2 publishing
- Cloudflare Worker + Durable Object assessment processing
- protected admin job bridge
- active customer notebooks and archived historical notebooks
- Python/Web parity tests

## 11. Testing baseline

Run from the repository root:

```bash
PYTHONPATH=src python -m pytest -q tests
npm run check:worker
npm run test:cloudflare
```

The current baseline must remain green before a change is considered complete.

## 12. Roadmap

### Completed / current

- E6 customer-language and terminology synchronization
- Cloudflare-native assessment path
- canonical market snapshot architecture
- Python ↔ Web parity fixtures
- guest beta onboarding
- on-demand assessment PDF delivery without a public guest report link

### Next hardening

1. Expand fixed-snapshot Python ↔ Web parity coverage.
2. Continue assessment provenance and freshness visibility.
3. Keep PDF/Web presentation synchronized with active notebook concepts and labels.
3. Harden snapshot validation and stale-snapshot handling.
4. Improve operational deployment/monitoring without changing methodology.

### Deferred: WhatsApp

**WhatsApp is deliberately not implemented in this release.**

The preferred future design is:

```text
Cloudflare Worker
      ↓
D1 contacts + consent
      ↓
WhatsApp provider/API
```

When WhatsApp becomes appropriate, keep these concerns separate:

1. **Assessment/report delivery consent** — permission to send the user's assessment PDF/artifact through WhatsApp.
2. **Optional Weekend Quantvesting broadcast consent** — separate opt-in for recurring educational/update messages.

The future contact/consent model should record at least:

- normalized mobile number
- contact status
- consent type
- whether consent is currently granted
- consent text/version
- consent source
- granted/revoked timestamps

A future report-delivery flow should be:

```text
Assessment complete
      ↓
Generate/download assessment artifact
      ↓
Optional "Get report on WhatsApp"
      ↓
Mobile number + explicit delivery consent
      ↓
WhatsApp provider
```

The Weekend broadcast should be a separate opt-in and a separate scheduled process. Revoked/unsubscribed contacts must be excluded.

Do not make WhatsApp the storage location for reports. WhatsApp should remain a delivery/communication channel, while the assessment artifact is generated from the canonical assessment result.

Do not build a WhatsApp chatbot as part of the first implementation.

### Explicitly not part of this phase

- WhatsApp Business/API integration
- payments
- broker integration
- mobile app
- chatbot/WhatsApp conversational product
- large CRM
- replacing the Python engine with Web-specific business logic

## 13. Design principles

> **Shared contracts, data, semantics and fixtures are preferred over duplicated business logic.**

> **Customer language stays meaningful and consistent across Web and notebooks.**

> **A disclosure is not a legal certification.**

> **Jupyter is not a production customer dependency.**

> **Periodic market data must not silently be presented as real-time data.**


## 9B. Holistic Web cohesion pass — 2026-09-11

The current Web baseline includes a deliberate semantic/data/visual cohesion pass. The objective is not to add features; it is to make the same Quantvesting story appear consistently across data, Web, mobile, print/PDF, Journal and documentation.

### Canonical product story

```text
Understand my portfolio
        ↓
Know what deserves attention
        ↓
Investigate the evidence
        ↓
See where the framework finds further research
        ↓
Compare capital thoughtfully — without automatic buy/sell instructions
```

### Data/semantic contract

`web/engine/strategy.js` is generated from `config/strategy.yaml` by `scripts/build_strategy_contract.py`. It carries the active conviction hierarchy, rotation thresholds, FTT strategy precedence and opportunity selection limits into the Cloudflare engine.

Canonical FTT precedence:

```text
NTT → Target
BTT → Target
other strategy → Max
no current prospect/framework record → no FTT
```

Thesis-capture is now a semantic state rather than a percentage shown in every circumstance:

- `BELOW_COST_BASIS` — progress is not meaningfully measurable yet.
- `NOT_MEASURABLE` — required inputs do not support the metric.
- `IN_PROGRESS`
- `WATCH`
- `REVIEW`
- `STRONG_REVIEW`
- `TARGET_REACHED`

Python and Web both avoid presenting negative thesis-capture percentages as if they were meaningful progress. This is a customer-story change backed by regression tests.

### Coverage transparency

Assessment terminal data now includes:

- current market-value coverage count/percentage;
- active FTT coverage count/percentage;
- valuation basis;
- target basis;
- deployed-value basis;
- allocation basis.

The Web UI surfaces coverage so N/A values are explainable rather than looking like silent calculation failures.

### Review Areas

Review Areas now distinguish **active review situations** from **Legacy classification**. The attention queue is based on active situations rather than simply counting every Legacy holding.

Near FTT uses one clear metric:

> Remaining FTT upside

Quality / Rank Review uses rank and quality evidence. Neither group uses a generic bar whose width means something different from the label. Review questions appear once at group level; cards provide evidence.

The full evidence area initially emphasizes active review evidence. Legacy holdings remain available as framework context through progressive disclosure.

### Mobile parity

Desktop holdings use sortable table headers. Mobile uses a compact sort control with the same shared sort model and direction state. The data ordering rules are therefore identical across layouts.

### Opportunity Universe

Opportunity tables use **Framework Target** terminology and show whether a candidate is **Already held** or **Not currently held**. This connects the research universe back to the user's portfolio without converting the research view into a buy/sell recommendation.

### Print/PDF

The primary customer print flow includes My Portfolio, Review Areas and Opportunity Universe. It excludes How to Read, controls/guidance, the CTA and My Journey. The legacy Worker PDF endpoint remains a compatibility/fallback delivery surface and now uses the same Framework Target terminology and coverage language.

### Journal reliability

The Journal is generated from `_posts/` into `web/public/blog/`. A single Worker deployment now builds Journal + strategy contract, runs regression/cohesion checks, and deploys the Worker and static assets together. `scripts/check_web_cohesion.py` verifies that every source post has a generated article, every Journal index article link resolves to a generated asset, sitemap entries exist, and key Web semantic contracts remain present.

A post-deployment smoke test checks the Worker root, Journal index, RSS, sitemap, health endpoint and every generated Journal article URL.

### Static asset performance

`wrangler.jsonc` now runs the Worker first only for `/api/*`. Static Web/Journal assets can be served directly by Workers Static Assets rather than invoking Worker code for every asset request. This matches Cloudflare's documented asset-first model and reduces unnecessary Worker execution.

### Tests added/maintained

- Python regression suite.
- Cloudflare engine smoke/parity suite.
- 118-row → 86-holding normalization fixture.
- Python → Web snapshot parity fixture.
- FTT strategy precedence regression including BTT.
- Strong rotation threshold regression.
- Below-cost-basis thesis-state regression.
- Missing-framework-target regression.
- PDF terminology/content regression.
- Mobile sorting source contract regression.
- Review-bar semantic regression.
- Generated Journal/link/sitemap cohesion checks.

Do not add another customer-facing metric, visual encoding or action label without first defining its meaning, source, valid conditions, customer label and visual treatment.
