# Feature Checklist Template

Use one table per page/area. Fill in during Pass 1 (from code), then complete Result/Notes during Pass 2 (from the browser).

## [Page/Area name] — e.g. "Login page", "Project creation flow"

| # | Feature / behavior | How to trigger | Expected result | Result (Pass/Fail/Blocked) | Notes |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |

Guidance for filling "Feature / behavior":
- Be specific and single-purpose: "Password field shows error if under 8 chars" not "password validation"
- Include negative/edge cases as their own rows, not footnotes: "Submitting empty form shows inline errors on all required fields"
- Include small stuff as its own row: tooltips, disabled states, hover states, secondary buttons, keyboard shortcuts, loading spinners, empty states

Guidance for "Notes" on a Fail:
- What you did (exact steps)
- What you expected
- What actually happened (error text, console output, network status)
- File/line if you traced it in code, or "not investigated" if you didn't

## Summary (fill in after all areas are done)

- Total features tested: 
- Pass: 
- Fail: 
- Blocked (and why): 
- Areas not covered in this pass (and why):
