"""Offline security and structural regressions for the published static pages."""

import base64
from collections import Counter
import hashlib
from html.parser import HTMLParser
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import unittest
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_PAGES = {
    "index.html", "about.html", "contact.html", "portal.html", "privacy.html",
    "services.html", "portfolio.html", "faq.html", "404.html",
    "service-ga4-gtm.html", "service-gpt-ai-chatbot.html",
    "service-homepage-fix.html", "service-homepage-landing.html",
    "service-react-firebase-admin.html", "service-web-crawling.html",
}
GTM_ORIGIN = "https://www.googletagmanager.com"
GAS_ACTION = (
    "https://script.google.com/macros/s/"
    "AKfycbywZAKl2NEXCXagcu_jZ7WgAfiHcgcelu-tjzROfymWeSiahVr3vkVusiD6TMwRsJx9Qw/exec"
)

spec = importlib.util.spec_from_file_location("security_policy", ROOT / "scripts/security_policy.py")
security_policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(security_policy)


def script_hash(code):
    digest = base64.b64encode(hashlib.sha256(code.encode("utf-8")).digest()).decode("ascii")
    return "'sha256-" + digest + "'"


class Page(HTMLParser):
    """Keep raw script/SVG content and parsed attributes for independent checks."""

    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.tags = []
        self.head_tags = []
        self.scripts = []
        self.inline_svgs = []
        self.in_head = False
        self.script = None
        self.svg_depth = 0
        self.svg_start = 0
        self.line_starts = [0]
        for index, character in enumerate(source):
            if character == "\n":
                self.line_starts.append(index + 1)
        self.feed(source)
        self.close()

    def source_position(self):
        line, column = self.getpos()
        return self.line_starts[line - 1] + column

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if self.in_head:
            self.head_tags.append((tag, attrs))
        if tag == "head":
            self.in_head = True
        if tag == "script":
            self.script = {"attrs": attrs, "code": ""}
        if tag == "svg":
            if not self.svg_depth:
                self.svg_start = self.source_position()
            self.svg_depth += 1

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False
        if tag == "script" and self.script is not None:
            self.scripts.append(self.script)
            self.script = None
        if tag == "svg":
            self.svg_depth -= 1
            if not self.svg_depth:
                end = self.source.index(">", self.source_position()) + 1
                self.inline_svgs.append(self.source[self.svg_start:end])

    def handle_data(self, data):
        if self.script is not None:
            self.script["code"] += data

    def matching(self, tag, **attrs):
        return [a for t, a in self.tags if t == tag and all(a.get(k) == v for k, v in attrs.items())]

    @property
    def ids(self):
        return [attrs["id"] for _, attrs in self.tags if "id" in attrs]

    @property
    def policy(self):
        metas = self.matching("meta", **{"http-equiv": "Content-Security-Policy"})
        if len(metas) != 1:
            raise AssertionError("Every page needs exactly one CSP meta")
        directives = {}
        for directive in metas[0]["content"].split(";"):
            words = directive.split()
            if not words:
                continue
            if words[0] in directives:
                raise AssertionError("Duplicate CSP directive: " + words[0])
            directives[words[0]] = words[1:]
        return directives


class SiteSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages = {
            path.name: Page(path.read_text(encoding="utf-8"))
            for path in sorted(ROOT.glob("*.html"))
        }

    def test_complete_page_inventory_and_document_structure(self):
        self.assertEqual(set(self.pages), EXPECTED_PAGES)
        for name, page in self.pages.items():
            with self.subTest(page=name):
                self.assertEqual(len(page.matching("h1")), 1)
                self.assertFalse([key for key, count in Counter(page.ids).items() if count > 1])
                self.assertEqual(len(page.matching("head")), 1)
                self.assertFalse(page.matching("base"), "Base tags can change relative resource/form targets")
                blocks = [s for s in page.scripts if s["attrs"].get("type") == "application/ld+json"]
                self.assertEqual(len(blocks), 1)
                document = json.loads(blocks[0]["code"])
                self.assertEqual(document["@context"], "https://schema.org")
                self.assertTrue(document["@type"])

    def test_local_references_and_fragment_targets(self):
        for name, page in self.pages.items():
            for tag, attrs in page.tags:
                references = [attrs[key] for key in ("src", "href", "poster", "data", "xlink:href") if attrs.get(key)]
                if attrs.get("srcset"):
                    references.extend(candidate.strip().split()[0] for candidate in attrs["srcset"].split(","))
                for reference in references:
                    with self.subTest(page=name, tag=tag, reference=reference):
                        url = urlsplit(reference)
                        if url.scheme or url.netloc:
                            self.assertIn(url.scheme, {"https", "mailto", "tel"})
                            continue
                        relative = unquote(url.path)
                        path = ROOT / (relative.lstrip("/") if relative else name)
                        if path.is_dir():
                            path /= "index.html"
                        self.assertTrue(path.resolve().is_relative_to(ROOT), "Reference escapes published root")
                        self.assertTrue(path.is_file(), "Missing local resource")
                        if url.fragment and path.suffix == ".html":
                            target = self.pages.get(path.name)
                            self.assertIsNotNone(target, "Linked HTML page must be included in checks")
                            self.assertIn(unquote(url.fragment), target.ids, "Missing fragment target")

    def test_svg_documents_are_valid_xml(self):
        files = list(ROOT.glob("*.svg")) + list((ROOT / "assets").rglob("*.svg"))
        self.assertTrue(files)
        for path in files:
            with self.subTest(svg=str(path.relative_to(ROOT))):
                root = ET.parse(path).getroot()
                self.assertEqual(root.tag.rsplit("}", 1)[-1], "svg")
        for name, page in self.pages.items():
            for index, source in enumerate(page.inline_svgs):
                with self.subTest(page=name, inline_svg=index):
                    self.assertEqual(ET.fromstring(source).tag.rsplit("}", 1)[-1], "svg")

    def test_only_current_scripts_are_loaded(self):
        for name, page in self.pages.items():
            expected = {"nw-motion.js"}
            if name == "index.html":
                expected.update({"nw-home.js", "nw-logo-intro.js"})
            if name in {"portfolio.html", "services.html", "about.html"}:
                expected.add("nw-page-motion.js")
            if name == "contact.html":
                expected.add("nw-contact.js")
            with self.subTest(page=name):
                loaded = [urlsplit(s["attrs"]["src"]).path for s in page.scripts if s["attrs"].get("src")]
                self.assertEqual(set(loaded), expected, "Legacy rollback scripts must remain inactive")
                self.assertEqual(len(loaded), len(expected), "Scripts must not load twice")
                for script in page.scripts:
                    if script["attrs"].get("src"):
                        url = urlsplit(script["attrs"]["src"])
                        self.assertFalse(url.scheme or url.netloc, "Authored script tags must remain local")

    def test_policies_precede_every_executable_or_resource(self):
        for name, page in self.pages.items():
            with self.subTest(page=name):
                self.assertEqual(page.head_tags[0], ("meta", {"charset": "utf-8"}))
                tag, attrs = page.head_tags[1]
                self.assertEqual(tag, "meta")
                self.assertEqual(attrs.get("http-equiv"), "Content-Security-Policy")
                self.assertEqual(page.head_tags[2][0], "meta")
                self.assertEqual(page.head_tags[2][1].get("name"), "referrer")
                self.assertEqual(len(page.matching("meta", name="referrer")), 1)
                self.assertEqual(page.source, security_policy.render(ROOT / name, page.source), "Policy is stale")

    def test_strict_script_policy_hashes_cover_exact_inline_bytes(self):
        for name, page in self.pages.items():
            with self.subTest(page=name):
                policy = page.policy
                for directive in ("default-src", "base-uri", "object-src", "script-src-attr"):
                    self.assertEqual(policy[directive], ["'none'"])
                expected = {"'self'"}
                expected.update(script_hash(s["code"]) for s in page.scripts if not s["attrs"].get("src"))
                if name not in {"contact.html", "portal.html"}:
                    expected.add(GTM_ORIGIN)
                self.assertEqual(set(policy["script-src"]), expected)
                self.assertEqual(len(policy["script-src"]), len(expected))
                self.assertNotIn("script-src-elem", policy, "A separate directive could bypass script-src")
                self.assertEqual(policy["style-src"], ["'self'"])
                for _, attrs in page.tags:
                    self.assertFalse(any(key.startswith("on") for key in attrs), "Inline event handlers are forbidden")
                    self.assertNotIn("style", attrs, "Use authored CSS files under the strict style policy")

    def test_sensitive_pages_do_not_load_analytics_or_send_referrers(self):
        for name in ("contact.html", "portal.html"):
            page = self.pages[name]
            with self.subTest(page=name):
                self.assertNotIn("googletagmanager.com", page.source)
                self.assertNotIn("google-analytics.com", page.source)
                self.assertNotIn("GTM-", page.source)
                self.assertEqual(page.policy["connect-src"], ["'none'"])
                self.assertEqual(page.matching("meta", name="referrer")[0]["content"], "no-referrer")
        self.assertEqual(self.pages["portal.html"].policy["frame-src"], ["'none'"])

    def test_contact_submission_is_fixed_and_requires_script_initialization(self):
        page = self.pages["contact.html"]
        forms = page.matching("form")
        self.assertEqual(len(forms), 1)
        self.assertEqual(forms[0]["action"], GAS_ACTION)
        self.assertEqual(forms[0]["method"].lower(), "post")
        self.assertEqual(page.policy["form-action"], [GAS_ACTION, "https://script.googleusercontent.com"])
        submits = page.matching("button", type="submit") + page.matching("input", type="submit")
        self.assertEqual(len(submits), 1)
        self.assertIn("disabled", submits[0], "Submission must fail closed when the validator fails to load")
        self.assertTrue(page.matching("noscript"))
        self.assertTrue(any(attrs.get("href", "").startswith("mailto:") for _, attrs in page.tags))
        for tag, attrs in page.tags:
            self.assertNotIn("formaction", attrs)
            self.assertNotIn("formmethod", attrs)
        for name, other in self.pages.items():
            if name != "contact.html":
                with self.subTest(page=name):
                    self.assertFalse(other.matching("form"))
                    self.assertEqual(other.policy["form-action"], ["'none'"])

    def test_new_tabs_cannot_control_the_opener(self):
        for name, page in self.pages.items():
            for attrs in page.matching("a"):
                if attrs.get("target", "").lower() == "_blank":
                    with self.subTest(page=name, href=attrs.get("href")):
                        self.assertIn("noopener", attrs.get("rel", "").lower().split())

    def test_changed_inline_code_invalidates_the_existing_hash(self):
        page = self.pages["index.html"]
        script = next(s for s in page.scripts if not s["attrs"].get("src") and s["attrs"].get("type") != "application/ld+json")
        changed_code = script["code"] + ";window.__unexpectedInline = true;"
        changed = page.source.replace(script["code"], changed_code, 1)
        self.assertNotIn(script_hash(changed_code), page.policy["script-src"])
        rendered = security_policy.render(ROOT / "index.html", changed)
        self.assertNotEqual(rendered, changed, "The policy checker must detect an inline mutation")
        self.assertIn(script_hash(changed_code), Page(rendered).policy["script-src"])
        self.assertEqual(rendered, security_policy.render(ROOT / "index.html", rendered))

    def test_generator_rejects_policy_after_an_early_script(self):
        source = '<!doctype html><html><head><script>window.__early = true;</script><meta charset="utf-8"></head><body></body></html>'
        with self.assertRaises(ValueError):
            security_policy.render(ROOT / "index.html", source)

    def test_authored_javascript_syntax(self):
        node = shutil.which("node")
        self.assertIsNotNone(node, "Node.js is required to verify browser JavaScript syntax")
        authored = sorted(ROOT.glob("nw-*.js")) + sorted(
            path for path in (ROOT / "js").rglob("*.js") if "vendor" not in path.parts
        )
        for path in authored:
            with self.subTest(script=str(path.relative_to(ROOT))):
                result = subprocess.run([node, "--check", str(path)], capture_output=True, text=True, timeout=20)
                self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()