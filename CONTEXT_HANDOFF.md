# Quantvesting v3 — Continuation Context / Handoff

**Purpose:** This file is the continuation handoff for Quantvesting v3. Keep it in the repository beside `README.md` so a new ChatGPT account/session can continue development without reconstructing project history.

**Last updated:** 2026-09-10

**Current repository baseline:** latest v11 Journal funnel-series repository

**Source of truth:** The repository implementation is the source of truth. This document captures the current architecture, decisions, terminology, implemented features, validation status, and roadmap.

### v11 change note — Journal homepage entry removed + My Journey temporarily removed from customer assessment + weekly Journal framework series + prose rewrite

The latest v11 repository removes the dedicated **Journal** tab from the homepage after UX review. The Journal remains a first-party destination at `/blog/` and the contextual **Explore the Quantvesting Journal** CTA remains inside About Quantvesting. The assessment calculation flow is unchanged; the customer-facing Web assessment exposes only My Portfolio, Review Areas and Opportunity Universe, with How to Read as the educational reference.

The Journal contains fifteen Markdown posts in reverse chronological order, with one post dated each Sunday from 31 May 2026 through 6 September 2026. The sequence starts with the Quantvesting introduction, then covers **Quantvesting Features**, **Portfolio Assessment**, the six-stage research funnel (**Macroeconomics → Industry → Business → Financials → Valuation → Technicals**), **Quantvesting Universe**, **Quantvesting Opportunities**, **Rotation Methodology**, the **Review Before You Act** philosophy, and the **Weekend Quantvestor** clarity philosophy. All fifteen posts have now been rewritten as coherent essays in the user's direct Weekend Quantvestor writing style: simple and plain language, short paragraphs, enough elaboration to make the idea useful, minimal fragmentation, and a clear takeaway. The posts are intended to educate readers to a common working understanding rather than teach each topic in depth. Fundamentals/business/financials, valuation and technicals are recurring lenses, while macro and industry are useful contextual lenses to revisit periodically or when conditions change.

No assessment calculation logic, routing, engine methodology, portfolio data contracts, or Journal publishing behavior was changed. The only customer-facing assessment change remains removal of the My Journey tab/content from the Web report and browser print view; the underlying journey data/API and notebooks remain intact. Generated Journal pages and GitHub Pages redirects are regenerated from the current `_posts/` set. The Journal build removes and recreates `web/public/blog/` on every build, so deleting a Markdown post from `_posts/` also removes its generated Worker article, feed entry and sitemap entry on the next Journal build/deploy. The GitHub Pages redirect build likewise removes and recreates `.github-pages/`, so deleted posts no longer receive redirect pages after deployment.

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

The Web UI exposes the corresponding customer concepts through:

- Assess My Portfolio
- My Portfolio
- Review Areas
- Opportunity Universe
- How to Prepare & Upload (on the upload screen)
- How to Read (alongside the assessment report)

The underlying notebook journey and Web result/API journey data remain intact, but **My Journey is temporarily removed from the customer-facing Web assessment**. It is not shown as an assessment tab, not rendered in the customer-facing report, and not included in the browser Print / Save Assessment PDF. This is intentional until longitudinal assessment history makes the journey view materially useful.

Onboarding is the Web upload flow.

The Web UI has two separate customer guidance tabs. **How to Prepare & Upload** appears with the portfolio upload screen and explains the CSV format and upload process. **How to Read** appears alongside the assessment report and explains what each assessment tab contains, what the labels/jargon mean, and how to interpret the report. These are intentionally separate because they answer different customer questions.

Customer-facing Web copy must not expose implementation details such as Jupyter, Cloudflare, raw snapshot IDs, provider names, or ISO timestamps. Market-data freshness is presented as a human-readable date/time in IST.


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
│   └── build_blog.py
├── _posts/                    # Quantvesting Journal Markdown source
├── .github/workflows/         # GitHub Pages deployment
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

The assessment report is presented as a print-ready view built from the same Web UI DOM and CSS. It is not stored as a public report artifact. The print view includes the customer-facing assessment tabs sequentially — My Portfolio, Review Areas and Opportunity Universe — while intentionally excluding the separate How to Prepare & Upload guidance, the interactive How to Read tab and report controls. The underlying journey result/API data remains intact for future longitudinal use. Browser-native Print / Save as PDF is used so fonts, spacing, tables, cards and customer-facing formatting stay as close as possible to the Web UI.

