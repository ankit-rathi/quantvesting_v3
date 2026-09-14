# Quantvesting v3 — Continuation Context / Handoff

**Purpose:** This file is the continuation handoff for Quantvesting v3. Keep it in the repository beside `README.md` so a new ChatGPT account/session can continue development without reconstructing project history.

**Last updated:** 2026-09-13

**Current repository baseline:** 2026-09-13 Review Areas / Conviction-Rank refinement built from `quantvesting_v3_coherent_unheld_rotation_2026-09-12.zip`, with notebook ↔ Web synchronization and regression coverage. This is now the baseline for further work.

**Methodology source of truth:** The active customer-facing Jupyter notebooks define the current methodology/workflow and customer concepts; the Python engine is the calculation implementation they orchestrate, and the Cloudflare Web engine must mirror the same methodology, configuration and terminology. This document captures the current architecture, decisions, terminology, implemented features, validation status, and roadmap.

---

## 1. Project goal

Quantvesting v3 is a quantitative portfolio/decision-support platform with two independent execution paths:

1. **Jupyter / Colab / Python**
   - Research, analysis, development and validation.
   - Customer-facing notebooks are part of the product journey.
   - Current live Python technical ingestion uses `yfinance` behind a provider abstraction.

2. **Cloudflare-native Web App**
   - Customer-facing assessment experience.
   - Must not depend on a Jupyter notebook being open or running.
   - Uses the same portfolio, market-snapshot and methodology contracts as the Python path.

### Core architectural contract

> Same portfolio + same market snapshot + same configuration => equivalent Python and Cloudflare assessment outputs.

The environments may differ, but market-data semantics and business logic must not silently diverge.

---

## 2. Current product status

The current repository contains:

- Python Quantvesting engine.
- Active customer notebooks.
- Historical notebook archive.
- Cloudflare-native Web assessment flow.
- Cloudflare Worker background processing.
- Durable Object job coordination.
- R2-backed market-data snapshot support and job/result processing state.
- Canonical market snapshot support.
- Python ↔ Web parity fixtures.
- Customer-facing terminology synchronization.
- Centralized compliance/customer-language wording.
- On-demand Web assessment PDF delivery; guest users are not given persistent public report links.
- Consolidated project documentation.

### Deliberately not implemented

- WhatsApp integration.
- WhatsApp Business/API dependency.
- Payments.
- Broker integration.
- Mobile app.
- WhatsApp chatbot or conversational product.
- Large CRM.
- Jupyter as a production customer runtime dependency.

---

## 3. Current customer journey

The active notebook journey is:

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

The Web assessment intentionally does not expose My Journey. The underlying journey data/API and notebook methodology remain intact.

Onboarding is the Web upload flow. The assessment tabs are presentation layers over the existing engine/data contracts.

Customer-facing Web copy must not expose implementation details such as Jupyter, Cloudflare, raw snapshot IDs, provider names, or ISO timestamps. Market-data freshness is presented as a human-readable date/time in IST.


---

### 3A. Latest Review Areas refinement — 2026-09-13

The current Review Areas refinement keeps the active notebooks as the methodology/workflow reference and adds explicit, configurable attention rules without changing ranking, FTT, thesis-capture or capital-rotation math.

Implemented rules:

1. **Near FTT:** Core holdings only, with current value + active FTT, remaining FTT upside between 0% and the configured maximum (currently 10%). Legacy holdings with an FTT reference are not promoted into Near FTT.
2. **Conviction / Rank Review:** Core holdings only, surfaced when the existing Conviction level is configured as `M` or `L`, or `CumlRnk` is above the configured threshold (currently 100). Conviction remains the source of truth; it encodes quality + market-cap bucket such as `X-LC`, `H-MC` and `L-SC`. No separate Business Quality methodology is introduced.
3. **Top-three presentation:** Web spotlights the top three in each review group; the notebook engine retains the full candidate sets for debugging and validation.
4. **Active evidence consistency:** Web/PDF full review evidence now reflects the actual active Review Areas, while Legacy holdings remain a separate context section. This removes the contradiction where the attention queue could report active situations while full evidence said no active review conditions.
5. **Attention Map:** Remaining FTT upside is treated as the horizontal context; it is the direct Near FTT metric, while Conviction / Rank is triggered by Conviction/CumlRnk. The map remains a visual prioritisation aid, not a decision rule.

The shared thresholds live in `config/strategy.yaml` under `review_areas` and are emitted to `web/engine/strategy.js` by `scripts/build_strategy_contract.py`.
### 3C. Visual storytelling pass — 2026-09-11

The latest pass preserves the existing product architecture and analytical contracts while improving the visual narrative. The guiding sequence is now **See the shape of capital → Understand what deserves attention → Know where to research next**, with a reusable storytelling grammar of **Finding → Meaning → Evidence → Question → Context**.

Customer-facing changes:
- Homepage hero promise now reads: **See what you own. Understand what deserves attention. Know where to research next.**
- Assessment At a Glance now includes a **Start Here** block with up to three prioritised situations from the Attention Queue. Each card shows the situation reason and capital at stake and links into Review Areas.
- Portfolio KPI now says **Portfolio Value*** and the snapshot note explains that the figure is the currently valued Quantvesting-covered portion when coverage is incomplete.
- Allocation visual now leads with a stacked **Core / Legacy / Outside universe** capital-alignment bar and explicit legend.
- Review Areas cards now show **Capital at stake** as evidence.
- Review Areas can show an **Attention Map** when at least two surfaced situations have usable current value and remaining FTT upside. It is a visual prioritisation aid, not a decision rule.
- Homepage Opportunity Universe preview now uses three research cards, with rank, conviction/category, portfolio status and framework upside; the underlying shortlist table is progressively disclosed.
- Opportunity Universe explanation now explicitly frames the output as a **research shortlist** that reduces search cost rather than making the investment decision.
- Mobile and print inherit the same storytelling blocks from the existing DOM/CSS path.

Deliberately not added: portfolio score, trading-terminal charts, buy/sell recommendations, excessive metrics, or new customer-facing tabs.

### 3B. Holistic cohesion pass — 2026-09-11

The next review found several cross-layer mismatches. The repository now addresses them as one cohesion pass rather than as isolated UI tweaks:

