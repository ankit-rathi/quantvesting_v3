# Quantvesting v3

> **From portfolio data to decision intelligence.**

Quantvesting is a quantitative portfolio/decision-support framework with an independent **Python/Jupyter path** and a **Cloudflare-native Web assessment path**. Both are intended to use the same portfolio, market-snapshot and methodology contracts.

## Current customer journey

```text
ASSESS
  ↓
SEE THE SHAPE OF YOUR CAPITAL
  ↓
UNDERSTAND WHAT DESERVES ATTENTION
  ↓
KNOW WHERE TO RESEARCH NEXT
```

The customer-facing Web UI exposes **Assess My Portfolio**, **About Quantvesting**, **How to Prepare & Upload**, then **My Portfolio**, **Review Areas**, **Opportunity Universe**, and **How to Read**. My Journey remains an underlying Python/Web data capability but is intentionally not exposed in the first customer assessment.

The visual storytelling contract is **Finding → Meaning → Evidence → Question → Context**. The design intentionally prioritises clarity over dashboard density.

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

The print/PDF report includes My Portfolio, Review Areas and Opportunity Universe content plus the disclosure. How to Read, controls/guidance and My Journey are excluded from the customer-facing print report; the end-of-report assessment CTA, community CTA and disclosure are included.

## WhatsApp roadmap

WhatsApp is **not implemented in the current release**. It remains deliberately deferred until a suitable WhatsApp provider/API is selected. The future design keeps report persistence independent from WhatsApp and uses separate consent for report delivery and optional Weekend Quantvesting broadcasts.

See **`docs/QUANTVESTING.md` → Roadmap → Deferred: WhatsApp**.

## Tests

From the repository root:

```bash
PYTHONPATH=src python -m pytest -q tests
npm run check:worker
npm run test:cloudflare
python scripts/check_web_cohesion.py
PYTHONPATH=src python -m pytest -q tests
```

For the full local regression/build sequence:

```bash
npm run test:all
```

Do not claim a change is complete until the relevant regression tests pass.

## Latest presentation contract — 2026-09-12

The assessment is intentionally being treated as a **financial story, not a dashboard**. The user journey is:

```text
See the shape of your capital
        ↓
Understand what deserves attention
        ↓
Know where to research next
```

Important presentation grammar:

```text
Finding → Meaning → Evidence → Question → Context
```

The opening **Start Here** cards now surface the finding, the meaning/reason for attention, capital at stake and the question worth investigating. Review Areas and the Opportunity Universe continue the same narrative rather than introducing unrelated metrics.

### Capital Rotation reference set

Capital Rotation Review does **not** force a one-to-one mapping between a mature holding and a single alternative. When `N` rotation candidates are surfaced, the Web assessment presents up to `N` highest-ranked qualifying research opportunities as a **reference opportunity set**. Each rotation candidate is then compared conceptually with that set.

This avoids artificial precision such as `Holding A → Opportunity A` when the framework has no explicit matching rule. The section asks whether any of the reference opportunities may represent a better research case for the capital currently under review; it does not issue a sell/buy instruction.

The same reference-set concept is carried into the compatibility Worker PDF and the Python decision helper while preserving the existing first-reference fields for backward compatibility.

### Current product priority

The product/assessment logic is deliberately being kept stable while the next operating phase focuses on **distribution, real-user feedback, aha-moment discovery and willingness-to-pay evidence**. Presentation improvements should make the existing analytical output easier to understand; they should not add dashboard density without evidence that it improves customer value.

### Latest capital-rotation reference refinement — 2026-09-12

Capital Rotation Review now uses **unheld** qualifying opportunities as its reference set. When `N` rotation candidates are surfaced, the Web/PDF presentation shows up to `N` highest-ranked qualifying opportunities that the user does not currently hold. This keeps the section focused on opportunity cost: the question is whether currently deployed capital deserves comparison with a stronger unheld research opportunity.

The existing adaptive `N`-sized reference set and no-forced-one-to-one mapping remain unchanged. If fewer than `N` qualifying unheld opportunities exist, the reference set is smaller rather than being padded with already-held securities.