The existing job/result persistence remains necessary for background processing and browser recovery. The protected registered-user assessment workflow remains intact.

The primary implementation lives in `web/public/app.js` and `web/public/styles.css`, using a hidden print iframe and the existing assessment DOM. The legacy Worker endpoint `web/worker.js` (`/api/jobs/<id>/pdf`) remains available as a compatibility/fallback API surface, but the primary customer button no longer fetches that endpoint. PDF/print presentation is a delivery layer only; it does not calculate an independent assessment.

## 7B. Web UI review-comment updates (September 8, 2026)

The following customer-facing Web UI refinements are now implemented without changing the underlying Quantvesting methodology: 

- **Total holdings:** My Portfolio now shows a `Total Holdings` KPI. The count is the security-level holding count after the existing Symbol aggregation/weighted-average-cost normalization (for example, the known parity fixture remains 118 input rows -> 86 holdings).
- **Per-holding allocation:** Portfolio holdings show `Allocation`, calculated from each holding's current market value divided by the total current value represented by holdings with available current prices.
- **Per-holding profit:** Portfolio holdings show `Profit %` immediately before `Upside`. It is the current profit/loss percentage versus the holding's aggregated average-cost basis (`current value - deployed/invested value`, divided by deployed/invested value). Holdings without current market data show N/A.
- **Holdings sorting:** Every Portfolio Holdings column is sortable in the Web UI. Click a column heading for ascending order; click it again for descending order. This covers Symbol, Accounts, Holding Type, Shares, Avg Cost, Current, Allocation, FTT, Profit %, Upside and Review.
- **CAGR / XIRR in Web UI:** The customer-facing Web assessment no longer displays the CAGR / XIRR KPI because investment-history details are not part of the current upload flow, so this value would otherwise remain N/A. The underlying engine/data contracts and Python/Jupyter methodology remain intact.
- **Review Areas ordering:** Portfolio review actions are ordered by `Remaining upside %`, ascending (lowest remaining upside first), with unavailable values placed last and Symbol used as a tie-breaker. The review cards also retain the Remaining upside evidence.
- **Opportunity Universe filter:** Web opportunity construction now sorts by the existing Quantvesting rank, takes the top 40 ranks, and then keeps only securities with `Upside % > 20`. It no longer truncates to the earlier top-10 display.

These are presentation/filtering changes in the Cloudflare Web assessment path. The existing Python/Jupyter methodology and calculations were not changed. The primary browser Print / Save Assessment PDF uses the Web DOM, so the updated holdings table, review ordering and opportunity universe are reflected in the browser-native print view as well.

## 7C. TopMate beta-service and homepage Opportunity Universe updates (September 9, 2026)

The Web UI now includes the Quantvesting beta user's TopMate profile as an external human-support layer:

- **Homepage Discovery Call:** The upload/home screen includes a secondary `Book a Discovery Call` button linking to `https://topmate.io/weekend_quantvestor`. It is positioned as an optional way to learn how the Quantvesting assessment can help, while `Assess My Portfolio` remains the primary homepage CTA.
- **Post-assessment Portfolio Deep Dive:** Completed assessments include a `Book an In-depth Portfolio Assessment` button linking to the same TopMate profile. It is positioned after the assessment content as the natural next step for users who want help understanding their findings.
- These are plain external links; there is no TopMate API integration or dependency in the Quantvesting assessment engine.
- The browser-native print/save assessment intentionally excludes the post-assessment human-service CTA because it is a Web interaction rather than part of the report artifact.

### Homepage Opportunity Universe

The Opportunity Universe is now also surfaced on the homepage as a **discovery/research feature**, because its contents are not derived from the user's uploaded portfolio. The same Quantvesting opportunity-construction logic is used for both the homepage preview and the assessment report:

```text
Quantvesting market/universe data
        ↓
rank by existing Quantvesting rank
        ↓
top 40
        ↓
Upside > 20%
        ↓
Opportunity Universe
        ├── homepage preview (first 8)
        └── full assessment tab
```