1. **Canonical strategy contract:** `config/strategy.yaml` is the strategy source of truth; `scripts/build_strategy_contract.py` generates `web/engine/strategy.js`. Web FTT precedence is now NTT → Target, BTT → Target, other strategies → Max, and no current prospect/framework record → no FTT.
2. **Thesis progress semantics:** Python and Web do not present negative thesis-capture percentages as meaningful progress. Below-cost positions use `BELOW_COST_BASIS`; missing/invalid inputs use `NOT_MEASURABLE`. Strong review now respects the configured 0.90 threshold.
3. **Coverage transparency:** terminal output includes current-price and Framework Target coverage counts/percentages plus valuation/deployed/allocation basis labels.
4. **Review Areas:** active attention situations are separated from Legacy classification; the Attention Queue no longer counts every Legacy holding as an active situation. Near FTT uses a configured remaining-upside cutoff and no generic bar. Conviction / Rank Review uses the existing Conviction taxonomy plus CumlRnk, with no separate Business Quality methodology. Group questions appear once; cards show evidence.
5. **Responsive parity:** mobile holdings now has a sort control backed by the same sort model/direction used by the desktop table.
6. **Opportunity storytelling:** customer-facing tables use Framework Target terminology and show Already held / Not currently held.
7. **Print/PDF:** the customer-facing print report remains My Portfolio + Review Areas + Opportunity Universe; the compatibility Worker PDF endpoint now uses Framework Target terminology and coverage information and no longer includes My Journey.
8. **Journal deployment:** Journal generation is now part of the single Worker deployment lifecycle. `scripts/check_web_cohesion.py` validates all generated article assets, index links and sitemap entries. A post-deploy smoke test checks every Journal article URL.
9. **Cloudflare asset routing:** `wrangler.jsonc` runs Worker code first only for `/api/*`; static Web/Journal assets can be served asset-first.
10. **Regression coverage:** Python tests, Cloudflare parity/smoke, semantic edge cases, PDF/UI contracts and Journal/link cohesion checks are all part of the maintained validation surface.

The full review evidence list, notebook methodology, registered-user persistence model, guest processing model, market snapshot architecture and existing customer features remain intact.


## 4. Repository structure

Current active structure:

```text
quantvesting_v3/
├── README.md
├── CONTEXT_HANDOFF.md
├── docs/
│   └── QUANTVESTING.md
├── config/
├── data/
├── market_data/
├── portfolio_data/
├── portfolio_template/
├── src/
│   └── quantvesting/
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
│   ├── parity/
│   └── cloudflare/
├── web/
│   ├── engine/
│   ├── public/
│   │   └── market_data/
│   └── worker.js
├── package.json
├── requirements.txt
└── wrangler.jsonc
```

### Documentation cleanup

The previous repository contained many phase-specific Markdown files. These were consolidated so the active documentation is intentionally small:

- `README.md` — concise entry point and quick start.
- `docs/QUANTVESTING.md` — consolidated active architecture, terminology, compliance, feature status and roadmap.
- `CONTEXT_HANDOFF.md` — continuation context specifically for future ChatGPT/account hand-off.

Historical notebooks remain under `notebooks/archive/` because they can be useful for reference. Generated caches such as `.pytest_cache`, `__pycache__` and `.pyc` files are not part of the cleaned repository.

---

## 5. Architectural principles to preserve

> **Notebooks orchestrate. Engine calculates. Repositories persist. Reporting presents. Web presents the same methodology through a Cloudflare-native execution path.**

> **Do not solve Python-vs-Cloudflare parity by duplicating more business logic. Solve it with shared contracts, data, semantics, configuration and deterministic fixtures.**

> **Do not make Jupyter a production customer dependency.**

> **Do not silently present periodic market snapshots as real-time or tick-level data.**

> **Do not expose internal engine action codes as customer-facing trading instructions.**

> **A disclaimer is not a legal certification of SEBI compliance.**

---

## 6. Python ↔ Web synchronization requirements

Python/Jupyter and Web must stay synchronized in all customer-visible concepts and important methodology semantics.

Shared requirements include:

- Portfolio aggregation by `Symbol`.
- Weighted-average cost semantics.
- Market snapshot semantics.
- FTT semantics.
- Customer-facing terminology.
- Disclosure wording.
- Portfolio category labels.
- Review-label meanings.
- Parity fixtures.
- Assessment provenance concepts.

The Web PDF is a presentation/delivery feature. It must not become a second independent calculation engine.

Active notebooks should explain the same customer concepts as the Web UI, but must not become dependent on Web implementation details.

---

## 7. Portfolio aggregation contract

Economic aggregation is by `Symbol`, not by input/account row.

Python behavior:

- `build_portfolio_membership()` combines accounts by Symbol.
- Shares are summed.
- Investment is aggregated.
- AvgCost is a weighted average.
- Output is one security-level row per Symbol.

Cloudflare behavior:

```text
Shares = sum(Shares)
AvgCost = sum(Shares * AvgCost) / sum(Shares)
```

AvgCost is rounded to two decimals.

Account membership is retained as a combined value such as `DM+SV`.

The exact Ankit parity fixture remains:

```text
118 input rows → 86 security-level holdings
```

Representative expected holdings include:

```text
ABBOTINDIA  -> 6 shares, ₹29,809.17, DM+SV
ALKYLAMINE  -> 43 shares, ₹2,347.98, DM+SV
ATULAUTO    -> 340 shares, ₹579.80, DM+SV
AWL         -> 1,227 shares, ₹290.39, DM+SV
BANDHANBNK  -> 1,340 shares, ₹207.88, DM+SV
```

Do not revert this aggregation behavior.

---

## 7A. Assessment delivery

The current guest Web flow does not create or expose a persistent public report URL. After an assessment completes, the Web UI offers **Print / Save Assessment PDF**.

The assessment report is presented as a print-ready view built from the same Web UI DOM and CSS. It is not stored as a public report artifact. The print view includes the customer-facing report tabs sequentially — My Portfolio, Review Areas and Opportunity Universe — while intentionally excluding How to Read, guidance/controls and the post-assessment CTA. Browser-native Print / Save as PDF is used so fonts, spacing, tables, cards and customer-facing formatting stay as close as possible to the Web UI.

The existing job/result persistence remains necessary for background processing and browser recovery. The protected registered-user assessment workflow remains intact.

The primary implementation lives in `web/public/app.js` and `web/public/styles.css`, using a hidden print iframe and the existing assessment DOM. The legacy Worker endpoint `web/worker.js` (`/api/jobs/<id>/pdf`) remains available as a compatibility/fallback API surface, but the primary customer button no longer fetches that endpoint. PDF/print presentation is a delivery layer only; it does not calculate an independent assessment.

## 8. Market-data architecture

Intended architecture:

```text
Market Data Provider
       ↓
Canonical Market Snapshot
       ↓
R2
   ↙       ↘
Python    Cloudflare
/Jupyter    Worker
   ↓          ↓
Quantvesting Engine
       ↓
Consistent assessment
```

Current provider abstraction:

```text
MarketDataProvider
      ├── YFinanceProvider       ← current beta/personal ingestion
      └── LicensedProvider       ← future production provider
```

Do not put `yfinance` directly into the customer-facing Cloudflare Worker.

### Canonical snapshot

`src/quantvesting/market_snapshot.py` defines the canonical snapshot contract.

Metadata includes concepts such as:

- `snapshot_id`
- `as_of`
- source
- schema/version
- file hashes
- row counts
- canonical/derived roles

Established market-data files include:

```text
myScreenerDB.csv
myProspectsScrips.csv
myProspects-Momentum.csv
```

Optional derived snapshot files include:

