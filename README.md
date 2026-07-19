# ⚒️ Colabro

> **Find collaborators. Build real projects. Together.**

Colabro is a full-stack web platform where college students can post project ideas, discover teammates with the right skills, and collaborate — all within their campus community.

---

## 💡 Why I Built This

Finding the right teammates for projects and hackathons in college is broken. You post in WhatsApp groups, ask around in class, and hope someone with the right skills sees your message. Teams end up forming out of convenience rather than compatibility.

I wanted to fix that. Colabro makes team formation **intentional** — you post your idea, tag the skills you need, and people who actually fit can find you and apply. No more spamming group chats.

The platform is restricted to verified educational email addresses (`.edu`, `.edu.in`, `.ac.in`, etc.), so only real students from real institutions can use it. This keeps the community genuine and spam-free.

---

## ✨ Features

### 🏠 Dashboard
A unified home screen that brings together everything — your projects, applications, notifications, bookmarks, recommended projects, and hackathon listings in one place. Personalized greeting, quick stats, and sidebar widgets give you a snapshot of your activity at a glance.

### 📋 Projects
- **Post your project** — Describe your idea, tag required skills (React, Python, Figma, etc.), and publish to the community
- **Discover projects** — Browse and filter by department, skill, and status (Open / Closed / Full)
- **Search** — Full-text search across project titles and descriptions
- **Project detail pages** — View full descriptions, owner profiles, skill tags, and apply to join

### 📩 Applications
- **Apply to collaborate** — Send a message to project owners explaining why you'd be a good fit
- **Accept / Reject** — Project owners can review applications and accept or reject them
- **Status tracking** — Track all your outgoing applications (Pending / Accepted / Rejected)

### 👥 People Directory
- Browse all registered users on the platform
- Filter by department, skill, and availability
- View profiles with bio, GitHub, LinkedIn, and skill tags

### 🔖 Bookmarks
Save interesting projects to revisit later.

### 🔔 Notifications
Real-time in-app notifications for application events — when someone applies to your project, when your application gets accepted or rejected, and system announcements. Mark as read individually or all at once.

### 👤 Profiles
- Public profiles with avatar, bio, department, year, and skill tags
- GitHub and LinkedIn links
- View a user's published projects directly from their profile

### 🏆 Hackathons
Browse a curated list of upcoming hackathons with dates, locations, team sizes, prizes, and registration links.

### 🛡️ Admin Panel
- **Overview dashboard** — Platform-wide stats (users, projects, applications, notifications)
- **User management** — View, search, promote to admin, or delete users
- **Project management** — Browse and manage all projects
- **Hackathon management** — Add hackathons manually or bulk-import via Excel/CSV upload