The Web worker exposes a public, read-only `/api/public/opportunities` endpoint for the homepage. It loads the current published market snapshot and calls the canonical `buildOpportunities(data, [])` implementation, so ranking/filtering is not duplicated in browser JavaScript. The endpoint returns opportunity data plus market-data freshness metadata and does not require authentication or portfolio data.

The homepage intentionally shows a **preview** rather than duplicating the full assessment table. It is framed as `Explore the Quantvesting Opportunity Universe`, with the disclosure that it is a rules-based research view and not an investment recommendation.

This creates two homepage discovery paths:

1. **Assess My Portfolio** — understand what Quantvesting says about the user's own portfolio.
2. **Explore the Quantvesting Opportunity Universe** — understand what Quantvesting is currently finding interesting without uploading a portfolio.

The homepage Discovery Call CTA then provides an optional human path for visitors who want to understand Quantvesting before using it.


## 7D. Homepage About tab, unified Web buttons and downloadable sample CSV (September 9, 2026)

The homepage/upload experience was refined without changing the assessment engine or existing assessment behavior:

- **About Quantvesting tab:** The homepage now has an `About Quantvesting` tab alongside `1 · Assess My Portfolio` and `How to Prepare & Upload`. It gives a concise explanation of Quantvesting, what the portfolio assessment evaluates, what users can expect from each assessment section, and the educational/informational positioning.
- **Consistent Web action buttons:** The `.button` component now has a shared minimum height, alignment, typography, spacing and link treatment so button-style anchors and native buttons use the same visual language before and after assessment. The existing primary/secondary distinction remains intentional.
- **Downloadable sample portfolio:** `web/public/myPortfolioStocks.csv` is a small, upload-ready example using the canonical `Symbol, Shares, AvgCost, InPortfolio` structure. The `How to Prepare & Upload` tab now includes a `Download sample myPortfolioStocks.csv` button. Users can download it, replace the sample holdings with their own holdings, save it, and upload it directly.
- The sample remains optional; the Web onboarding still accepts the existing minimum `Symbol, Shares, AvgCost` input and the documented broker/export aliases.
- The sample is served as a static public asset and does not introduce a new API or data dependency.
- The homepage Opportunity Universe and TopMate beta CTAs remain intact.

### Homepage tab structure

```text
Homepage
  ├── 1 · Assess My Portfolio
  ├── About Quantvesting
  └── How to Prepare & Upload

Below the homepage tabs
  ├── Discovery Call CTA
  └── Opportunity Universe preview
```




## 7E. Browser-native PDF page gutters (September 10, 2026)

The browser-native Print / Save Assessment PDF now applies explicit page-safe gutters inside the print document rather than relying only on browser `@page` margins. The print-only layout uses `@page{margin:0}` plus `padding:12mm 10mm 14mm` on `.print-document`, ensuring the assessment content and bordered cards/tables have visible left/right/top/bottom breathing room even when Chrome print settings would otherwise collapse page margins. This is isolated to the print view and does not change the latest Web UI look and feel. The intended A4 print geometry and existing page-break structure are preserved. Regression coverage checks the print gutter contract.

## 7F. Web UI / responsive UX refinement (September 10, 2026)

The Web UI received a visual-hierarchy and responsive-design pass based on the principle of **quiet financial intelligence**: reduce visual competition, preserve analytical depth, and progressively reveal detail rather than compressing every desktop component onto small screens. The assessment engine, data contracts, customer terminology, market-snapshot logic, PDF flow and Python ↔ Web parity are unchanged.

### Homepage hierarchy

- The homepage keeps `Assess My Portfolio` as the primary action.
- `About Quantvesting` and `How to Prepare & Upload` remain supporting tabs.
- The Opportunity Universe remains a discovery feature, but its heading and surrounding treatment are quieter: `Explore the Opportunity Universe`.
- TopMate remains an optional human-support path and is visually secondary to the product journey.
- Cards use restrained borders and whitespace rather than heavy shadows; the homepage is intentionally calmer than the assessment view.

### Assessment hierarchy