```text
technical.csv
relative_strength.csv
```

Snapshot generation:

```bash
python scripts/refresh_market_snapshot.py
```

Packaging/smoke mode without derived data:

```bash
python scripts/refresh_market_snapshot.py --no-derived
```

Publishing is performed by:

```bash
python scripts/publish_market_snapshot.py
```

Historical snapshots are useful for debugging, reproducibility, parity testing, auditing, rollback and explaining assessment changes.

---

## 9. Market-data parity limitation

Canonical snapshot infrastructure is implemented and the Web engine consumes canonical snapshot data.

However, do not claim complete live technical parity for every historical yfinance-derived calculation unless explicit tests prove it.

The desired contract remains:

```text
same portfolio
+
same canonical snapshot
+
same configuration
+
same calculation semantics
=
Python output
≈
Cloudflare output
```

Continue expanding deterministic fixed-snapshot parity tests rather than blindly duplicating calculations.

---

## 10. FTT semantics

Current semantics:

- Strategy `NTT`: `FTT = Target`.
- Strategies `ATH` / `BTT`: `FTT = historical Max`.

Cloudflare snapshot logic includes `CMP` and `ATH%` and derives historical Max where needed as:

```text
maxFromSnapshot = CMP / (1 - ATH% / 100)
```

Target/rotation calculations use FTT rather than always using Target.

`buildHoldings()` includes `ftt` and `strategy`.

`assessPortfolio()` target-value calculations use FTT × shares.

`EXIT_TARGET` compares current CMP against FTT.

Do not change these semantics without updating both paths and parity tests.

---

## 11. Customer-facing terminology — canonical

Use these exact labels across Web UI, active notebooks and customer-facing documentation:

| Internal engine output | Customer-facing label |
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

Never use internal enums or legacy terminology as primary customer-facing labels.

---

## 12. Portfolio Health vs allocation

These are different concepts.

- **Portfolio Health** describes how a portfolio/holding currently meets the framework's health conditions.
- **Portfolio allocation** describes how much portfolio value is represented by a holding/category.

A holding can therefore have strong health while having a large or small allocation.

Do not imply that allocation size and health are the same measure.

---

## 13. How to Read layer

The Web assessment includes a supplemental education layer called **How to Read**.

It explains how to understand the assessment sections, the two Review Areas groups, the three frequently used analytical lenses, and the customer-facing review labels. Portfolio-upload preparation remains a separate homepage tab, **How to Prepare & Upload**.

It covers:

- My Portfolio, Review Areas and Opportunity Universe
- Near FTT and Conviction / Rank Review
- Fundamentals, Valuation and Technicals as the frequently used lenses
- Portfolio Health vs allocation
- Review candidate, Target reached — review, Legacy holding — review, Rotation review, Strong rotation review and No current review
- Core Holdings, Legacy Holdings and Outside Quantvesting Universe

The main UI should remain understandable without requiring the user to open this guide.

---

## 14. Compliance/customer language

The canonical customer disclosure is:

> Quantvesting is not a SEBI-registered Investment Adviser. The information and assessment outputs are provided for educational and informational purposes only and are based on a rules-based analytical framework and data available at the stated time. They are not investment advice or a recommendation to buy, sell or hold any security. Quantvesting does not execute trades or manage client funds. Please make independent investment decisions and consider consulting a SEBI-registered Investment Adviser where appropriate. Market data and analytical inputs may be delayed, incomplete or subject to error. Any historical performance or scenario figures are not indicative of future results.

This is conservative product language, not a legal opinion or certification of SEBI compliance.

Python source of customer-language logic:

```text
src/quantvesting/compliance.py
```

Web source:

```text
web/engine/compliance.js
```

Keep disclosure visible wherever customer-facing assessment output is presented.

---

## 15. Current authentication/beta state

The beta remains guest-based for the customer Web journey.

The repository still contains backend email/auth endpoints for future use, but the customer UI does not currently require email authentication for the guest assessment path.

Do not reintroduce customer email/auth UI unless explicitly requested.

Jupyter is not a customer runtime dependency.

---

## 16. Cloudflare architecture

Important components:

- Cloudflare Worker.
- Durable Object: `JobCoordinator`.
- R2 binding: `QUANTVESTING_DATA`.
- Static assets binding: `ASSETS`.
- Canonical market-data snapshot.
- Cloudflare-native background assessment processing.

Important Worker responsibilities include:

```text
POST /api/guest/assessments
POST /api/assessments
GET  /api/jobs/:id
GET  /api/jobs/:id/pdf
GET  /api/portfolio
GET  /api/decisions
GET  /api/opportunities
GET  /api/journey
```

Administrative job/market-data APIs remain protected by the admin token.

---

## 17. Assessment PDF delivery — CURRENTLY IMPLEMENTED

The guest Web flow does not create or expose a persistent public report URL. Once an assessment is complete, the UI provides **Print / Save Assessment PDF**.

### Primary flow

```text
Web portfolio upload
        ↓
Cloudflare assessment processing
        ↓
Completed assessment result
        ↓
Render the existing Web assessment DOM
        ↓
Reveal all report tabs sequentially for print
        ↓
Browser-native Print / Save as PDF
```

The primary print implementation is in:

```text
web/public/app.js
web/public/styles.css
```

A hidden iframe receives a print-only copy of `#resultView`. The copy removes the interactive tab navigation, report controls, errors, CTA and the How to Read tab, then makes the customer-facing assessment report panels visible in sequence. The iframe loads the same `/styles.css` used by the Web UI, with A4 print rules for typography, tables, spacing, page breaks and print colors.

The Worker endpoint remains:

```text
GET /api/jobs/<id>/pdf
```

It is retained for compatibility/fallback and still returns an on-demand `application/pdf`. The primary Web button does not call this endpoint because the legacy text-only generator cannot reproduce the Web UI presentation closely enough.

### Important properties

- No public guest report token is generated for new assessments.
- No guest `/report/<token>` browser route is exposed by the Worker.
- No guest `/api/reports/<token>` API is exposed by the Worker.
- Existing job/result persistence remains intact so background processing and browser recovery continue to work.
- The protected registered-user assessment path and its saved portfolio/journey behavior remain intact.
- Print/PDF generation is presentation/delivery only; it does not calculate an independent assessment.
- Customer-facing print/PDF terminology follows the same labels used by the Web UI and active notebooks.
- The print view includes My Portfolio, Review Areas and Opportunity Universe sequentially and excludes How to Read, controls/guidance and the CTA.
- Technical provenance remains in the assessment result, while the Web UI presents market-data freshness as a human-readable IST date/time.

### PDF contents

The generated assessment PDF includes:

- portfolio summary
- market-data update date/time and status
- current market-value and Framework Target coverage
- allocation and concentration
- holdings
- review areas
- capital-rotation review
- opportunity universe
- disclosure

It intentionally excludes My Journey, How to Read, controls/guidance and the post-assessment CTA.

## 18. Jupyter ↔ Web synchronization

