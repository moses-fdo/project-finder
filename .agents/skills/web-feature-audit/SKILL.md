---
name: web-app-feature-audit
description: Thoroughly discover and test every feature of a web app — including small, easy-to-miss ones like tooltips, keyboard shortcuts, empty states, hover states, form validation, and secondary buttons — then actually exercise each one (via browser automation) and cross-check against the code to confirm it works end-to-end. Use this whenever the user asks to "test my app," "QA this," "make sure everything works," "click through my site," "find bugs," "check all the features," or similar, even if they only mention one specific feature — always sweep for related features nearby. Do NOT use this for pure code review with no runtime verification, or for unit-test writing — this skill is specifically for behavioral, click-through verification of a running app combined with code inspection.
---

# Web App Feature Audit

A two-pass workflow for finding *every* feature in a web app (not just the obvious ones) and proving each one actually works, rather than assuming it does from reading code or clicking a few happy paths.

The core failure mode this skill avoids: testing only the 4-5 features a person would naturally think to try, declaring "looks good!", and missing a broken settings toggle, a dead secondary button, or a form that silently fails validation.

## Before starting: pick an execution path

There are two ways to actually drive the browser. Pick based on what you're testing — don't default to one without checking:

**Path A — Self-driven Playwright (preferred whenever you can run the app yourself)**
If you have code execution (`bash_tool`) and can start the app locally (`npm run dev`, `python manage.py runserver`, etc.), use the bundled `scripts/audit_runner.py`. Playwright + Chromium are already installed in this sandbox — confirmed working, no setup needed. This path is fully automated: it can loop through dozens of checklist items unattended, catches *silent* failures a human click-through would miss (console errors, failed API calls that don't visibly break the UI), and produces screenshots as evidence on every failure.

Critical operational detail: **background processes do not persist across separate bash tool calls.** Start the dev server and run the audit script in the *same* shell invocation, e.g.:
```bash
nohup npm run dev > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 3   # wait for the server to actually be ready — check /tmp/server.log if unsure
python3 scripts/audit_runner.py discover --base-url http://localhost:3000 --paths / /login /dashboard --out discovery.json
python3 scripts/audit_runner.py run --base-url http://localhost:3000 --steps steps.json --out results.json --screenshot-dir ./screenshots
kill $SERVER_PID
```
This path is limited to localhost and to domains on the sandbox's network egress allowlist (mainly package registries) — it **cannot** reach an already-deployed URL like a Vercel prod site, since that domain isn't whitelisted. Verify with a quick `curl -o /dev/null -w "%{http_code}" <url>` before assuming it'll work; a 403 means it's blocked and you need Path B instead.

**Path B — Browser connector/tool (for already-deployed sites, or when there's no code-execution environment)**
Check available MCP connectors / tools for something browser-capable (e.g. a Chrome connector). If nothing browser-capable is available, run `search_mcp_registry` for `["browser", "playwright", "chrome", "puppeteer"]` and use `suggest_connectors` if something relevant turns up. This path is manual/interactive rather than scripted — you click through steps one at a time yourself.

If neither path is available, say so plainly and ask the user how they'd like to proceed — do not fake test results by reasoning about what "probably" happens when a button is clicked.

Also confirm **code access** — local repo, uploaded files, or a GitHub repo you can clone/fetch — since Pass 1 needs it regardless of which execution path you use for Pass 2.

## Pass 1: Build the feature inventory (from code)

Goal: a complete list of distinct, testable features — not a summary of the architecture.

Search the codebase for every source of user-facing behavior, not just the main pages:

- **Routes/pages** — every route file, page component, or URL pattern
- **Interactive elements per page** — every button, link, form, dropdown, modal/dialog, toggle, tab, accordion, tooltip, keyboard shortcut, drag-and-drop zone
- **Forms specifically** — every field, every validation rule, every error/success state, every submit path (including secondary actions like "save as draft")
- **State-dependent UI** — empty states, loading states, error states, disabled states, permission-gated UI (what does a logged-out user see vs logged-in vs admin?)
- **API endpoints / server actions** — each one is a feature even if there's no obvious UI trigger; check for ones only reachable indirectly
- **Edge inputs** — what happens with empty input, max-length input, special characters, duplicate submissions, slow network (if there's optimistic UI)
- **Auth/session flows** — signup, login, logout, password reset, session expiry, OAuth callbacks, .edu/email verification if applicable
- **Notifications/side effects** — emails, toasts, websocket updates, redirects

If you're on Path A, run `scripts/audit_runner.py discover` against every route first — it lists every button, link, input, and form it finds in the live DOM per page, plus any console errors or failed requests that fire just from loading the page. Treat this as a first draft of the inventory, not the final one: it catches what's rendered, but not keyboard shortcuts, hover-only affordances, or logic gated behind an action you haven't performed yet (e.g. elements that only appear after login). Merge it with what you find in code.

Write the merged result out as a checklist (see `references/feature_checklist_template.md`) before running Pass 2. Group by page/area. Each row should be *one specific, verifiable behavior* — "clicking Save persists the change and shows a success toast," not "editing works."

Do not skip small stuff. A skill named "even lil features" exists specifically because tooltips, disabled-button states, and secondary CTAs are the first things people skip and the first things that break.

## Pass 2: Execute and verify (in the browser)

Go through the checklist top to bottom.

**On Path A:** translate each checklist row into a "case" in the JSON format `audit_runner.py run` expects (see the docstring at the top of the script for the full action list — goto, click, fill, expect_text, expect_visible, expect_no_console_errors, etc.), then run them in batches. This is the main advantage of Path A: it automatically flags *silent* failures — a click that fires a broken API call and updates nothing, but doesn't throw a visible error — because it watches the console and every network response, not just what's visibly on screen. A checklist row that "looks fine" but triggered a console error or a 500 response should still be logged as a fail or at least flagged, not waved through.

**On Path B (or any manual step, on either path):**
1. **Navigate/act** using the browser tool — actually click, type, submit. Don't simulate this in your head.
2. **Observe the real result**: does the UI update as expected? Check the browser console for errors, check network requests for failed/unexpected status codes if the tool surfaces them.
3. **Cross-check against the code** when the result is ambiguous — e.g. if a save button appears to do nothing, look at its handler to see if it's wired up, silently failing, or waiting on a broken API call.
4. **Mark the result**: Pass / Fail / Blocked (couldn't test — note why, e.g. "needs admin account").
5. **On Fail**: capture what happened (error message, screenshot, console/network detail) and note the likely file/line if the code inspection points to one. Don't just say "broken" — say what you did, what you expected, and what actually happened.

Whichever path produced the result, roll it back into the checklist table (`references/feature_checklist_template.md`) as the single source of truth for the report — don't leave results scattered across raw JSON and prose.

Be genuinely adversarial, not just a happy-path clicker:
- Submit forms with empty/invalid data, not just valid data
- Double-click submit buttons to check for duplicate-submission bugs
- Try the back button after a multi-step flow
- Check what an unauthenticated or wrong-role user can reach directly by URL
- Check mobile viewport, since responsive bugs are common and easy to skip — on Path A this is just `page.set_viewport_size({"width": 375, "height": 667})` before running a case (add this as an option to `audit_runner.py` if you're running a lot of mobile cases); on Path B, only do this if the tool exposes a viewport control

## Reporting

Give the user:
- A pass/fail table (from the checklist, filled in) — this is the primary deliverable, not prose
- A short list of concrete bugs found, each with repro steps, a rough severity (blocker / major / minor / cosmetic), and, where you identified it, the likely cause in code
- Anything you couldn't test and why (missing test account, missing browser tool, feature requires payment, etc.) — be explicit about coverage gaps rather than implying full coverage was achieved

If there are more than a handful of bugs, offer to fix the clear-cut ones directly in the code rather than just listing them, but confirm before making changes to files the user didn't explicitly ask you to edit.

## Notes

- Never run destructive actions (deleting real user data, sending real emails to real addresses, charging real payment methods) against anything that isn't clearly a local/test/staging environment. Ask first if it's ambiguous.
- If the app requires credentials you don't have, ask for test credentials rather than skipping auth-gated areas — those are often where the most bugs hide.
- For larger apps, it's fine to do this area-by-area across multiple turns rather than trying to cover everything in one pass — tell the user your plan and checkpoint with them.
