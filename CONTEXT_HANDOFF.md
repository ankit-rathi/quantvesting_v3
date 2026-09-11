# Quantvesting v3 — Continuation Context / Handoff

**Purpose:** This file is the continuation handoff for Quantvesting v3. Keep it in the repository beside `README.md` so a new ChatGPT account/session can continue development without reconstructing project history.

**Last updated:** 2026-09-11

**Current repository baseline:** Holistic cohesion pass applied to the latest 2026-09-11 Review Areas refinement ZIP. This is now the baseline for further work.

**Source of truth:** The repository implementation is the source of truth. This document captures the current architecture, decisions, terminology, implemented features, validation status, and roadmap.

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
- R2-backed market data and assessment persistence.
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

### 3A. Latest Review Areas refinement — 2026-09-11

A screenshot review of the latest customer assessment identified four presentation issues, all fixed without changing the underlying methodology or unrelated features:

1. The customer-facing **REMAINING FTT OPPORTUNITY** card was removed because it duplicated FTT/remaining-upside information already present in the assessment. The existing terminal field remains in the engine for compatibility; it is not rendered as a separate customer-facing section.
2. **Near Target** previously displayed the count of every eligible holding (for example `86`) even though only three cards were shown. This could imply that the whole portfolio was near target. Near Target is now explicitly the **top three** holdings closest to their valid FTT reference, ordered by lowest remaining upside, and the UI badge reads `Top 3`.
3. The repeated card-level questions were removed. The group header states the question once: **“Is the remaining upside sufficient to keep this capital here?”** for Near Target and **“Does this business still deserve capital in the current portfolio?”** for Quality / Rank Review. Individual cards now show evidence only.
4. The malformed literal `Framework target · ${reviewValue(x.ftt)}` was corrected to a real **FTT reference** value.

### 3B. Holistic cohesion pass — 2026-09-11

The next review found several cross-layer mismatches. The repository now addresses them as one cohesion pass rather than as isolated UI tweaks:

1. **Canonical strategy contract:** `config/strategy.yaml` is the strategy source of truth; `scripts/build_strategy_contract.py` generates `web/engine/strategy.js`. Web FTT precedence is now NTT → Target, BTT → Target, other strategies → Max, and no current prospect/framework record → no FTT.
2. **Thesis progress semantics:** Python and Web do not present negative thesis-capture percentages as meaningful progress. Below-cost positions use `BELOW_COST_BASIS`; missing/invalid inputs use `NOT_MEASURABLE`. Strong review now respects the configured 0.90 threshold.
3. **Coverage transparency:** terminal output includes current-price and FTT coverage counts/percentages plus valuation/deployed/allocation basis labels.
4. **Review Areas:** active attention situations are separated from Legacy classification; the Attention Queue no longer counts every Legacy holding as an active situation. Near FTT uses an explicit remaining-upside metric with no generic bar. Quality / Rank Review uses rank/quality evidence with no misleading bar. Group questions appear once; cards show evidence.
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
- Near Target and Quality / Rank Review
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
- current-value and FTT coverage
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
Python tests:       37 passed, 3 warnings
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
        └── persisted assessment snapshot

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
