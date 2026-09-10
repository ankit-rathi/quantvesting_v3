#!/usr/bin/env python3
"""Build the first-party Quantvesting Journal from Markdown posts.

Source posts live in `_posts/YYYY-MM-DD-slug.md`.
Generated static files are written to `web/public/blog/` so the journal can be
served by GitHub Pages without a database or CMS.
"""
from __future__ import annotations

import html
import re
import shutil
from collections import Counter
from datetime import date
from pathlib import Path
from urllib.parse import quote

import mistune
import yaml

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "_posts"
OUT_DIR = ROOT / "web" / "public" / "blog"
BASE_URL = "https://ankit-rathi.github.io/quantvesting_v3/blog/"

FILENAME_RE = re.compile(r"^(?P<date>\d{4}-\d{2}-\d{2})-(?P<slug>[A-Za-z0-9][A-Za-z0-9-]*)\.md$")
FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?(.*)\Z", re.S)

markdown = mistune.create_markdown(escape=True, hard_wrap=False)


def fail(message: str) -> None:
    raise SystemExit(f"build_blog.py: {message}")


def parse_post(path: Path) -> dict:
    match = FILENAME_RE.match(path.name)
    if not match:
        fail(f"post filename must match YYYY-MM-DD-slug.md: {path.name}")
    try:
        published = date.fromisoformat(match.group("date"))
    except ValueError as exc:
        fail(f"invalid post date in {path.name}: {exc}")

    raw = path.read_text(encoding="utf-8")
    fm = FRONTMATTER_RE.match(raw)
    if not fm:
        fail(f"missing YAML front matter in {path.name}")
    try:
        meta = yaml.safe_load(fm.group(1)) or {}
    except yaml.YAMLError as exc:
        fail(f"invalid YAML front matter in {path.name}: {exc}")

    title = str(meta.get("title", "")).strip()
    excerpt = str(meta.get("excerpt", "")).strip()
    tags = meta.get("tags", [])
    if not title:
        fail(f"title is required in {path.name}")
    if not excerpt:
        fail(f"excerpt is required in {path.name}")
    if not isinstance(tags, list) or not tags or not all(isinstance(tag, str) for tag in tags):
        fail(f"tags must be a non-empty YAML list in {path.name}")

    clean_tags = []
    for tag in tags:
        tag = re.sub(r"\s+", " ", tag.strip().lower())
        if not tag:
            fail(f"empty tag in {path.name}")
        if tag not in clean_tags:
            clean_tags.append(tag)

    slug = match.group("slug").lower()
    return {
        "date": published,
        "slug": slug,
        "title": title,
        "excerpt": excerpt,
        "tags": clean_tags,
        "source": path,
        "body_html": markdown(fm.group(2).strip()),
    }


def display_date(value: date) -> str:
    return value.strftime("%d %B %Y")


def tag_label(tag: str) -> str:
    return tag.replace("-", " ").title()


def page_head(title: str, description: str, canonical: str, extra_css: str = "", og_type: str = "website") -> str:
    css = f'<link rel="stylesheet" href="{extra_css}">' if extra_css else ""
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description)}">
<link rel="canonical" href="{html.escape(canonical)}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(description)}">
<meta property="og:type" content="{html.escape(og_type)}">
<meta property="og:url" content="{html.escape(canonical)}">
{css}
</head>
'''


def write_index(posts: list[dict], counts: Counter[str]) -> None:
    topic_buttons = []
    for tag, count in sorted(counts.items(), key=lambda item: (-item[1], item[0])):
        size = " topic-chip--large" if count >= max(2, max(counts.values()) if counts else 1) else ""
        topic_buttons.append(
            f'<button class="topic-chip{size}" type="button" data-topic="{html.escape(tag)}" '
            f'aria-pressed="false">{html.escape(tag_label(tag))}<span>{count}</span></button>'
        )

    post_cards = []
    for post in posts:
        tags = "".join(f'<span class="post-tag">{html.escape(tag_label(tag))}</span>' for tag in post["tags"])
        post_cards.append(
            f'''<article class="journal-post" data-tags="{' '.join(html.escape(t) for t in post['tags'])}">
  <div class="post-date">{display_date(post['date'])}</div>
  <h2><a href="posts/{quote(post['slug'])}/">{html.escape(post['title'])}</a></h2>
  <p>{html.escape(post['excerpt'])}</p>
  <div class="post-tags">{tags}</div>
  <a class="text-link" href="posts/{quote(post['slug'])}/">Read essay <span aria-hidden="true">→</span></a>
