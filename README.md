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

The Web UI provides the same concepts through **My Portfolio**, **Review Areas**, **Opportunity Universe**, **My Journey**, and **How to Read** alongside the assessment report. The homepage provides **Assess My Portfolio**, **About Quantvesting**, **Journal**, and **How to Prepare & Upload** as top-level destinations. The Journal is a learning/trust destination rather than an assessment step; its entry point also remains available contextually inside About Quantvesting. The preparation tab offers a downloadable sample `myPortfolioStocks.csv` that can be filled in and uploaded directly. Onboarding is the Web upload flow.

## Web UI / responsive design

The Web UI follows a **quiet financial intelligence** direction: strong hierarchy, generous whitespace, restrained borders, minimal decorative treatment and progressive disclosure. `Assess My Portfolio` is the primary homepage action; About, preparation guidance, Opportunity Universe and TopMate are secondary discovery paths.

The assessment deliberately supports greater analytical density than the homepage. Current Value and Deployed Value are emphasized as primary KPIs, while Portfolio Health, concentration and Review Areas provide the next layer of interpretation. The full sortable holdings table remains available on desktop/tablet; narrow mobile layouts use holding cards so the 11-column dataset is not simply squeezed into a horizontal scroll region.

Shared Web action buttons use the same visual primitive and primary/secondary hierarchy before and after assessment.

## Quantvesting Journal / GitHub Pages + Worker publishing

The repository includes a first-party static Journal whose source of truth is `_posts/`. The live Journal is served by the Cloudflare Worker at:

`https://quantvesting-v3.rathi-ankit.workers.dev/blog/`

The GitHub Pages project URL is retained as a lightweight redirect layer:

`https://ankit-rathi.github.io/quantvesting_v3/blog/`

Each dated Markdown post under `_posts/` is converted by `scripts/build_blog.py` into the Worker asset bundle. The Journal index is reverse chronological, topic filtering uses accessible chips, and RSS/sitemap output is generated automatically. The generated Journal reuses the Web UI typography, font family, palette, spacing conventions and shared button primitives.

The Web homepage now has a dedicated **Journal** top-level tab. The Journal is deliberately not numbered because it is not an assessment step. The assessment itself retains its numbered progression: **My Portfolio**, **Review Areas**, **Opportunity Universe**, **My Journey**, and **How to Read**. About Quantvesting also contains the contextual **Explore the Quantvesting Journal** CTA.

### Markdown-only publishing

New posts are added only under `_posts/`, for example:

```text
_posts/2026-09-10-Why-Understanding-Your-Portfolio-Comes-Before-Optimizing-It.md
```

When a post is pushed to `main`, two GitHub Actions workflows run for Journal content:

1. `.github/workflows/deploy-journal-worker.yml` builds the Journal and deploys the updated static assets to the Cloudflare Worker. This is an automated Worker asset deployment; no manual Web deployment is required for each article.
2. `.github/workflows/deploy-pages.yml` rebuilds a tiny GitHub Pages redirect shell so the corresponding project-domain `/blog/` and `/blog/posts/.../` URLs redirect to the Worker while preserving the path.

This means the author workflow remains simply: **add Markdown → push to `main`**. Do not edit generated files under `web/public/blog/` or `.github-pages/` by hand.

### One-time GitHub setup

If GitHub Pages is not already configured for Actions, open **Repository → Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.

Add these repository secrets once for the automated Worker publishing workflow:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token permitted to deploy the `quantvesting-v3` Worker.
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account ID that owns the Worker.

After those one-time settings are in place, adding a Markdown post does not require a manual Cloudflare deployment.

To preview/rebuild locally:

```bash
python scripts/build_blog.py
```

Keep source posts in `_posts/`; generated Worker assets are build output.

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
│   └── build_blog.py          # Markdown → static Journal build
├── _posts/                    # source Journal posts (one Markdown file per essay)
├── .github/workflows/         # GitHub Pages deployment workflow
├── tests/
└── web/                       # Cloudflare Worker + Web UI + static Journal output
```

Historical phase/changelog Markdown files have been consolidated into `docs/QUANTVESTING.md`. Historical notebooks remain under `notebooks/archive/` because they are useful reference material.

## Assessment PDF delivery

After a Web assessment completes, the user can download a PDF copy of the assessment. The PDF is generated on demand from the completed assessment result and is not stored as a public report artifact.

The guest flow therefore does not expose a persistent bearer-style report URL. Assessment/job data needed for processing and the active registered-user workflow remains stored according to the existing repository model.

The PDF includes the portfolio summary, market-data timestamp, allocation and concentration, holdings, review areas, capital-rotation review, opportunity universe, journey and disclosure.

The browser print layout uses print-only A4 page-safe gutters (12mm top, 10mm left/right, 14mm bottom) so bordered sections do not sit flush against the PDF page edges. This does not alter the latest Web UI layout or styling.

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