The active notebooks remain independent and continue to run the Python engine directly. They do not depend on the Web PDF implementation.

The notebooks and Web UI must continue to use the same customer-facing labels, disclosure language, portfolio aggregation rules, FTT semantics and market-snapshot semantics.

The Web PDF is another presentation/delivery representation of the same assessment result, not a second calculation engine.

Current active notebooks:

```text
notebooks/00_START_HERE.ipynb
notebooks/01_ONBOARD_MY_PORTFOLIO.ipynb
notebooks/02_MY_PORTFOLIO.ipynb
notebooks/03_MY_DECISIONS.ipynb
notebooks/04_QUANTVESTING_OPPORTUNITIES.ipynb
notebooks/05_MY_QUANTVESTING_JOURNEY.ipynb
```

Historical notebooks under `notebooks/archive/` are not part of the current customer workflow.

## 19. Assessment provenance/freshness

The Web UI should make market-data freshness visible rather than implying real-time data.

Relevant provenance metadata includes:

- snapshot ID
- `as_of`
- source
- freshness/data-quality status
- strategy version
- engine version where useful

Preferred presentation concept:

```text
Market data
<timestamp>

Source
<source>

Snapshot
<snapshot_id>

Status
Fresh / Previous validated snapshot
```

Do not call periodic snapshots tick-level real-time data.

---

## 20. Tests and validation baseline

Run from repository root:

```bash
PYTHONPATH=src python -m pytest -q tests
npm run check:worker
npm run test:cloudflare
```

The current guest-PDF-delivery baseline has been validated with:

```text
Python tests:       45 passed, 3 warnings
Worker checks:      PASS
Cloudflare smoke:   PASS
Ankit parity:       118 rows → 86 holdings
Python/Web parity:  PASS
PDF endpoint contract: PASS
```

The three Python warnings are existing non-fatal data-validation warnings.

Do not claim a future change is complete until the relevant tests actually pass.

---

## 21. Existing parity fixtures

Current fixtures include:

```text
tests/parity/ankit_expected_portfolio.json
tests/parity/multi_account_portfolio.csv
tests/parity/expected_multi_account.json
tests/parity/python_web_parity_fixture.json
```

Do not remove or weaken these fixtures during cleanup.

Important checks include:

- multi-account aggregation
- exact Ankit normalization
- 118 → 86 holding conversion
- market-snapshot parity
- portfolio value
- deployed value
- target value
- holding-level parity fields
- customer-facing disclosure presence

---

## 22. Current scripts

Market snapshot refresh:

```bash
python scripts/refresh_market_snapshot.py
```

No-derived packaging/smoke mode:

```bash
python scripts/refresh_market_snapshot.py --no-derived
```

Market snapshot publishing:

```bash
python scripts/publish_market_snapshot.py
```

---

## 23. Current repository cleanup policy

The repository intentionally no longer keeps a large collection of historical phase Markdown files as active documentation.

When future development creates a new Markdown document, first ask:

1. Is this an enduring part of the product architecture?
2. Is it an implementation-specific temporary note?
3. Is it historical information already represented elsewhere?
4. Does it belong in `README.md`, `docs/QUANTVESTING.md`, or this handoff?

Prefer consolidation over creating another permanent phase document.

Do not delete useful source code, tests, active notebooks, portfolio fixtures or operational scripts merely to make the repository look smaller.

---

## 24. Roadmap

### Current next priorities

1. Continue fixed-snapshot Python ↔ Web parity coverage.
2. Continue assessment provenance/freshness visibility.
3. Harden market snapshot validation and stale-snapshot handling.
4. Improve operational deployment/monitoring without changing methodology.
5. Keep PDF delivery and Web/notebook presentation synchronized before adding communication channels.

### Deferred: WhatsApp

**WhatsApp is intentionally not implemented in the current repository.**

The current product does not depend on WhatsApp Business, WhatsApp Business Platform, or any WhatsApp API.

When it becomes appropriate, preserve this architecture:

```text
Quantvesting assessment
        ↓
Assessment artifact generated from result
        ↓
Optional communication channel
        ↓
WhatsApp provider/API
```

The assessment result must remain independently persisted for recovery and registered-user workflows. A future assessment artifact/PDF may be generated from that result, but WhatsApp must remain only a delivery/communication channel.

If/when WhatsApp is implemented, use separate consent concepts for:

1. **Assessment/report delivery** — permission to send the assessment PDF/artifact to the supplied mobile number.
2. **Weekend Quantvesting broadcast** — separate optional consent for recurring educational/update messages.

Do not combine those consents.

A future contact/consent model should be able to record at least:

- normalized mobile number
- contact status
- consent type
- current granted/revoked state
- consent text/version
- consent source
- granted timestamp
- revoked timestamp

A future report-delivery journey can be:

```text
Assessment complete
      ↓
Generate assessment PDF/artifact
      ↓
Optional "Get your report on WhatsApp"
      ↓
Mobile number
      ↓
Explicit report-delivery consent
      ↓
WhatsApp provider/API
      ↓
Assessment artifact delivered
```

Weekend broadcast should be a separate process:

```text
Scheduled weekend job
      ↓
D1 contacts with active broadcast consent
      ↓
Approved message/template
      ↓
WhatsApp provider/API
      ↓
Delivery log
```

Revoked/unsubscribed contacts must be excluded.

Do not put mobile numbers in report URLs.

Do not store the report inside WhatsApp.

Do not make WhatsApp a prerequisite for using Quantvesting.

Do not build a WhatsApp chatbot as part of the first WhatsApp implementation.

The earlier preferred architecture remains conceptually:

```text
Cloudflare Worker
      ↓
D1 contacts + consent
      ↓
WhatsApp provider/API
```

The exact provider and current Meta requirements should be evaluated only when implementation is actually planned.

---

## 25. Future production market-data direction

Eventually replace:

```text
YFinanceProvider
```

with a properly licensed market-data provider suitable for a commercial product.

Target architecture:

```text
                 MarketDataProvider
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       YFinanceProvider     LicensedProvider
           (beta)             (production)
              │                   │
              └─────────┬─────────┘
                        ▼
                 MarketSnapshot
                        ▼
                       R2
                        ▼
               Python + Cloudflare
```

The provider abstraction exists specifically to make this transition possible without coupling the business logic to yfinance.

---

## 26. Things not to revert

Do not revert:

- Portfolio aggregation by Symbol.
- Weighted AvgCost semantics.
- 118 → 86 Ankit parity.
- Guest beta behavior unless explicitly requested.
- Customer-facing terminology synchronization.
- Centralized disclosure wording.
- Canonical market snapshot architecture.
- Python provider abstraction.
- Cloudflare-native assessment processing.
- On-demand assessment PDF delivery.
- No public guest report-token design.
- Jupyter independence.
- Historical notebook archive separation.
- Existing parity fixtures.

Do not reintroduce:

