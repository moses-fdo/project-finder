# Colabro: Full Audit — UI, Features, Performance, Architecture

Everything identified across the codebase (schema, `page.tsx`, `DashboardViewClient.tsx`, `AppShell.tsx`, live screenshots) and the product discussion so far, in one place. Organized by category, each item has a concrete fix.

---

## 1. UI / Visual issues

### 1.1 No contrast or hierarchy
Every card, badge, button, and divider uses the same near-black background with the same hairline border. Nothing is visually graded, so the eye has no path to follow.
**Fix:** replace borders-on-everything with layered surface elevation — background brightness steps (`bg-canvas` → `bg-card` → `bg-elevated`) instead of outlines. See the design system doc for exact tokens.

### 1.2 Avatar colors are random
Collaborators grid assigns colors (purple, green, orange, teal...) with no visible logic — reads as unstyled noise rather than a designed system.
**Fix:** deterministic 4-color palette hashed from user ID, not a full rainbow.

### 1.3 Color semantics collide
Green means "Open," "Available," and "Verified" — fine, consistent. But amber is used for "Corporate/MNC" category tags, prize pool amounts, *and* live-event badges — three unrelated meanings sharing one color, and status colors bleed into category tags.
**Fix:** lock down colors by meaning — green/amber/red reserved exclusively for state (open/pending/closed); categories and metadata get a neutral gray tag style, never a semantic color.

### 1.4 Typography is flat
Page titles ("Find collaborators," "Admin Console") use the same font/weight as body text, just larger — nothing signals "this is a heading."
**Fix:** dedicated display face (e.g. Space Grotesk) for titles/section headers, keep a clean body sans for everything else, monospace for tags/stats/IDs.

### 1.5 Duplicate search bars
The Dashboard has two search inputs doing the same job — the small `⌘K` trigger in the header and a large full-width search bar directly below it.
**Fix:** keep one primary search; the header version should just be a `⌘K` shortcut trigger, not a second full input.

### 1.6 Rendering bug — stray green divider
A bright green horizontal line cuts across the Bookmarks page roughly two-thirds down the screen, unrelated to any content.
**Fix:** find the stray `border-bottom` or full-width divider element with a hardcoded color — likely a leftover debug style or empty-state component boundary that shouldn't be visible.

### 1.7 No visible focus states
Buttons, links, and nav items have no visible keyboard-focus ring — a real accessibility gap, not just a style nitpick.
**Fix:** add a consistent 2px focus ring (offset 2px) on every interactive element; verify by tabbing through each page with a mouse unplugged.

### 1.8 Static-feeling admin stat cards
Admin Console's 4 stat tiles (Total users, Total projects, etc.) are flat numbers with no context — no sense of trend or change.
**Fix:** optional but cheap — small "+3 this week" or ↑ trend line under each number.

### 1.9 Landing page and app feel like two different products
The marketing site (light background, centered hero, generic gradient stat badges) doesn't share any visual language with the dark, dense dashboard.
**Fix:** either bring the landing page into the same dark system with a distinct hero treatment, or deliberately design the light landing page using the same type/color philosophy (same fonts, same accent violet) so the transition from marketing site to logged-in app doesn't feel jarring.

### 1.10 Design system gaps (from the current design doc)
- No light-mode token set, despite a sun/moon toggle existing in the header
- No form input states (focus/error/disabled) specified
- No responsive/breakpoint behavior for sidebar or grids
- No loading/skeleton state spec for async content
**Fix:** extend the design doc with these sections before implementing broadly — see the design system doc's "not yet complete" list.

---

## 2. Feature gaps

### 2.1 No messaging/chat
Once an application is accepted, there's currently no way for the two people to actually talk inside the app — they'd have to exchange contact info manually. This is a real gap for a platform whose entire premise is "getting a team assembled."
**Fix:** `Conversation`/`Message` Prisma models tied to accepted `Application` records; Pusher (or Ably) for real-time delivery; scoped per-application, not a generic open inbox. (Full schema and API sketch already discussed — ready to implement.)

### 2.2 No avatars or banner images
`User` model has no `avatarUrl`/`bannerUrl` fields — every profile and collaborator card falls back to initials-in-a-circle. Profiles feel impersonal, and public profile pages (`/profile/[id]`) have no visual identity.
**Fix:** add `avatarUrl`/`bannerUrl` as URL strings (never binary blobs in Postgres), upload via Cloudinary or Vercel Blob with client-side compression before upload.

### 2.3 No online/presence indicator
No way to see who's currently active — relevant once chat exists, since "is this person even online" affects whether to expect a fast reply.
**Fix:** Pusher/Ably presence channel for real online status, or a cheaper `lastActiveAt` + polling approach if avoiding another socket connection matters more than instant accuracy.

### 2.4 Bookmarks and Events aren't connected
Bookmarks exists as a feature, but Event/Hackathon cards (image 3) have no bookmark/save icon — so you can only ever bookmark projects, not hackathons, even though the empty state on Bookmarks explicitly mentions "hackathon opportunities."
**Fix:** add the same bookmark toggle to event cards that project cards already have.

### 2.5 No skill-match signal on project cards
Given the whole product thesis is skill-based matching, project cards don't currently show how well a viewer's own skills line up with what a project needs.
**Fix:** a lightweight "matches 3 of your 4 skills" indicator on cards, computed from the logged-in user's profile skills vs. the project's tags — turns a generic listing into a personalized one.

