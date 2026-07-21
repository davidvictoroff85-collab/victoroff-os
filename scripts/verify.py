#!/usr/bin/env python3
"""Zero-dependency release checks for the Victoroff OS concept page."""

from __future__ import annotations

import json
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.links: list[str] = []
        self.title = ""
        self._in_title = False
        self.meta_robots = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(str(values["id"]))
        if tag == "a" and values.get("href"):
            self.links.append(str(values["href"]))
        if tag == "title":
            self._in_title = True
        if tag == "meta" and values.get("name") == "robots":
            self.meta_robots = str(values.get("content", ""))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def main() -> int:
    errors: list[str] = []
    required = [
        "index.html",
        "styles.css",
        "app.js",
        "robots.txt",
        "vercel.json",
        "README.md",
    ]
    for rel in required:
        if not (ROOT / rel).is_file():
            errors.append(f"missing {rel}")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(html)

    if "Victoroff OS" not in parser.title:
        errors.append("title does not identify Victoroff OS")
    if parser.meta_robots.lower() != "noindex, nofollow":
        errors.append("concept page must remain noindex, nofollow")
    if "not a commissioned client system" not in html:
        errors.append("non-commissioned concept disclosure is missing")
    if "id=\"main\"" not in html or "Skip to content" not in html:
        errors.append("skip-link/main landmark contract is missing")

    for href in parser.links:
        if href.startswith("#") and href[1:] not in parser.ids:
            errors.append(f"broken fragment link {href}")

    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    if "Disallow: /" not in robots:
        errors.append("robots.txt must disallow crawling")

    config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    headers = config.get("headers", [])
    serialized_headers = json.dumps(headers)
    if "X-Robots-Tag" not in serialized_headers or "noindex, nofollow" not in serialized_headers:
        errors.append("Vercel noindex response header is missing")

    if errors:
        for error in errors:
            print(f"FAIL: {error}")
        return 1

    print("PASS: Victoroff OS concept page contract")
    print(f"PASS: {len(parser.ids)} landmarks and {len(parser.links)} links parsed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