- Portfolio KPI hierarchy is stronger: Current Value and Deployed Value receive greater visual emphasis.
- Portfolio Health and concentration remain prominent analytical anchors.
- Review Areas continues to be framed around `What deserves review?`.
- Desktop analytical density is preserved; no underlying columns or data are removed from the desktop holdings table.

### Responsive behavior

- Desktop/tablet retain the full sortable holdings table.
- Narrow mobile layouts replace the 11-column holdings table with compact holding cards showing Symbol, Review status, Current value, Remaining upside, Allocation, Profit, Shares, Avg Cost, FTT and account.
- Assessment action buttons stack cleanly on narrow screens.
- Homepage and assessment tabs remain horizontally usable without shrinking text into unreadable controls.
- Mobile spacing and KPI grids are explicitly adjusted at 700px and 430px breakpoints.

### Button system

The existing `.button` component remains the shared action primitive. v5 reinforces a single control height, typography, focus state and primary/secondary hierarchy across native buttons and external-link CTAs. External human-support actions remain visually secondary.

### Design principles

1. Every major screen should answer one question.
2. Homepage = calm discovery; assessment = structured analytical density.
3. Prefer whitespace and hierarchy over additional cards or decoration.
4. Progressive disclosure is preferred to desktop-table compression on mobile.
5. Preserve all useful analytical detail while making the first screen easier to scan.
6. Quantvesting should feel like quiet financial intelligence rather than a trading terminal or generic fintech dashboard.

### Validation

The v5 change must continue to pass:

```bash
PYTHONPATH=src python -m pytest -q tests
npm run check:worker
npm run test:cloudflare
```

The new UI regression coverage checks the mobile holding-card contract, responsive breakpoints, reduced visual noise and shared button sizing.


## 7G. Quantvesting Journal — current architecture and publishing workflow (September 10, 2026)

A first-party static Journal has been added for education, trust and acquisition without introducing a CMS, database, comments system, customer-account dependency or portfolio-data dependency.

### Customer experience / information architecture

The homepage does **not** have a dedicated Journal tab. The Journal remains a separate `/blog/` destination, with the contextual `Explore the Quantvesting Journal` CTA inside About Quantvesting. The assessment progression is separately numbered: `My Portfolio` → `Review Areas` → `Opportunity Universe`, with `How to Read` as the educational reference. The underlying My Journey methodology/data remains available for future customer-facing longitudinal history, but the current Web assessment does not expose it.

This keeps two user intents distinct:

> **Assessment:** What does the framework see in my portfolio?
>
> **Journal:** How does Quantvesting think about investing?
>
> **How to Read:** How should I understand these concepts?

The Journal uses reverse-chronological essays, desktop topic navigation, responsive mobile topic controls, accessible topic chips, shareable `?topic=` filtering, clean article pages, RSS and sitemap output. `_posts/` currently contains fifteen posts, dated weekly on Sundays from 31 May 2026 through 6 September 2026. The first/oldest post is the Quantvesting introduction, followed by features, portfolio assessment, the six research-funnel stages, universe, opportunities, rotation, review-before-action, and Weekend Quantvestor philosophy.

### Typography parity

The Journal deliberately reuses the Web UI's existing typography and design system: same font family, base sizing, heading hierarchy, palette, spacing conventions and shared button primitives. `web/blog/blog.css` adds only Journal-specific layout and reading styles. Individual article pages load the shared stylesheet from `../../../styles.css`; using `../../styles.css` would resolve to `/blog/styles.css` and cause browser fallback typography.

### Source and public URLs

- Source: `_posts/YYYY-MM-DD-slug.md`
- Build: `scripts/build_blog.py`
- Live Journal: `https://quantvesting-v3.rathi-ankit.workers.dev/blog/`
- GitHub Pages redirect layer: `https://ankit-rathi.github.io/quantvesting_v3/blog/`
- Live article pattern: `https://quantvesting-v3.rathi-ankit.workers.dev/blog/posts/<slug>/`

The filename date is authoritative for ordering. Required front matter is `title`, `excerpt`, and `tags`.

### Markdown-only publishing

`_posts/` is the source of truth. When a new post is pushed to `main`, `.github/workflows/deploy-journal-worker.yml` runs `scripts/build_blog.py` and deploys the updated static assets to the Cloudflare Worker. This is automated; the user does not manually redeploy the Web application for each article.

