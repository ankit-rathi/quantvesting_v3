# Quantvesting v3 — Continuation Context / Handoff

**Purpose:** This file is the continuation handoff for Quantvesting v3. Keep it in the repository beside `README.md` so a new ChatGPT account/session can continue development without reconstructing project history.

**Last updated:** 2026-09-08

**Current repository baseline:** `quantvesting_v3_E6_SEBI_sync_labels_cleaned_persisted_reports.zip`

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
- Persisted Web assessment/report links using opaque report tokens.
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

The Web UI exposes the corresponding customer concepts through:

- Assess My Portfolio
- My Portfolio
- Review Areas
- Opportunity Universe
- My Journey
- How to Read

Onboarding is the Web upload flow.

---

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

The Web persisted-report feature is a presentation/delivery feature. It must not become a second independent calculation engine.

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

The Web UI includes a supplemental education layer called **How to Read**.

It explains:

- Review candidate
- Target reached — review
- Legacy holding — review
- Rotation review
- No current review
- Core Holdings
- Legacy Holdings
- Outside Quantvesting Universe

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
GET  /api/reports/:token
GET  /report/:token
GET  /api/portfolio
GET  /api/decisions
GET  /api/opportunities
GET  /api/journey
```

Administrative job/market-data APIs remain protected by the admin token.

---

## 17. Persisted report feature — CURRENTLY IMPLEMENTED

Persisted assessment/report links are now part of the current repository.

### Flow

```text
Web portfolio upload
        ↓
Cloudflare assessment processing
        ↓
Assessment result
        ↓
Generate cryptographically random 256-bit report token
        ↓
Persist report snapshot in R2
        ↓
/report/<opaque-token>
```

The implementation currently uses an opaque 64-character hexadecimal token generated from 32 random bytes.

The Worker stores the persisted report under an assessment/report namespace in R2.

The public report API is:

```text
GET /api/reports/<token>
```

The browser route is:

```text
GET /report/<token>
```

The browser route serves the Web application shell; the Web UI reads the persisted report API and renders the saved assessment.

### Important properties

- The persisted report is independent of the browser session.
- It does not require Jupyter to be running.
- It does not contain a phone number in the URL.
- It does not introduce WhatsApp.
- It does not recalculate the assessment when the report is opened.
- The saved report represents the assessment produced for that run.
- The complete report link behaves like a bearer link: possession of the full URL grants access.
- Therefore the UI explicitly tells users to treat the link as private.

### Report contents

The persisted result contains the assessment information required by the Web presentation layer, including concepts such as:

- portfolio ID
- run ID
- engine version
- strategy version
- terminal assessment
- portfolio assessment
- decisions
- opportunities
- journey
- assessment metadata
- publication timestamp
- report token and creation timestamp

### Current Web UI behavior

After a completed Web assessment, the UI shows a **Persisted Report** section with:

- stable report link
- Copy Link action
- explanation that the report can be revisited later
- privacy warning to treat the link as private

### Design rule

Persisted reports are a delivery/presentation capability, not a second calculation engine.

---

## 18. Jupyter ↔ persisted report synchronization

The active notebooks have been updated to explain that the Web path can persist completed assessments as report snapshots.

The notebooks do not depend on the persisted-report implementation to execute Python analysis.

Current active notebooks:

```text
notebooks/00_START_HERE.ipynb
notebooks/01_ONBOARD_MY_PORTFOLIO.ipynb
notebooks/02_MY_PORTFOLIO.ipynb
notebooks/03_MY_DECISIONS.ipynb
notebooks/04_QUANTVESTING_OPPORTUNITIES.ipynb
notebooks/05_MY_QUANTVESTING_JOURNEY.ipynb
```

The notebooks and Web UI must continue to use the same customer-facing labels and disclosure language.

Historical notebooks under `notebooks/archive/` are not part of the current customer workflow.

---

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

The current cleaned/persisted-report baseline has been validated with:

```text
Python tests:       37 passed, 3 warnings
Worker checks:      PASS
Cloudflare smoke:   PASS
Ankit parity:       118 rows → 86 holdings
Python/Web parity:  PASS
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
5. Validate persisted report UX and lifecycle before adding communication channels.

### Deferred: WhatsApp

**WhatsApp is intentionally not implemented in the current repository.**

The current product does not depend on WhatsApp Business, WhatsApp Business Platform, or any WhatsApp API.

When it becomes appropriate, preserve this architecture:

```text
Quantvesting assessment
        ↓
Persisted report + opaque URL
        ↓
Optional communication channel
        ↓
WhatsApp provider/API
```

The report must remain the persisted Quantvesting artifact. WhatsApp must remain only a delivery/communication channel.

If/when WhatsApp is implemented, use separate consent concepts for:

1. **Assessment/report delivery** — permission to send the persisted report link to the supplied mobile number.
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
Persist report + opaque URL
      ↓
Optional "Get your report on WhatsApp"
      ↓
Mobile number
      ↓
Explicit report-delivery consent
      ↓
WhatsApp provider/API
      ↓
Report link delivered
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
- Persisted report links.
- Opaque report token design.
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
Preserve Python/Jupyter ↔ Cloudflare Web parity and the canonical customer-facing terminology/disclosure.
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
        ├── persisted assessment snapshot
        └── opaque report URL

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

> **Persist the assessment independently of any delivery channel.**

> **Treat report URLs as private bearer links until a stronger authentication/access-control model is introduced.**

> **Keep WhatsApp optional and separate from the core assessment engine.**

> **Keep Jupyter useful for research/customer workflow, but never make it a production Web dependency.**

> **Do not claim more parity, freshness, regulatory status or product capability than the implementation and tests actually prove.**