</article>'''
        )

    latest = posts[0]
    canonical = BASE_URL
    description = "Essays on investing, portfolios, personal finance and the ideas behind Quantvesting."
    html_text = page_head("Quantvesting Journal | Investing, Portfolios & Personal Finance", description, canonical, "../styles.css", "website")
    html_text = html_text.replace('<link rel="stylesheet" href="../styles.css">', '<link rel="stylesheet" href="../styles.css">\n<link rel="stylesheet" href="blog.css">')
    html_text += f'''<body>
<main class="journal-shell">
  <header class="journal-hero">
    <div class="journal-topline"><a class="back-link" href="../">← Quantvesting</a><a class="feed-link" href="feed.xml">RSS</a></div>
    <div class="eyebrow">THE QUANTVESTING JOURNAL</div>
    <h1>Ideas for thinking more clearly about money.</h1>
    <p class="journal-lede">Essays on portfolios, investing, personal finance and the thinking behind Quantvesting. No predictions. No noise. Just ideas worth examining.</p>
  </header>

  <div class="journal-layout">
    <aside class="journal-sidebar" aria-label="Journal topics">
      <div class="sidebar-block">
        <div class="sidebar-heading">Topics</div>
        <p class="sidebar-note">Browse by the ideas that appear most often in the Journal.</p>
        <div class="topic-cloud" id="topicCloud">
          <button class="topic-chip active" type="button" data-topic="all" aria-pressed="true">All topics<span>{len(posts)}</span></button>
          {''.join(topic_buttons)}
        </div>
        <button class="clear-filter" id="clearTopic" type="button">Clear filter</button>
      </div>
      <div class="sidebar-block sidebar-note-block">
        <div class="sidebar-heading">Start here</div>
        <p>{html.escape(latest['excerpt'])}</p>
        <a class="text-link" href="posts/{quote(latest['slug'])}/">Read the latest essay <span aria-hidden="true">→</span></a>
      </div>
    </aside>

    <section class="journal-content" aria-labelledby="journal-posts-heading">
      <div class="content-heading">
        <div>
          <div class="eyebrow">ESSAYS</div>
          <h2 id="journal-posts-heading">Latest thinking</h2>
        </div>
        <div class="filter-status" id="filterStatus" role="status" aria-live="polite">Showing all essays</div>
      </div>
      <div class="journal-posts" id="journalPosts">
        {''.join(post_cards)}
      </div>
      <div class="empty-filter hidden" id="emptyFilter">No essays currently use this topic. Try another topic or clear the filter.</div>
    </section>
  </div>

  <footer class="journal-footer">
    <a href="../">Quantvesting</a>
    <span>·</span>
    <span>Understand before you act.</span>
  </footer>
</main>
<script src="blog.js" defer></script>
</body>
</html>
'''
    (OUT_DIR / "index.html").write_text(html_text, encoding="utf-8")


def write_post(post: dict) -> None:
    post_dir = OUT_DIR / "posts" / post["slug"]
    post_dir.mkdir(parents=True, exist_ok=True)
    canonical = f"{BASE_URL}posts/{quote(post['slug'])}/"
    description = post["excerpt"]
    tags = "".join(f'<span class="post-tag">{html.escape(tag_label(tag))}</span>' for tag in post["tags"])
    html_text = page_head(f"{post['title']} | Quantvesting Journal", description, canonical, "../../styles.css", "article")
    html_text = html_text.replace('<link rel="stylesheet" href="../../styles.css">', '<link rel="stylesheet" href="../../styles.css">\n<link rel="stylesheet" href="../../blog.css">')
    html_text += f'''<body>
