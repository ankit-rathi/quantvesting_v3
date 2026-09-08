# Quantvesting — Project Context, Architecture & Roadmap

**Current baseline:** E6 SEBI/customer-language synchronization repository

This is the consolidated active project document. Historical phase notes, changelogs and setup notes that previously existed as separate Markdown files have been consolidated here so the repository has one active documentation source in addition to `README.md`.

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

The Web UI exposes the same customer concepts through:

- Assess My Portfolio
- My Portfolio
- Review Areas
- Opportunity Universe
- My Journey
- How to Read

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
- `ATH` / `BTT`: FTT = historical Max.
- Cloudflare derives Max from `CMP / (1 - ATH% / 100)` where required by the snapshot contract.

Target and rotation calculations use FTT rather than always using Target.

## 8. Persisted report links — current feature

The Web assessment now persists a report snapshot independently of the browser session.

Flow:

```text
Portfolio CSV
    ↓
Assessment
    ↓
Persisted assessment snapshot
    ↓
Opaque report token
    ↓
/report/<token>
```

The report is stored in R2 under the assessment/report namespace and is rendered through the same Web assessment presentation layer. The URL does not contain the customer's phone number or other contact identifier.

The persisted link is intentionally a bearer-style link: anyone who has the complete link can access that saved assessment. Therefore the UI tells users to treat it as private.

This feature does **not** introduce customer email authentication, WhatsApp, or Jupyter as a runtime dependency.

## 9. Notebook ↔ Web synchronization

The Python and Web paths must continue to share:

- customer-facing terminology
- methodology and FTT semantics
- portfolio aggregation rules
- market snapshot semantics
- disclosure language
- parity fixtures

The Web persisted report is a delivery/presentation feature, not a second calculation engine.

Active notebooks remain independent and continue to run the Python engine directly. The notebooks should explain the same customer concepts and labels as the Web UI rather than reproducing Web-specific implementation details.

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
- persisted assessment/report links

### Next hardening

1. Expand fixed-snapshot Python ↔ Web parity coverage.
2. Continue assessment provenance and freshness visibility.
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

1. **Assessment/report delivery consent** — permission to send the user's persisted report link through WhatsApp.
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
Persist report + opaque URL
      ↓
Optional "Get report on WhatsApp"
      ↓
Mobile number + explicit delivery consent
      ↓
WhatsApp provider
```

The Weekend broadcast should be a separate opt-in and a separate scheduled process. Revoked/unsubscribed contacts must be excluded.

Do not make WhatsApp the storage location for reports. The report remains a Quantvesting persisted artifact; WhatsApp is only a delivery/communication channel.

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
