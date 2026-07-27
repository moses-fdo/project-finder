#!/usr/bin/env python3
"""
audit_runner.py — headless Playwright harness for the web-app-feature-audit skill.

Two modes:

1. discover — crawl one or more pages, list every interactive element found in
   the DOM (buttons, links, inputs, forms, selects, [onclick]), and record any
   console errors / failed network requests that happened just from loading
   the page. Use this to bootstrap the feature checklist instead of eyeballing
   the code for every element.

   python audit_runner.py discover --base-url http://localhost:3000 \
       --paths / /login /dashboard --out discovery.json

2. run — execute a scripted list of steps (see STEP FORMAT below) against a
   base URL, capturing console errors, failed (>=400) network responses, and
   a screenshot on every failure. Use this for Pass 2 once you've written out
   what each checklist row should actually do.

   python audit_runner.py run --base-url http://localhost:3000 \
       --steps steps.json --out results.json --screenshot-dir ./screenshots

STEP FORMAT (JSON list of objects), one "case" = one checklist row:
[
  {"name": "Login with valid creds", "steps": [
      {"action": "goto", "path": "/login"},
      {"action": "fill", "selector": "#email", "value": "test@example.edu"},
      {"action": "fill", "selector": "#password", "value": "Password123!"},
      {"action": "click", "selector": "button[type=submit]"},
      {"action": "expect_url_contains", "value": "/dashboard"},
      {"action": "expect_text", "selector": "#welcome", "value": "Welcome"}
  ]},
  {"name": "Empty login shows validation", "steps": [
      {"action": "goto", "path": "/login"},
      {"action": "click", "selector": "button[type=submit]"},
      {"action": "expect_visible", "selector": ".error-message"}
  ]}
]

Supported actions: goto, click, fill, check, uncheck, select_option, press,
wait_for_selector, wait_ms, screenshot, expect_url_contains, expect_text,
expect_visible, expect_hidden, expect_no_console_errors.

IMPORTANT LIMITATION: this runs inside a network-restricted sandbox. It can
only reach localhost (a dev server you start yourself in this same sandbox)
or domains on the sandbox's egress allowlist. It CANNOT reach arbitrary
deployed URLs (e.g. a Vercel prod URL) — for those, use a browser-capable
connector/tool instead of this script.
"""

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urljoin

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Playwright not installed. Run: pip install playwright --break-system-packages && playwright install chromium", file=sys.stderr)
    sys.exit(1)

ELEMENT_SELECTORS = [
    "button", "a[href]", "input", "select", "textarea",
    "[role=button]", "[onclick]", "[role=tab]", "[role=menuitem]",
]


def _describe_element(handle):
    try:
        tag = handle.evaluate("el => el.tagName.toLowerCase()")
        el_id = handle.get_attribute("id") or ""
        text = (handle.inner_text() or "").strip()[:60]
        name = handle.get_attribute("name") or ""
        el_type = handle.get_attribute("type") or ""
        href = handle.get_attribute("href") or ""
        disabled = handle.get_attribute("disabled")
        return {
            "tag": tag, "id": el_id, "name": name, "type": el_type,
            "text": text, "href": href, "disabled": disabled is not None,
            "suggested_selector": f"#{el_id}" if el_id else (f"{tag}:has-text(\"{text}\")" if text else tag),
        }
    except Exception as e:
        return {"error": str(e)}