`.github/workflows/deploy-pages.yml` separately builds `.github-pages/`, a small GitHub Pages redirect shell. It creates the project-domain root redirect, `/blog/` redirect and a redirect for each generated post, preserving the path to the corresponding Worker URL. This avoids manual redirect configuration as new posts are added.

One-time repository setup is required: GitHub Pages must use **GitHub Actions** as the publishing source, and repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be configured with permission to deploy the `quantvesting-v3` Worker. Never commit secrets. After that, the author workflow is simply **add/edit Markdown → push**.

Do not manually edit generated files under `web/public/blog/` or `.github-pages/`.

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

## 13. Separate customer guidance tabs

The Web UI includes a supplemental education layer called **How to Prepare & Upload** on the upload screen and **How to Read** alongside the assessment report.

**How to Prepare & Upload** appears on the upload screen and explains how to prepare the current portfolio CSV and upload it.

**How to Read** appears alongside the completed assessment and explains how to understand the assessment sections, terminology and review labels.

It covers:

- minimum `Symbol, Shares, AvgCost` format
- accepted broker/export aliases
- multi-account aggregation at security level
- Portfolio Health vs allocation
- Holdings, Review Areas, Opportunity Universe and My Journey
- Review candidate, Target reached — review, Legacy holding — review, Rotation review and No current review
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

A hidden iframe receives a print-only copy of `#resultView`. The copy removes the interactive tab navigation, report controls, errors and the How to Read tab, then makes all assessment report panels visible in sequence. The separate How to Prepare & Upload guidance is outside `#resultView` and is not part of the assessment PDF. The iframe loads the same `/styles.css` used by the Web UI, with A4 print rules for typography, tables, spacing, page breaks and print colors.

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
- The print view includes the three customer-facing assessment report tabs sequentially and excludes both customer guidance tabs. My Journey remains available in the underlying result/API contract but is not customer-facing for now.
- Technical provenance remains in the assessment result, while the Web UI presents market-data freshness as a human-readable IST date/time.

### PDF contents

The generated assessment PDF includes:

- portfolio summary
- market-data update date/time and status
- allocation and concentration
- holdings
- review areas
- capital-rotation review
- opportunity universe
- journey
- disclosure

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

1. Validate the beta funnel: homepage discovery → free assessment → insight → optional TopMate human session.
2. Observe what beta users understand, ask for and are willing to pay for before expanding the feature set.
3. Continue fixed-snapshot Python ↔ Web parity coverage.
4. Continue assessment provenance/freshness visibility and harden market snapshot validation/stale-snapshot handling.
5. Improve operational deployment/monitoring without changing methodology.
6. Keep PDF delivery and Web/notebook presentation synchronized before adding additional communication channels.

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


## 7H. Journal content refinement record (September 10, 2026)

The Journal content was rewritten as a coherent weekly learning sequence. The publication calendar now runs weekly on Sundays from 31 May 2026 to 6 September 2026 (15 posts). Six dedicated funnel explainers were added: **Macroeconomics**, **Industry**, **Business**, **Financials**, **Valuation**, and **Technicals**. Each is intentionally introductory: the goal is common understanding of what the lens asks, what to look at, and how it fits into Quantvesting—not deep subject-matter training.

The existing posts were also rewritten for consistency with the user's preferred writing method: clear, brief, sharp, direct, question-led, and low on verbosity. The posts use the same core Quantvesting terminology and reinforce the distinction between recurring lenses (fundamentals/business/financials, valuation, technicals) and periodic context (macro and industry).

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
        ├── homepage About Quantvesting tab + contextual Journal CTA
        ├── downloadable sample portfolio CSV
        ├── responsive mobile holding cards
        ├── restrained visual hierarchy / shared button system
        ├── consistent Web action-button styling
        ├── guest assessment
        ├── background processing
        ├── same customer terminology
        ├── same methodology contracts
        └── persisted assessment snapshot

Quantvesting Journal
        │
        ├── Markdown source posts in _posts/
        ├── static Journal index + topic filters
        ├── clean article URLs + RSS feed
        └── GitHub Pages deployment workflow

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