<main class="journal-shell article-shell">
  <header class="article-topline">
    <a class="back-link" href="../../">← Quantvesting Journal</a>
    <a class="feed-link" href="../../feed.xml">RSS</a>
  </header>
  <article class="article">
    <header class="article-header">
      <div class="eyebrow">QUANTVESTING JOURNAL</div>
      <h1>{html.escape(post['title'])}</h1>
      <p class="article-excerpt">{html.escape(post['excerpt'])}</p>
      <div class="article-meta"><time datetime="{post['date'].isoformat()}">{display_date(post['date'])}</time><span>·</span><div class="post-tags">{tags}</div></div>
    </header>
    <div class="article-body">
      {post['body_html']}
    </div>
  </article>
  <nav class="article-next" aria-label="Journal navigation">
    <a class="button secondary" href="../../">← Back to Journal</a>
  </nav>
  <footer class="journal-footer"><a href="../../">Quantvesting</a><span>·</span><span>Understand before you act.</span></footer>
</main>
</body>
</html>
'''
    (post_dir / "index.html").write_text(html_text, encoding="utf-8")


def write_feed(posts: list[dict]) -> None:
    items = []
    for post in posts:
        url = f"{BASE_URL}posts/{quote(post['slug'])}/"
        items.append(
            f'''<item><title>{html.escape(post['title'])}</title><link>{html.escape(url)}</link><guid>{html.escape(url)}</guid><pubDate>{post['date'].strftime('%a, %d %b %Y 00:00:00 +0000')}</pubDate><description>{html.escape(post['excerpt'])}</description></item>'''
        )
    feed = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>Quantvesting Journal</title>
<link>{BASE_URL}</link>
<description>Essays on investing, portfolios, personal finance and the ideas behind Quantvesting.</description>
<language>en</language>
{''.join(items)}
</channel></rss>
'''
    (OUT_DIR / "feed.xml").write_text(feed, encoding="utf-8")




def write_sitemap(posts: list[dict]) -> None:
    site_base = "https://ankit-rathi.github.io/quantvesting_v3/"
    urls = [site_base, f"{site_base}blog/"]
    urls.extend(f"{BASE_URL}posts/{quote(post['slug'])}/" for post in posts)
    body = "".join(f"<url><loc>{html.escape(url)}</loc></url>" for url in urls)
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + body + '</urlset>\n'
    (ROOT / "web" / "public" / "sitemap.xml").write_text(sitemap, encoding="utf-8")

def main() -> None:
    if not POSTS_DIR.exists():
        fail("_posts directory does not exist")
    sources = sorted(POSTS_DIR.glob("*.md"))
    if not sources:
        fail("no Markdown posts found in _posts")
    posts = [parse_post(path) for path in sources]
    slugs = [post["slug"] for post in posts]
    if len(slugs) != len(set(slugs)):
        fail("duplicate post slug detected")
    posts.sort(key=lambda post: (post["date"], post["slug"]), reverse=True)

    counts: Counter[str] = Counter()
    for post in posts:
        counts.update(post["tags"])

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    (OUT_DIR / "posts").mkdir(parents=True, exist_ok=True)
    write_index(posts, counts)
    for post in posts:
        write_post(post)
    write_feed(posts)
    write_sitemap(posts)
    shutil.copy2(ROOT / "web" / "blog" / "blog.css", OUT_DIR / "blog.css")
    shutil.copy2(ROOT / "web" / "blog" / "blog.js", OUT_DIR / "blog.js")

    print(f"Built Quantvesting Journal: {len(posts)} post(s) -> {OUT_DIR}")


if __name__ == "__main__":
    main()