### 🔐 Authentication
- **Google OAuth** sign-in via Auth.js (NextAuth v5)
- **Edu-only access** — Only `.edu`, `.edu.in`, and `.ac.in` email domains are allowed
- **Onboarding flow** — New users complete their profile (name, department, year) before accessing the dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components) |
| **Language** | TypeScript |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Database** | PostgreSQL via [Prisma ORM](https://www.prisma.io/) |
| **Auth** | [Auth.js / NextAuth v5](https://authjs.dev/) (Google OAuth + JWT sessions) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Spreadsheets** | [SheetJS (xlsx)](https://sheetjs.com/) — for hackathon bulk import |
| **Font** | [Inter](https://fonts.google.com/specimen/Inter) via `next/font` |

---

## 🗂️ Project Structure

```
colabro/
├── prisma/
│   ├── schema.prisma          # Database schema (7 models)
│   └── seed.ts                # Database seed script
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Signup, Onboarding
│   │   ├── admin/             # Admin dashboard (stats, user/project/hackathon mgmt)
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   ├── applications/  # Apply, Accept, Reject
│   │   │   ├── notifications/ # Fetch, Mark read
│   │   │   ├── projects/      # CRUD, Bookmarks
│   │   │   ├── user/          # Profile updates
│   │   │   └── admin/         # Hackathon import
│   │   ├── dashboard/         # Main dashboard (tabbed: home, projects, applications,
│   │   │                      #   notifications, people, bookmarks, hackathons, profile)
│   │   ├── profile/[id]/      # Public user profiles
│   │   ├── projects/          # Browse, Create, Detail
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Design system (light theme, custom tokens)
│   │   └── page.tsx           # Public landing page
│   ├── components/
│   │   ├── AppShell.tsx       # Authenticated layout with sidebar & navbar
│   │   ├── Navbar.tsx         # Server-side navbar
│   │   ├── NavbarClient.tsx   # Client-side navbar (notifications dropdown)
│   │   ├── NavigationProgress.tsx  # Top loading bar
│   │   ├── OnboardingModal.tsx
│   │   ├── ProjectCard.tsx    # Reusable project card
│   │   └── ProjectFilters.tsx # Search + filter controls
│   └── lib/
│       ├── auth.ts            # Auth.js config (Google provider, edu email check)
│       ├── prisma.ts          # Prisma client singleton
│       └── resend.ts          # Email client setup
└── package.json
```

---

## 🧩 Database Models

| Model | Purpose |
|-------|---------|
| **User** | Accounts with name, email, department, year, bio, skills, GitHub/LinkedIn, and role (USER/ADMIN) |
| **Project** | Project listings with title, description, status (OPEN/FULL/CLOSED), and owner |
| **Skill** | Shared skill tags — many-to-many with both Users and Projects |
| **Application** | Collaboration requests linking a User to a Project (PENDING/ACCEPTED/REJECTED) |
| **Notification** | In-app notifications for application events and system messages |
| **Bookmark** | Saved/bookmarked projects per user (composite primary key) |
| **Hackathon** | Hackathon event listings with title, date, location, team size, prize, and link |

---

## 🚧 Challenges I Faced

### Auth.js v5 Beta + Google OAuth
Auth.js v5 was still in beta, and the docs were incomplete. Wiring up Google OAuth with a custom sign-in callback that checks for `.edu` email domains, auto-creates users in the database, and enriches JWT tokens with user data from Prisma took significant trial and error.

### Server Components vs Client Components
This was built with Next.js 16's App Router, which heavily leans on Server Components. Understanding the boundary — what fetches data on the server, what needs `"use client"`, and how to pass serialized data between them without redundant network calls — was a steep learning curve.

### The Dashboard Monster
The dashboard is the heart of the app. It consolidates 8 different views (home, projects, applications, notifications, people, bookmarks, hackathons, profile) into a single tabbed interface. The server page fires 10 parallel Prisma queries via `Promise.all` and feeds everything into a massive client component. Keeping that data flow clean and fast was the hardest architectural challenge.

### Prisma Schema Design
Getting the relationships right between Users, Projects, Skills, Applications, Notifications, and Bookmarks — with proper cascading deletes, unique constraints (`@@unique([projectId, userId])`), and composite primary keys (`@@id([userId, projectId])`) — required careful upfront planning.

### Making It Feel Fast Without WebSockets
I wanted the UI to feel snappy without the complexity of real-time infrastructure. Using React `useTransition` for non-blocking updates, `router.refresh()` for server-side data revalidation, and optimistic UI patterns gave the dashboard a responsive feel without WebSockets or polling.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** database (local or hosted — e.g. [Neon](https://neon.tech/), [Supabase](https://supabase.com/))
- **Google OAuth** credentials from [Google Cloud Console](https://console.cloud.google.com/)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/moses-fdo/project-finder.git
cd project-finder

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env file in the root with:
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/colabro"
AUTH_SECRET="your-random-secret-string"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
```

```bash
# 4. Set up the database
npx prisma generate
npx prisma db push

# 5. (Optional) Seed sample data
npx prisma db seed

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with a Google account that has an `.edu` email address.

---

## 📜 License

This is a personal project built for learning and portfolio purposes.

---

<p align="center">
  <strong>Built with ☕ and late nights by Moses Fernando</strong>
</p>