```text
Core Allocation
Legacy Allocation
Out of Universe
NO_ACTIVE_REVIEW
LEGACY_REVIEW
BUY_CANDIDATE
```

as primary customer-facing labels.

---

## 27. How a new ChatGPT session should continue

When starting from another account/session:

1. Open `README.md`.
2. Open `CONTEXT_HANDOFF.md`.
3. Open `docs/QUANTVESTING.md` for the consolidated active project documentation.
4. Treat the repository implementation as the source of truth if this handoff and code appear inconsistent.
5. Run the regression suite before modifying anything:

```bash
PYTHONPATH=src python -m pytest -q tests
npm run check:worker
npm run test:cloudflare
```

6. Inspect the actual current implementation before proposing changes.
7. Preserve Python ↔ Web parity.
8. Preserve active notebook ↔ Web customer-language synchronization.
9. Update `docs/QUANTVESTING.md` when an enduring architecture/product decision changes.
10. Update this `CONTEXT_HANDOFF.md` whenever a meaningful feature or architecture change is completed so the next session has an accurate continuation point.

### Recommended continuation prompt

A future session can be started with:

```text
Use README.md and CONTEXT_HANDOFF.md as the continuation context for Quantvesting v3.
Treat the repository implementation as the source of truth.
Before changing anything, inspect the relevant current code and run the existing tests.
Preserve Python/Jupyter ↔ Cloudflare Web parity and the canonical customer-facing terminology/disclosure. Keep Web and PDF presentation synchronized with active notebook concepts without exposing notebook/runtime implementation details to Web users.
Do not implement deferred WhatsApp functionality unless explicitly requested.
```

---

## 27A. Notebook ↔ Web Review Areas synchronization — 2026-09-13

The active notebooks are now explicitly wired to the same Review Area rules used by the Web assessment. `03_MY_DECISIONS.ipynb` calls `qv.review_areas()` from the Python engine and displays:

- Near FTT
- Conviction / Rank Review
- Active Review Evidence

The Web engine mirrors those rules from the generated strategy contract. The Python function returns full candidate sets (`near_ftt_all`, `conviction_rank_all`) while the customer Web presentation limits the spotlight to three per group. This is a presentation limit, not a methodology limit.

The active notebooks were also corrected to avoid treating Conviction as a separate Business Quality field. Conviction itself encodes the quality/cap bucket.

The current guest Web flow is independently executable and supports local Print / Save PDF; customer-facing notebook text no longer claims that a guest report is persisted behind a public report link.

### Regression coverage added

Tests cover:

- Near FTT cutoff at 10%;
- holdings above the cutoff not being surfaced;
- Legacy holdings not entering Near FTT;
- `M` Conviction surfacing even when rank is below 100;
- rank >100 independently surfacing a Core holding;
- full evidence retaining all eligible candidates while Web spotlights top three;
- Web/Python semantic parity for the new review rules;
- existing FTT, thesis-capture, capital-rotation, portfolio aggregation, PDF, Opportunity Universe and UI contracts.

## 28. Current baseline summary

At the current handoff point, Quantvesting v3 has:

```text
Python/Jupyter engine
        │
        ├── active customer notebooks
        ├── archived historical notebooks
        ├── provider abstraction
        ├── portfolio aggregation
        ├── canonical snapshot support
        └── parity fixtures

Cloudflare Web
        │
        ├── guest assessment
        ├── background processing
        ├── same customer terminology
        ├── same methodology contracts
        └── local print/save assessment artifact

Documentation
        │
        ├── README.md
        ├── docs/QUANTVESTING.md
        └── CONTEXT_HANDOFF.md

Deferred
        │
        └── WhatsApp delivery/broadcast
```

The immediate product focus is **MVP hardening and validation**, not broad platform expansion.

---

## 29. Final design principles

> **Shared data contract + shared configuration + shared fixtures + explicit parity tests + shared customer vocabulary + centralized disclosure.**

> **Persist the assessment independently of any delivery channel; generate guest print/PDF artifacts on demand rather than exposing public report URLs.**

> **Keep WhatsApp optional and separate from the core assessment engine.**

> **Keep Jupyter useful for research/customer workflow, but never make it a production Web dependency.**

> **Do not claim more parity, freshness, regulatory status or product capability than the implementation and tests actually prove.**

---

## 30. Latest holistic presentation + capital rotation refinement — 2026-09-12

The latest repository baseline preserves the existing Quantvesting analytical assessment while making the customer experience more coherent as a **data story rather than a dashboard**.

### Storytelling contract

The assessment journey is:

```text
See the shape of your capital
        ↓
Understand what deserves attention
        ↓
Know where to research next
```

The reusable customer-facing grammar is:

```text
Finding → Meaning → Evidence → Question → Context
```

The **Start Here** area now expresses this more explicitly. Each surfaced situation can show:

- the holding/situation;
- what the framework found;
- why it matters;
- capital at stake; and
- the question worth investigating.

This is presentation logic only. The underlying Attention Queue, Near FTT, Conviction / Rank Review, FTT semantics, ranking and thresholds remain aligned to the active notebook methodology.

### Capital Rotation reference opportunity set

The previous Web/PDF presentation repeated the same best opportunity for every rotation candidate. The implementation now avoids that repetition.

When `N` rotation candidates are surfaced:

1. The Web engine identifies qualifying opportunities meeting the configured minimum alternative-upside threshold.
2. It selects up to `N` of the highest-ranked qualifying opportunities.
3. These are exposed as `alternative_opportunities` on each rotation record.
4. The UI presents the reference opportunities once as a **reference opportunity set**.
5. Each surfaced holding is then described as something whose evidence should be compared with that set.

There is **no forced one-to-one mapping** between rotation candidate and reference opportunity because the current framework does not contain an explicit matching rule that would justify such a claim.

Backward compatibility is preserved through the existing first-reference fields (`alternative_symbol`, `alternative_rank`, `alternative_upside_pct` in Web; the equivalent first-reference columns in Python). Python's `capital_rotation_actions()` additionally exposes `AlternativeSet` containing the full reference set.

The compatibility Worker PDF now follows the same narrative:

```text
Reference opportunities
        ↓
Shared research question
        ↓
Surfaced rotation candidates
```

The browser Print / Save PDF uses the same customer-facing DOM/CSS, so the main assessment PDF and Web assessment remain aligned.

### Additional presentation wording

The latest section questions are:

- **Review Areas:** “What deserves attention first?”
- **Capital Rotation Review:** “Where might currently deployed capital deserve comparison?”
- **Opportunity Universe:** “Where could capital work harder?”

The intent is to make the assessment progressively answer human questions rather than present isolated data blocks.

### What was deliberately not changed

No changes were made to:

- strategy configuration;
- FTT calculation or strategy precedence;
- thesis-progress semantics;
- ranking logic;
- portfolio aggregation;
- review thresholds;
- opportunity-universe ranking/filtering;
- market snapshot architecture;
- disclosures;
- TopMate links;
- Journal/deployment architecture;
- customer-facing action labels;
- existing portfolio/Python/Web parity contracts.

