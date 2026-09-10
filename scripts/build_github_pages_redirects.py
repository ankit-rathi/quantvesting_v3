#!/usr/bin/env python3
"""Build the GitHub Pages redirect shell for Quantvesting.

GitHub Pages is the public project-domain entry point, while the actual
Quantvesting application and Journal are served by the Cloudflare Worker.
This script creates only redirect pages; it does not alter the Worker assets.
"""
from __future__ import annotations

import html
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
OUT_DIR = ROOT / ".github-pages"
WORKER_BASE = "https://quantvesting-v3.rathi-ankit.workers.dev"

FILENAME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}-(?P<slug>[A-Za-z0-9][A-Za-z0-9-]*)\.md$")


def redirect_html(target: str, title: str) -> str:
    target = html.escape(target, quote=True)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta http-equiv="refresh" content="0;url={target}">
<link rel="canonical" href="{target}">
<script>window.location.replace({target!r});</script>
</head>
<body>
<p>Redirecting to <a href="{target}">Quantvesting</a>…</p>
</body>
</html>
'''


def main() -> None:
    if not POSTS_DIR.exists():
        raise SystemExit("build_github_pages_redirects.py: _posts directory does not exist")
    posts = []
    for path in POSTS_DIR.glob("*.md"):
        match = FILENAME_RE.match(path.name)
        if not match:
            raise SystemExit(f"build_github_pages_redirects.py: invalid post filename: {path.name}")
        posts.append(match.group("slug").lower())
    if len(posts) != len(set(posts)):
        raise SystemExit("build_github_pages_redirects.py: duplicate post slug detected")

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    (OUT_DIR / "blog" / "posts").mkdir(parents=True, exist_ok=True)
    (OUT_DIR / ".nojekyll").write_text("", encoding="utf-8")

    (OUT_DIR / "index.html").write_text(
        redirect_html(f"{WORKER_BASE}/", "Quantvesting"), encoding="utf-8"
    )
    (OUT_DIR / "blog" / "index.html").write_text(
        redirect_html(f"{WORKER_BASE}/blog/", "Quantvesting Journal"), encoding="utf-8"
    )

    for slug in sorted(posts):
        post_dir = OUT_DIR / "blog" / "posts" / slug
        post_dir.mkdir(parents=True, exist_ok=True)
        target = f"{WORKER_BASE}/blog/posts/{slug}/"
        (post_dir / "index.html").write_text(
            redirect_html(target, f"{slug} | Quantvesting Journal"), encoding="utf-8"
        )

    print(f"Built GitHub Pages redirect shell: {len(posts)} post redirect(s) -> {OUT_DIR}")


if __name__ == "__main__":
    main()
