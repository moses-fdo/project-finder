# ⚒️ Colabro

> **Find collaborators. Build real projects. Together.**

Colabro is a full-stack campus platform where college students post project ideas, get matched with teammates who actually have the right skills, and collaborate — verified, credible, and spam-free.

---

## 💡 Why I Built This

Finding teammates for projects and hackathons in college is broken. You post in WhatsApp groups, ask around in class, and hope someone with the right skills sees your message. Teams form out of convenience, not compatibility — and anyone can claim any skill with zero way to verify it.

Colabro fixes both problems:

- **Intentional matching** — post your idea, tag the skills you need, and people who actually fit can find and apply to you.
- **Verified credibility** — instead of a self-reported skills list, contributors get a live, GitHub-driven reputation score, so "knows React" actually means something.
- **Genuine community** — access is gated to verified educational email addresses (`.edu`, `.edu.in`, `.ac.in`), with an ID-verification fallback for edge cases, keeping the platform real students only.

---

## ✨ Features

### 🏠 Dashboard
A unified home screen — projects, applications, invitations, notifications, events, and a collaborator finder — in one tabbed interface, with a personalized greeting and activity snapshot.

### 📋 Projects
- Post a project, tag required skills, and publish to the community
- Browse and filter by category, skill, experience level, and status (Open / Full / Closed / Done)
- Team capacity auto-tracks: status flips between Open and Full as slots fill
- Full-text search across titles and descriptions

### 📩 Applications & Invitations
- Apply to a project with a message explaining your fit
- Project owners accept or reject applicants
- Withdraw a pending application at any time
- Owners can also directly **invite** users to a project, not just wait for applications

### ⭐ Developer Reputation
A live scoring system that replaces self-reported skills with something verifiable:

- **GitHub-driven score** — pulls real activity via the GitHub API
- **Weighted signal blend** — GitHub activity, experience, certifications, and community engagement each contribute, GitHub weighted heaviest
- **Anti-gaming safeguards** — decay on stale activity, caps on artificial commit bursts, filtering against spam patterns
- **Graceful degradation** — falls back to a deterministic offline calculation if GitHub's API is unreachable
- **Tiers & stars** — scores roll up into a tier and star rating shown on profiles and the campus leaderboard
- LinkedIn adds an additional verification signal on top of the GitHub-based score

### 🔍 Collaborator Finder
Browse all registered users with pagination, filter by department, skill, and availability, and view reputation alongside profile details.

### 🏆 Campus Leaderboard
Surfaces top contributors by reputation score across the platform.

### 🔔 Notifications
Real-time in-app notifications for application and invitation events, with mark-as-read support.

### 👤 Profiles
Public profiles with bio, department, year, skill tags, GitHub/LinkedIn links, and reputation display.

### 🎓 Student ID Verification
A fallback verification path for users whose institution isn't in the standard `.edu`-style domain list — upload an ID card for manual admin review.

### 🛡️ Moderation
A separate Python (FastAPI) microservice screens messages and content for abuse, backed by a large flagged-term list, with logging and an admin review tab for repeat offenders.

### 🛠️ Admin Panel
- Platform-wide stats: users, projects, applications, notifications
- User management: search, promote, delete
- Project and event management, including bulk import via Excel/CSV
- Abuse log review and manually-allowed email overrides

### 🔐 Authentication
- Google OAuth via Auth.js (NextAuth v5, beta)
- Edu-only access enforced at sign-in, with an admin-managed allowlist for exceptions
- Onboarding flow collects department, year, and profile basics before dashboard access

---

## 🛠️ Tech Stack

| Layer            | Technology |
| ----------------- | ---------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI**             | React 19 |
| **Language**       | TypeScript |
| **Styling**        | Tailwind CSS 4 (CSS-first config) |
| **Database**       | PostgreSQL (Neon serverless) |
| **ORM**            | Prisma ORM 6, with Neon serverless driver adapter |
| **Auth**           | Auth.js / NextAuth v5 (Google OAuth + JWT) |
| **Validation**     | Zod |
| **Email**          | Fallback chain: Brevo → Gmail SMTP → Resend → console |
| **Image hosting**  | Cloudinary |
| **Spreadsheets**   | `read-excel-file` — for admin bulk import |
| **Animation/3D**   | GSAP, Framer Motion, Lenis, Three.js |
| **Moderation**     | Python FastAPI microservice (separate from the main app) |
| **Icons**          | Lucide React |
| **Testing**        | Playwright |

---

## 🗂️ Project Structure

