#!/usr/bin/env python3
"""Generate/check early meta policies for GitHub Pages (no build required)."""

import argparse
import base64
import hashlib
import html
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
GTM = "https://www.googletagmanager.com"
GAS_ACTION = (
    "https://script.google.com/macros/s/"
    "AKfycbywZAKl2NEXCXagcu_jZ7WgAfiHcgcelu-tjzROfymWeSiahVr3vkVusiD6TMwRsJx9Qw/exec"
)
ANALYTICS = (
    "https://*.google-analytics.com https://analytics.google.com "
    "https://*.analytics.google.com"
)
POLICY_META = re.compile(
    r'<meta\b(?=[^>]*(?:http-equiv=[\"\']Content-Security-Policy[\"\']|'
    r'name=[\"\']referrer[\"\']))[^>]*>\s*', re.IGNORECASE
)


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.collecting = False
        self.current = ""
        self.inline = []

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self.collecting = not dict(attrs).get("src")
            self.current = ""

    def handle_data(self, data):
        if self.collecting:
            self.current += data

    def handle_endtag(self, tag):
        if tag == "script" and self.collecting:
            self.inline.append(self.current)
            self.collecting = False


def policy_for(path, source):
    scripts = Scripts()
    scripts.feed(source)
    hashes = [
        "'sha256-" + base64.b64encode(hashlib.sha256(code.encode()).digest()).decode() + "'"
        for code in scripts.inline
    ]
    contact = path.name == "contact.html"
    analytics = path.name not in {"contact.html", "portal.html"}
    script_sources = ["'self'", *hashes, *([GTM] if analytics else [])]
    frames = []
    if contact:
        frames += ["https://script.google.com", "https://script.googleusercontent.com",
                   "https://*.googleusercontent.com"]
    if analytics:
        frames.append(GTM)
    directives = {
        "default-src": "'none'",
        "base-uri": "'none'",
        "object-src": "'none'",
        "script-src": " ".join(script_sources),
        "script-src-attr": "'none'",
        "style-src": "'self'",
        "img-src": "'self'" + (f" https://*.google-analytics.com {GTM}" if analytics else ""),
        "font-src": "'self'",
        "connect-src": f"{ANALYTICS} {GTM}" if analytics else "'none'",
        "frame-src": " ".join(frames) if frames else "'none'",
        # Chromium also checks redirected form destinations. The fixed Apps Script
        # deployment may redirect to Google's response host, which must be allowed.
        "form-action": f"{GAS_ACTION} https://script.googleusercontent.com" if contact else "'none'",
    }
    return "; ".join(f"{key} {value}" for key, value in directives.items())


def render(path, source):
    clean = POLICY_META.sub("", source)
    referrer = "no-referrer" if path.name in {"contact.html", "portal.html"} else "strict-origin-when-cross-origin"
    tags = (
        '<meta http-equiv="Content-Security-Policy" content="'
        + html.escape(policy_for(path, clean), quote=True)
        + '"><meta name="referrer" content="' + referrer + '">'
    )
    # Apply before every script/resource; a later meta cannot protect earlier loads.
    result, count = re.subn(r'(<head\b[^>]*>\s*<meta\s+charset="utf-8"\s*>)', lambda m: m[0] + tags,
                            clean, count=1, flags=re.IGNORECASE)
    if count != 1:
        raise ValueError(f"{path.name}: UTF-8 charset must be the first element in head")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    stale = []
    pages = sorted(ROOT.glob("*.html"))
    for path in pages:
        source = path.read_text()
        expected = render(path, source)
        if source != expected:
            if args.write:
                path.write_text(expected)
            else:
                stale.append(path.name)
    if stale:
        parser.exit(1, "Stale/missing security policies: " + ", ".join(stale)
                    + "\nRun python3 scripts/security_policy.py --write and review the diff.\n")
    print(f"Security policies {'written' if args.write else 'verified'}: {len(pages)} pages")


if __name__ == "__main__":
    main()