### 2.6 No recommendation surfacing for collaborators
The Collaborators page (image 2) shows all 34 users in one undifferentiated grid — no ranking by complementary skills, no "recommended for you" section.
**Fix:** pin a short "recommended" row above the full directory using the same skill-complementarity logic as 2.5.

### 2.7 No rate limiting / abuse protection on the paths that need it most
`AbusiveMessageLog` exists in the schema — a good instinct — but it's unclear whether it's actually wired into the application/invitation-sending flow yet, which is the most likely real-world abuse vector for a campus platform (spam applications, spam invites).
**Fix:** confirm rate limiting is active on `POST /api/applications` and `POST /api/invitations`, not just logged after the fact.

### 2.8 No error boundaries
A crash in one dashboard tab likely takes down the whole dashboard shell, since it's one large client component.
**Fix:** add `error.tsx` at the dashboard route segment; once tabs are split into separate files (see §3.3), each can get its own boundary.

---

## 3. Performance issues

### 3.1 Every tab's data loads on every dashboard request
`page.tsx` fires all 12 `Promise.all` queries regardless of `activeTab` — including a 100-row Collaborators query with nested relations and a 100-row Events query, even when the user is just looking at Home.
**Fix:** split into "always needed for shell" (unread count, profile) vs. tab-conditional queries, only running the branch that matches `activeTab`.

### 3.2 Duplicate notification query
`inboxNotifications` (take 10) and `notifications` (take 15) are the same query at two different limits.
**Fix:** fetch once at `take: 15`, slice to 10 in JS for the navbar dropdown.

### 3.3 Massive single client component
`DashboardViewClient.tsx` is 2,033 lines in one `"use client"` file — all 8 tabs' logic ships as one JS bundle to every visitor, hurting Time to Interactive.
**Fix:** split by tab into separate files, lazy-load each with `next/dynamic` so only the active tab's code downloads.

### 3.4 Five animation/motion libraries in one dependency tree
`gsap`, `@gsap/react`, `animejs`, `framer-motion`, `lenis`, plus `three` are all direct dependencies. This is very likely the single biggest bundle-size problem in the app.
**Fix:** consolidate to one animation library (Framer Motion covers nearly everything needed), remove the rest, and lazy-load `three` only on the specific page that uses it.

### 3.5 No indexes on foreign keys
`Notification.userId`, `Application.userId`, `Project.ownerId`, `Invitation.receiverId`/`senderId` are all filtered directly with no dedicated index.
**Fix:**
```prisma
model Notification { @@index([userId, createdAt]) }
model Application  { @@index([userId]) }
model Project       { @@index([ownerId]) }
model Invitation    { @@index([receiverId]) @@index([senderId]) }
```

### 3.6 Unbounded `take: 100` queries
People directory and Events both cap at 100 rows with no real pagination — fine for demo data, a growing problem as either table scales past that.
**Fix:** cursor-based pagination (`skip`/`cursor` in Prisma).

### 3.7 Potential binary image storage
If `IdVerificationRequest.idCardImage` (or any future avatar/banner field) stores base64 image data directly in Postgres rather than a URL, every query touching that table gets slower as rows accumulate.
**Fix:** confirm all image fields store only object-storage URLs, never binary/base64 blobs.

### 3.8 `any`-typed session user
`page.tsx` casts `(user as any).id` — a silent type-safety gap around session data.
**Fix:** proper `next-auth` module augmentation on `Session`/`User` types.

---

## 4. Code quality / architecture

### 4.1 Repeated Prisma `select` shapes
Near-identical `select` blocks for project cards appear in multiple places in `page.tsx`.
**Fix:** extract to a shared `projectCardSelect` constant, typed with `satisfies Prisma.ProjectSelect`.

### 4.2 Inconsistent Zod validation coverage
Zod is a dependency but it's unclear every API route (applications, projects, profile updates) validates input with it consistently.
**Fix:** audit every `POST`/`PATCH` route and ensure a Zod schema gates it before hitting Prisma.

### 4.3 "God component" pattern risk beyond the dashboard
The dashboard isn't necessarily the only oversized component — worth checking `AppShell.tsx` (763 lines) and any other large client files for the same issue.
**Fix:** general rule of thumb — a `.tsx` file over ~300-400 lines is a sign it's doing too many jobs; split by responsibility.

---

## 5. Suggested order of attack

**Week 1 — cheap, high-visibility fixes**
1. Fix avatar color logic + badge color semantics (§1.2, §1.3)
2. Remove duplicate dashboard search bar (§1.5)
3. Fix the stray green divider bug on Bookmarks (§1.6)
4. Add missing Prisma indexes (§3.5) — near-zero effort
5. Deduplicate the notification query (§3.2)

**Week 2 — bundle and query restructuring**
6. Remove unused animation libraries, consolidate to one (§3.4)
7. Split `DashboardViewClient.tsx` by tab + lazy-load (§3.3)
8. Make dashboard queries tab-conditional (§3.1)

**Week 3+ — feature work**
9. Avatars/banners (§2.2) — needed before chat feels complete, since conversations look bare without faces
10. Chat/messaging (§2.1)
11. Online status (§2.3)
12. Skill-match indicators + collaborator recommendations (§2.5, §2.6)

**Ongoing / as-encountered**
13. Design system extensions (light mode, form states, responsive spec) — §1.10
14. Zod coverage audit, rate-limiting confirmation, error boundaries — §4.2, §2.7, §2.8

This order front-loads the changes that are cheapest and most visible first, then tackles the two big structural problems (bundle size, query patterns) before adding new surface area with chat and profile media — building new features on top of the current dashboard component would only make the eventual refactor harder.