### Current operating phase

The product is now considered sufficiently mature for a **distribution + real-user learning phase**. The next high-ROI objective is not another broad feature set. It is to get real users through the existing assessment, identify the strongest aha moments, understand friction/confusion, test repeat usage and willingness to pay, and make only small evidence-backed product changes.

Recommended operating allocation remains approximately:

```text
40% distribution
30% customer/user experience
20% product improvements
10% infrastructure
```

The central product question is:

> **Can Quantvesting make an investor understand their capital, attention and next research question more clearly than they could before using it?**

A successful user experience should create a natural progression:

```text
“I uploaded my portfolio.”
        ↓
“Quantvesting found something I had not seen.”
        ↓
“It explained why.”
        ↓
“It showed me where to investigate next.”
        ↓
“I want to use this again / share it.”
```

This is the current product/distribution hypothesis, not a claim that the market has already validated it.

## 31. Capital Rotation reference set refined to unheld opportunities — 2026-09-12

Following the latest product review, Capital Rotation Review has been refined to use **unheld qualifying opportunities** as its reference opportunity set.

### Why this is the chosen framework

Capital Rotation is an opportunity-cost question. The user already owns the surfaced rotation candidates, so the most coherent comparison is not another existing holding; it is a strong opportunity the user does **not** currently hold.

The intended narrative is:

```text
Current capital under review
        ↓
Opportunity-cost lens
        ↓
Highest-ranked qualifying unheld opportunities
        ↓
Research question:
Is any of these alternatives a better use of the capital currently under review?
```

This better connects the product journey:

```text
Understand my portfolio
        ↓
Know what deserves attention
        ↓
Know where to research next
```

### Implementation contract

When `N` rotation candidates are surfaced:

- select up to `N` qualifying opportunities;
- exclude every security already held in the user's portfolio;
- retain the existing opportunity ranking/order and configured minimum alternative-upside threshold;
- do not force a one-to-one mapping between candidates and opportunities;
- present the reference set once as shared context for all surfaced comparisons;
- if fewer than `N` qualifying unheld opportunities exist, show only those available rather than padding the set with held securities.

Python `capital_rotation_actions()` now excludes portfolio-held symbols before constructing `AlternativeSet`. The Web engine uses the opportunity record's `held` flag for the same exclusion. Existing first-reference fields remain for backward compatibility; `alternative_opportunities` / `AlternativeSet` remains the canonical presentation set.

### Presentation wording

The Capital Rotation Review remains:

**Where might currently deployed capital deserve comparison?**

The reference opportunity explanation now makes the distinction explicit:

> Highest-ranked qualifying opportunities you do not currently hold, above the configured framework-upside threshold.

The compatibility Worker PDF similarly labels the set as unheld opportunities. The browser Print/Save PDF inherits the same customer-facing Web presentation.

### Regression coverage

Regression tests now verify that when the highest-ranked qualifying opportunities are already held — including the surfaced rotation candidates themselves — they are excluded and the next qualifying unheld opportunities fill the adaptive reference set.

The existing `N-for-N` behavior, no-one-to-one mapping, FTT semantics, ranking, review thresholds, Opportunity Universe, disclosures, TopMate links, deployment architecture, and other product contracts remain unchanged.

### Current operating phase remains unchanged

Quantvesting remains in the **distribution + real-user learning** phase. The current priority is real-user feedback, aha-moment discovery, friction reduction, repeat usage and willingness-to-pay evidence rather than broad feature expansion.

## 32. Review Areas / Conviction-Rank refinement — 2026-09-13

This refinement was implemented from the `quantvesting_v3_coherent_unheld_rotation_2026-09-12.zip` baseline after reviewing the active Jupyter notebooks as the methodology/workflow reference.

### Methodology alignment

- The framework does **not** introduce a separate Business Quality methodology.
- `Conviction` remains the source of truth and encodes quality + market-cap bucket, for example:
  - `X-LC` = Excellent Large Cap
  - `H-MC` = High-quality Mid Cap
  - `L-SC` = Low-quality Small Cap
- The existing Core classification remains driven by the configured six preferred conviction buckets.
- Existing ranking, FTT selection, thesis-capture and capital-rotation calculations were not changed.

### Review Area rules

```text
NEAR FTT
Core holding
+ current value available
+ active FTT available
+ 0% <= remaining FTT upside <= 10%
```

```text
CONVICTION / RANK REVIEW
Core holding
+ (Conviction level M/L OR CumlRnk > 100)
```

The 10% and rank/Conviction thresholds are configuration-driven under `review_areas` in `config/strategy.yaml` and are emitted into the Web strategy contract.

Near FTT is deliberately Core-only. Legacy holdings with an FTT reference are not promoted into Near FTT by proximity alone. Legacy holdings remain visible through the existing Legacy context/action path.

### Notebook ↔ Web implementation

The Python engine now exposes `qv.review_areas()` and `03_MY_DECISIONS.ipynb` uses it directly. This keeps the review candidate sets easy to inspect/debug in Jupyter.

The Web engine mirrors the same rules from generated `web/engine/strategy.js`. Web spotlights the top three per group, while the Python review function retains the full candidate sets for debugging and regression testing.

The Web/PDF review evidence now reflects the actual active Review Areas, eliminating the earlier contradiction where the attention queue could show active situations while the full evidence section said there were no active portfolio review conditions.

### Customer terminology

The customer-facing section is now **Conviction / Rank Review**, not Quality / Rank Review. Cards show the existing Conviction value and framework rank rather than a separate Healthy/Not Healthy quality lens.

Coverage wording now distinguishes:

- current market-value coverage; and
- Framework Target coverage.

The underlying coverage calculations are unchanged.

### Deliberately unchanged

- Opportunity Universe: Top 40 by existing framework rank, then upside >20%.
- Capital Rotation: existing thesis-capture thresholds and unheld reference opportunity set.
- FTT precedence: NTT/BTT → Target; other strategies → Max; no current framework record → no FTT.
- Portfolio aggregation and multi-account normalization.
- Portfolio Health and Core/Legacy/Outside-universe allocation semantics.
- Guest processing, local Print / Save PDF, disclosures, TopMate links, Journal and deployment architecture.

### Validation completed

```text
npm run test:all

Build / cohesion: PASS
Worker syntax:    PASS
Cloudflare smoke: PASS
Python tests:     45 passed, 3 warnings
Python/Web parity: PASS
Ankit fixture:    118 source rows → 86 security-level holdings
Journal cohesion: 15 posts / 17 generated HTML pages
```

The three Python warnings are the existing non-fatal validation warnings for intentionally tolerated data-quality conditions outside the active analysis universe.


## 33. Weekend Quantvestor community CTA + site footer — 2026-09-13

The 2026-09-13 Review Areas / Conviction-Rank repository baseline was refined with a deliberately lightweight community connection layer.