```
colabro/
├── prisma/
│   └── schema.prisma           # 12 models — see below
├── classifier/                 # Python FastAPI abuse-detection microservice
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, signup, onboarding
│   │   ├── admin/              # Admin dashboard + management tabs
│   │   ├── api/                 # REST routes: projects, applications, invitations,
│   │   │                       #   notifications, reputation, moderation, admin, etc.
│   │   ├── dashboard/           # Tabbed dashboard (home, projects, applications,
│   │   │                       #   notifications, events, collaborator finder)
│   │   ├── profile/[id]/        # Public profiles
│   │   ├── projects/            # Browse, create, detail
│   │   └── page.tsx              # Public landing page
│   ├── components/
│   │   ├── reputation/          # ReputationCard, ReputationBadge
│   │   ├── moderation/          # Admin moderation UI
│   │   └── ...                  # Shared UI (cards, filters, modals, toasts)
│   ├── lib/
│   │   ├── auth.ts               # Auth.js config, edu-domain enforcement
│   │   ├── prisma.ts             # Prisma client + Neon cold-start retry handling
│   │   ├── moderation.ts         # Abuse-classifier integration
│   │   ├── projects/capacity.ts  # Auto open/full status sync
│   │   └── reputation/           # Score calculator, config, GitHub/experience/
│   │                             #   certification/community collectors
│   └── types/
└── package.json
```

---

## 🧩 Database Models

| Model | Purpose |
| ----- | ------- |
| **User** | Account, profile, GitHub/LinkedIn links, role (USER/ADMIN), verification state |
| **Project** | Listings with status, category, team size, and capacity tracking |
| **Skill** | Shared tags — many-to-many with Users and Projects |
| **Application** | Collaboration requests (Pending/Accepted/Rejected) |
| **Invitation** | Direct owner-to-user project invites |
| **Notification** | In-app events for applications, invitations, and system messages |
| **Event** | Hackathon/event listings (current model) |
| **Hackathon** | Legacy event model, kept alongside `Event` |
| **AllowedEmail** | Admin-managed allowlist bypassing the edu-domain check |
| **IdVerificationRequest** | Manual student ID verification queue |
| **AbusiveMessageLog** | Moderation flags and repeat-offense tracking |
| **UserReputation** | Score, stars, tier, and per-signal breakdown for the reputation engine |

All foreign keys cascade on delete. Indexes are set on high-traffic lookups (status, ownerId, userId, score).

---

## 🚧 Challenges I Faced

### Auth.js v5 Beta + Google OAuth
Auth.js v5 was still in beta with incomplete docs. Wiring a custom sign-in callback that enforces `.edu`-style domains, auto-provisions users, and enriches JWTs with Prisma data took real trial and error.

### Serverless Database Cold Starts
Neon's serverless Postgres occasionally drops or delays connections. I added retry logic with backoff and fallback handling (`safeQuery`) across the Prisma client and auth flow so a cold start doesn't surface as a broken page.

### The Dashboard at Scale
Consolidating 6+ tabs (home, projects, applications, notifications, events, collaborator finder) into one interface meant firing many parallel queries per load. Some of that data-fetching strategy needed rethinking as the dashboard grew — a core architectural lesson from this project.

### Building a Score That Can't Be Gamed
The reputation engine pulls real GitHub activity, but raw commit counts are trivially gamed. I built in activity decay, caps on artificial commit bursts, and spam-pattern filtering so the score reflects genuine, sustained contribution — not a burst of throwaway commits before a demo.

### Content Moderation as a Separate Service
Rather than bolting abuse detection into the main Next.js app, it runs as an independent Python FastAPI service, keeping moderation logic decoupled and swappable.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** database (Neon recommended — the app has a Neon-specific serverless adapter path)
- **Google OAuth** credentials from [Google Cloud Console](https://console.cloud.google.com/)
- **Python 3** (for the moderation microservice, optional for local dev)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/moses-fdo/project-finder.git
cd project-finder

# 2. Install dependencies
npm install

# 3. Set up environment variables — create a .env file:
```

```env
DATABASE_URL="postgresql://user:password@host/colabro"
AUTH_SECRET="your-random-secret-string"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"

# Email (at least one of the fallback chain)
RESEND_API_KEY=""
BREVO_API_KEY=""
BREVO_SENDER_EMAIL=""
GMAIL_USER=""
GMAIL_PASS=""

# Image uploads
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_UPLOAD_PRESET=""

# Reputation engine
GITHUB_TOKEN=""

# Moderation microservice
CLASSIFIER_URL="http://127.0.0.1:8000"
```

```bash
# 4. Set up the database
npx prisma generate
npx prisma db push

# 5. (Optional) Seed sample data
npx prisma db seed

# 6. (Optional) Start the moderation microservice
cd classifier && ./start.bat   # or the equivalent for your OS

# 7. Start the dev server
npm run dev
```

Open `http://localhost:3000` and sign in with a Google account using an `.edu`-style email address.

---

## 📜 License

Personal project, built for learning and portfolio purposes.

---

**Built with ☕ and late nights by Moses Fernando**