def discover(base_url, paths, headless=True):
    report = {"base_url": base_url, "pages": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        for path in paths:
            page = browser.new_page()
            console_errors, failed_requests = [], []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("response", lambda resp: failed_requests.append({"url": resp.url, "status": resp.status}) if resp.status >= 400 else None)
            url = urljoin(base_url, path)
            page_report = {"path": path, "url": url}
            try:
                page.goto(url, wait_until="networkidle", timeout=15000)
                elements = []
                for sel in ELEMENT_SELECTORS:
                    for handle in page.query_selector_all(sel):
                        elements.append(_describe_element(handle))
                page_report["elements"] = elements
                page_report["console_errors"] = console_errors
                page_report["failed_requests"] = failed_requests
                page_report["status"] = "loaded"
            except Exception as e:
                page_report["status"] = "error"
                page_report["error"] = str(e)
            report["pages"].append(page_report)
            page.close()
        browser.close()
    return report


def _run_step(page, base_url, step, console_errors, failed_requests):
    action = step["action"]
    if action == "goto":
        page.goto(urljoin(base_url, step["path"]), wait_until="networkidle", timeout=15000)
    elif action == "click":
        page.click(step["selector"], timeout=step.get("timeout", 5000))
    elif action == "fill":
        page.fill(step["selector"], step["value"], timeout=step.get("timeout", 5000))
    elif action == "check":
        page.check(step["selector"], timeout=step.get("timeout", 5000))
    elif action == "uncheck":
        page.uncheck(step["selector"], timeout=step.get("timeout", 5000))
    elif action == "select_option":
        page.select_option(step["selector"], step["value"], timeout=step.get("timeout", 5000))
    elif action == "press":
        page.press(step["selector"], step["value"], timeout=step.get("timeout", 5000))
    elif action == "wait_for_selector":
        page.wait_for_selector(step["selector"], timeout=step.get("timeout", 5000))
    elif action == "wait_ms":
        page.wait_for_timeout(step["value"])
    elif action == "screenshot":
        page.screenshot(path=step["path"])
    elif action == "expect_url_contains":
        assert step["value"] in page.url, f"Expected URL to contain '{step['value']}', got '{page.url}'"
    elif action == "expect_text":
        actual = page.inner_text(step["selector"])
        assert step["value"] in actual, f"Expected text '{step['value']}' in selector '{step['selector']}', got '{actual}'"
    elif action == "expect_visible":
        assert page.is_visible(step["selector"]), f"Expected '{step['selector']}' to be visible"
    elif action == "expect_hidden":
        assert not page.is_visible(step["selector"]), f"Expected '{step['selector']}' to be hidden"
    elif action == "expect_no_console_errors":
        assert not console_errors, f"Unexpected console errors: {console_errors}"
    else:
        raise ValueError(f"Unknown action: {action}")


def run(base_url, cases, screenshot_dir, headless=True):
    Path(screenshot_dir).mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        for case in cases:
            page = browser.new_page()
            console_errors, failed_requests = [], []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            page.on("response", lambda resp: failed_requests.append({"url": resp.url, "status": resp.status}) if resp.status >= 400 else None)
            case_result = {"name": case["name"], "status": "pass", "console_errors": [], "failed_requests": []}
            try:
                for step in case["steps"]:
                    _run_step(page, base_url, step, console_errors, failed_requests)
                case_result["console_errors"] = console_errors
                case_result["failed_requests"] = failed_requests
                if console_errors or failed_requests:
                    case_result["status"] = "pass_with_warnings"
            except Exception as e:
                case_result["status"] = "fail"
                case_result["error"] = str(e)
                case_result["console_errors"] = console_errors
                case_result["failed_requests"] = failed_requests
                shot_path = str(Path(screenshot_dir) / f"{case['name'].replace(' ', '_')[:50]}.png")
                try:
                    page.screenshot(path=shot_path)
                    case_result["screenshot"] = shot_path
                except Exception:
                    pass
            results.append(case_result)
            page.close()
        browser.close()
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="mode", required=True)

    d = sub.add_parser("discover")
    d.add_argument("--base-url", required=True)
    d.add_argument("--paths", nargs="+", default=["/"])
    d.add_argument("--out", required=True)
    d.add_argument("--headed", action="store_true")

    r = sub.add_parser("run")
    r.add_argument("--base-url", required=True)
    r.add_argument("--steps", required=True, help="Path to JSON file with test cases")
    r.add_argument("--out", required=True)
    r.add_argument("--screenshot-dir", default="./screenshots")
    r.add_argument("--headed", action="store_true")

    args = parser.parse_args()

    if args.mode == "discover":
        report = discover(args.base_url, args.paths, headless=not args.headed)
        Path(args.out).write_text(json.dumps(report, indent=2))
        total_elements = sum(len(p.get("elements", [])) for p in report["pages"])
        print(f"Discovered {total_elements} interactive elements across {len(report['pages'])} page(s). Wrote {args.out}")
    else:
        cases = json.loads(Path(args.steps).read_text())
        results = run(args.base_url, cases, args.screenshot_dir, headless=not args.headed)
        Path(args.out).write_text(json.dumps(results, indent=2))
        passed = sum(1 for r in results if r["status"].startswith("pass"))
        failed = sum(1 for r in results if r["status"] == "fail")
        print(f"{passed} passed, {failed} failed, out of {len(results)}. Wrote {args.out}")


if __name__ == "__main__":
    main()