- Weekend Quantvestor WhatsApp community link: `https://chat.whatsapp.com/FemUxDfuvJM1QKPIAtLtxG`
- The CTA uses the existing standard `.button` styling so it is visually identical to other primary buttons in the Web app.
- The CTA appears immediately above the footer on every generated customer-facing Web/Journal HTML page.
- CTA language explains that the community is for following the thinking behind Quantvesting, understanding new assessment features, and sharing feedback.
- Footer is the final body element on every generated customer-facing Web/Journal HTML page and reads: `© 2026 Weekend Quantvestor`.
- The community CTA is optional and does not gate, interrupt, or alter the portfolio assessment flow.
- No portfolio/customer persistence, subscription logic, assessment methodology, ranking, FTT, Review Areas, rotation logic, notebook methodology, or PDF assessment content was changed in this refinement.
- `scripts/build_blog.py` is the source for the generated Journal community CTA/footer markup so regenerated Journal pages remain aligned.
- `scripts/check_web_cohesion.py` regression-checks that every generated HTML page contains the exact community URL, uses the standard button class for the CTA, and ends the body with the footer.

## 34. Disclosure placement refinement — 2026-09-13

- Baseline: `quantvesting_v3_wq_community_footer_2026-09-13.zip`.
- Web customer-facing pages now use the required order: **Join Weekend Quantvestor → IMPORTANT DISCLOSURE → © 2026 Weekend Quantvestor footer**.
- The full supplied disclosure wording is used immediately above the footer; the existing upload-panel short acknowledgement remains unchanged.
- Journal pages follow the same community → disclosure → footer order while retaining their existing Journal footer.
- Assessment PDF now includes the `JOIN WEEKEND QUANTVESTOR` section immediately above `IMPORTANT DISCLOSURE`, followed by the disclosure as the final report content.
- PDF community section includes the supplied WhatsApp community link as text.
- No methodology, assessment logic, strategy, ranking, Review Areas, rotation, portfolio processing, notebook workflow, or unrelated UI behavior was changed.
- Regression checks were extended to verify Web community/disclosure/footer ordering and PDF community/disclosure presence.
## 35. Assessment PDF end-of-report CTA alignment — 2026-09-13

- Baseline: `quantvesting_v3_wq_community_footer_disclosure_2026-09-13.zip`.
- The customer-facing **Print / Save Assessment PDF** now includes the same three end-of-report sections used by the Web assessment:
  1. **Book an In-depth Portfolio Assessment** → `https://topmate.io/weekend_quantvestor/2291781`
  2. **Join Weekend Quantvestor** → `https://chat.whatsapp.com/FemUxDfuvJM1QKPIAtLtxG`
  3. **IMPORTANT DISCLOSURE** → canonical full disclosure wording
- These three sections are appended to the printable assessment after the Opportunity Universe and How-to-Read content is excluded, so they are the final customer-facing report sections.
- The existing Web assessment CTA markup is reused for the print clone rather than duplicating or changing the Web presentation. The existing community and disclosure Web sections are cloned into the print report so wording and links remain aligned.
- The legacy/compatibility Worker PDF builder was also aligned to emit the same three sections in the same order.
- Print CSS only adds break/avoid behavior needed to keep the newly appended community/disclosure blocks coherent; no assessment styling or calculation behavior was otherwise changed.
- PDF regression tests now verify both TopMate and WhatsApp links and the required order: **In-depth Assessment → Join Weekend Quantvestor → IMPORTANT DISCLOSURE**.
- README and `docs/QUANTVESTING.md` were updated only to remove the now-stale statement that the post-assessment CTA is excluded from the print report.
- No Python methodology, assessment calculations, ranking, FTT, Review Areas, capital rotation, portfolio processing, notebook workflow, Web customer flow, Journal content, or footer/disclosure placement was changed.

## 36. TopMate learning + deep-dive journey alignment — 2026-09-13

Baseline: `quantvesting_v3_wq_community_footer_disclosure_pdf_ctas_2026-09-13.zip`.

The Web app and portfolio assessment PDF now expose the four current TopMate offerings as a coherent customer journey, without changing assessment methodology or portfolio-processing behavior.

### TopMate destinations

- **Quantvesting Playbook** → `https://topmate.io/weekend_quantvestor/2297035`
- **Quantvesting Assessment Reading Guide** → `https://topmate.io/weekend_quantvestor/2297243`
- **Quantvesting Framework Deep Dive** → `https://topmate.io/weekend_quantvestor/2291783`
- **Quantvesting Portfolio Assessment Deep Dive** → `https://topmate.io/weekend_quantvestor/2291781`

The Playbook destination was checked directly and is currently presented on TopMate as a free digital product explaining the Quantvesting framework, its funnel, Universe & Ranking, Conviction, FTT, Review Areas, Capital Rotation, Opportunity Universe and Portfolio Assessment. It explicitly positions the material as educational rather than stock-picking or buy/sell calls.

### Web placement

Homepage:
- Existing discovery CTA now points to the **Framework Deep Dive** and uses that clearer label instead of the generic “Book a Discovery Call”.
- A new **LEARN MORE** section presents three natural next steps:
  1. **Quantvesting Playbook** — Read the Playbook
  2. **Assessment Reading Guide** — Read the Guide
  3. **Framework Deep Dive** — Go Deeper
- The section is intentionally positioned after the discovery/deeper-context CTA and before the explanatory About/Upload journey so visitors can learn before uploading if they wish.

After portfolio assessment:
- Existing end-of-assessment CTA has been evolved into **CONTINUE YOUR QUANTVESTING JOURNEY**.
- It now offers:
  1. **Read the Assessment Guide** → free reading companion
  2. **Portfolio Assessment Deep Dive** → paid 1-on-1 discussion
- This preserves the existing placement while making the next step clearer and avoids introducing a new competing assessment CTA.

### Assessment PDF placement

The browser Print / Save Assessment PDF reuses the same `assessment-learning-cta` Web markup and appends it before the existing Weekend Quantvestor community CTA and disclosure.

PDF end-of-report sequence is now:
1. **ASSESSMENT NEXT STEPS**
   - Quantvesting Assessment Reading Guide link
   - Portfolio Assessment Deep Dive link
2. **JOIN WEEKEND QUANTVESTOR**
3. **IMPORTANT DISCLOSURE**

The legacy/compatibility Worker PDF builder mirrors the same next-step destinations and ordering at the text-PDF layer.

The Playbook and Framework Deep Dive remain homepage-oriented because they explain the framework broadly; the post-assessment/PDF next step is deliberately assessment-specific.

### Styling / responsive behavior

- New homepage learning cards use the existing finance-style visual language and standard `.button` treatment.
- Three-card layout collapses to two columns and then one column on smaller screens.
- Assessment next-step actions wrap on smaller widths and become full-width buttons on mobile.
- Print CSS keeps the assessment next-step block coherent and starts it on a new print page where needed.

### Regression / scope control

