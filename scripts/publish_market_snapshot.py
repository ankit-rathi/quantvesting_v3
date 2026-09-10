#!/usr/bin/env python3
"""Publish a canonical market snapshot to the Quantvesting Cloudflare Worker/R2 gateway."""
from __future__ import annotations

import argparse
import getpass
import os
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT / "src"))
from quantvesting import R2SnapshotPublisher, validate_market_snapshot_directory


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot_dir", nargs="?", default=str(PROJECT / "market_data" / "snapshots" / "latest"))
    parser.add_argument("--worker-url", default=os.getenv("QUANTVESTING_WORKER_URL"))
    parser.add_argument("--admin-token", default=os.getenv("QUANTVESTING_ADMIN_TOKEN"))
    args = parser.parse_args()

    worker_url = args.worker_url or input("Cloudflare Worker URL: ").strip()
    admin_token = args.admin_token or getpass.getpass("Cloudflare ADMIN_TOKEN: ")
    snapshot = validate_market_snapshot_directory(args.snapshot_dir)
    result = R2SnapshotPublisher(worker_url, admin_token).publish(args.snapshot_dir, snapshot)
    print(f"Published snapshot: {result['snapshot_id']}")
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
