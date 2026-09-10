#!/usr/bin/env python3
"""Create a canonical Quantvesting market snapshot.

Examples:
  python scripts/refresh_market_snapshot.py
  python scripts/refresh_market_snapshot.py --source-dir market_data --output-dir market_data/snapshots/latest
  python scripts/refresh_market_snapshot.py --no-derived
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT / "src"))

from quantvesting import generate_market_snapshot, load_config


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", default=str(PROJECT / "market_data"))
    parser.add_argument("--output-dir", default=str(PROJECT / "market_data" / "snapshots" / "latest"))
    parser.add_argument("--config", default=str(PROJECT / "config" / "strategy.yaml"))
    parser.add_argument("--no-derived", action="store_true", help="Only package existing canonical CSVs; do not call yfinance.")
    args = parser.parse_args()

    config = load_config(args.config)
    snapshot = generate_market_snapshot(
        args.source_dir,
        args.output_dir,
        config=config,
        include_derived=not args.no_derived,
        source="yfinance-plus-existing-quantvesting-market-data" if not args.no_derived else "existing-quantvesting-market-data",
    )
    print(f"Snapshot created: {snapshot.snapshot_id}")
    print(f"As of: {snapshot.as_of}")
    print(f"Directory: {Path(args.output_dir).resolve()}")
    for name, details in snapshot.files.items():
        print(f"  {name}: {details['rows']} rows, sha256={details['sha256'][:12]}...")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