Only these five existing source files were changed for the implementation plus this handoff document:
- `web/public/index.html`
- `web/public/app.js`
- `web/public/styles.css`
- `web/worker.js`
- `tests/cloudflare/smoke.mjs`
- `CONTEXT_HANDOFF.md`

No Python methodology, ranking, FTT, Review Areas, capital rotation, portfolio aggregation, notebook workflow, data persistence behavior, Journal generation, footer, disclosure wording, or deployment architecture was intentionally changed.

### Validation completed

`npm run test:all` PASS:
- Web cohesion: 17 generated HTML pages / 15 Journal posts
- Worker + Web JS syntax: PASS
- Cloudflare engine/parity: 50 / 50 / 0
- Ankit fixture: 118 input rows → 86 holdings
- Python → Web snapshot parity: PASS
- Review Areas semantic regression: PASS
- Holistic semantic regression: PASS
- Guest PDF print/save view + customer UI regression: PASS
- Web review-comment regression: PASS
- Python tests: 45 passed
- Existing non-fatal data-quality warnings: 3

The final source comparison against the supplied baseline confirms no unrelated source files were changed.

## 37. CTA consolidation + assessment PDF duplication fix — 2026-09-13

Baseline: `quantvesting_v3_topmate_journey_2026-09-13.zip`.

The CTA journey was consolidated after review of all current customer-facing CTA placements before assessment, after assessment, and in the Print / Save Assessment PDF. The change preserves the existing finance-style visual language and does not alter the Quantvesting assessment methodology, portfolio processing, or data/engine behavior.

### Final CTA architecture

The four TopMate offerings retain distinct jobs:

- **Quantvesting Playbook** → understand the framework broadly before assessment: `https://topmate.io/weekend_quantvestor/2297035`
- **Quantvesting Assessment Reading Guide** → understand how to read an assessment: `https://topmate.io/weekend_quantvestor/2297243`
- **Quantvesting Framework Deep Dive** → discuss how the framework works in a 1-on-1 context: `https://topmate.io/weekend_quantvestor/2291783`
- **Quantvesting Portfolio Assessment Deep Dive** → discuss a completed portfolio assessment in context: `https://topmate.io/weekend_quantvestor/2291781`
- **Weekend Quantvestor community** → ongoing connection, learning and feedback: `https://chat.whatsapp.com/FemUxDfuvJM1QKPIAtLtxG`

The resulting journey is intentionally simple:

**Before assessment:** Learn → Understand → Assess

**After assessment:** Understand findings → Discuss → Stay connected

**PDF:** Findings → Next step → Community → Disclosure

### Homepage CTA consolidation

- Removed the standalone **WANT TO KNOW MORE? → Framework Deep Dive** box.
- The previous standalone Framework Deep Dive CTA was redundant because the same offering was already present in the learning section.
- Replaced both with one consolidated **LEARN & GO DEEPER** panel containing exactly three learning/deeper-context options:
  1. Quantvesting Playbook → Read the Playbook
  2. Assessment Reading Guide → Read the Guide
  3. Framework Deep Dive → Go Deeper
- The Assessment Reading Guide remains available on the homepage but is explicitly described as most useful after running an assessment, keeping its visual hierarchy secondary to the primary assessment journey.
- The primary **Assess My Portfolio** action remains unchanged.
- The independent **Explore the Opportunity Universe** experience remains unchanged.
- The Weekend Quantvestor community CTA remains the independent connection layer rather than being mixed into the learning/deep-dive choices.

### After-assessment Web CTA

- Kept exactly one **CONTINUE YOUR QUANTVESTING JOURNEY** panel inside the assessment result.
- It contains only the two assessment-relevant next steps:
  1. Read the Assessment Guide
  2. Portfolio Assessment Deep Dive
- Framework Deep Dive and Playbook are intentionally not repeated after assessment because they are broad framework-learning options rather than the most relevant next step after seeing portfolio-specific findings.
- The separate **STAY CONNECTED → Join Weekend Quantvestor** panel remains after the assessment result, followed by the existing disclosure and footer order.

### Assessment PDF duplication fix

- Fixed the browser Print / Save Assessment PDF builder so it no longer clones and appends the `assessment-learning-cta` a second time.
- The assessment learning CTA already lives inside `resultView`, so cloning `resultView` already includes it once. The previous builder appended another copy, causing the visible duplicate **CONTINUE YOUR QUANTVESTING JOURNEY** box.
- The PDF builder now appends only the separately located community CTA and disclosure after the cloned assessment content.
- Final browser print/save sequence is therefore:
  1. Assessment findings / all report tabs sequentially
  2. One **CONTINUE YOUR QUANTVESTING JOURNEY** panel
  3. **STAY CONNECTED / JOIN WEEKEND QUANTVESTOR**
  4. **IMPORTANT DISCLOSURE**
- The print styling continues to use the existing Web UI DOM, typography, button hierarchy and break rules; no new visual language was introduced.

### Legacy Worker PDF alignment

- Renamed the legacy/compatibility Worker PDF section from `ASSESSMENT NEXT STEPS` to `CONTINUE YOUR QUANTVESTING JOURNEY` so its semantic heading matches the current Web/PDF customer journey.
- It continues to expose only the Assessment Reading Guide and Portfolio Assessment Deep Dive, followed by Weekend Quantvestor and the canonical disclosure.

### Regression / scope control

Only these existing source files were changed for this refinement plus this handoff document:
- `web/public/index.html`
- `web/public/app.js`
- `web/public/styles.css`
- `web/worker.js`
- `tests/cloudflare/smoke.mjs`
- `CONTEXT_HANDOFF.md`

No Python methodology, ranking, FTT, Review Areas, capital rotation, portfolio aggregation, notebook workflow, data persistence behavior, market-data logic, Journal content, footer, disclosure wording, or deployment architecture was intentionally changed.

### Validation completed

`npm run test:all` PASS:
- Web cohesion: 17 generated HTML pages / 15 Journal posts
- Worker + Web JS syntax: PASS
- Cloudflare engine/parity: 50 / 50 / 0
- Ankit portfolio parity fixture: 118 input rows → 86 holdings
- Python → Web snapshot parity: PASS
- Review Areas semantic regression: PASS
- Holistic semantic regression: PASS
- Guest PDF print/save view + customer UI regression: PASS
- Web review-comment regression: PASS
- Python tests: 45 passed
- Existing non-fatal data-quality warnings: 3

Additional CTA-specific regression assertions now verify:
- the homepage contains only one Framework Deep Dive CTA,
- the obsolete `WANT TO KNOW MORE?` standalone CTA is gone,
- the homepage uses the consolidated `LEARN & GO DEEPER` panel,
- the PDF uses `CONTINUE YOUR QUANTVESTING JOURNEY` rather than the legacy heading,
- the PDF next-step section precedes Weekend Quantvestor and the disclosure,
- the duplicate Web-PDF CTA cloning path is absent.

A source comparison against the supplied baseline confirms that only the five intended source files plus `CONTEXT_HANDOFF.md` differ; test-generated caches are excluded from the final package.
