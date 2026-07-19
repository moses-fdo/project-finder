# ⚒️ Forge — Campus Project Collaboration Platform

> **Find collaborators. Build real projects. Together.**

Forge is a full-stack web application built to solve a real problem I faced as a student at Karunya Institute of Technology & Sciences — **finding the right teammates for projects and hackathons.**

---

## 💡 Why I Built This

Every semester, the same story repeats: you have a great project idea or a hackathon coming up, but finding teammates with the right skills is a nightmare. You end up posting in WhatsApp groups, asking around in class, and hoping someone replies. Most of the time, teams are formed out of convenience — not compatibility.

I wanted to build something that changes that. **Forge** is a platform where students can:
- Post project ideas and the skills they need
- Browse other projects and apply to collaborate
- Discover hackathons and form teams around them
- Find people by department, year, and skill set

The idea is simple: **make team formation intentional, not accidental.**

---

## 🧩 What It Does

### For Students
- **🔐 Verified-only access** — Only `@karunya.edu.in` email addresses can register, verified through OTP
- **📋 Post projects** — Describe your idea, tag required skills, and publish it to the community
- **🔍 Discover & filter** — Browse projects by department, skill, and status
- **📩 Apply to collaborate** — Send a message to project owners with your application
- **🔖 Bookmark projects** — Save interesting projects for later
- **👤 Profiles** — Showcase your bio, skills, GitHub, and LinkedIn
- **🔔 Real-time notifications** — Get notified when someone applies, gets accepted, or gets rejected
- **🏆 Hackathon listings** — Browse upcoming hackathons with dates, locations, team sizes, and prizes

### For Admins
- **📊 Admin dashboard** — Manage users, projects, and hackathons
- **📥 Bulk hackathon import** — Upload hackathon data via Excel/CSV files
- **🛡️ User management** — View, verify, and manage registered users

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Database** | PostgreSQL via [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [Auth.js (NextAuth v5)](https://authjs.dev/) with credentials provider |
| **Email / OTP** | [Resend](https://resend.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Validation** | [Zod](https://zod.dev/) |
| **Font** | [Inter](https://fonts.google.com/specimen/Inter) via `next/font` |

---

## 🗂️ Project Structure

```
project-finder/
├── prisma/
│   ├── schema.prisma          # Database schema (7 models)
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Signup, Onboarding pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/          # Signup, Verify, NextAuth
│   │   │   ├── applications/  # Apply, Accept, Reject
│   │   │   ├── notifications/ # Mark read, fetch
│   │   │   ├── projects/      # CRUD + bookmarks
│   │   │   └── user/          # Profile updates
│   │   ├── dashboard/         # Main user dashboard
│   │   ├── profile/[id]/      # Public user profiles
│   │   ├── projects/          # Browse, Create, Detail pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Shared UI components
│   │   ├── AppShell.tsx       # Authenticated layout wrapper
│   │   ├── Navbar.tsx         # Server-side navbar
│   │   ├── NavbarClient.tsx   # Client-side navbar interactions
│   │   ├── NavigationProgress.tsx
│   │   ├── OnboardingModal.tsx
│   │   ├── ProjectCard.tsx
│   │   └── ProjectFilters.tsx
│   └── lib/
│       ├── auth.ts            # Auth.js configuration
│       ├── prisma.ts          # Prisma client singleton
│       └── resend.ts          # Email client
├── .env                       # Environment variables (not committed)
├── package.json
└── tsconfig.json
```

---

## 🚧 Challenges I Faced

### 1. Authentication with OTP Verification
Setting up Auth.js v5 (beta) with a custom credentials provider *and* email OTP verification was tricky. The docs were sparse, and most examples online used magic links or OAuth. I had to piece together the signup → OTP email → verification → login flow manually, handling edge cases like expired codes and re-sends.

### 2. Next.js 16 App Router Growing Pains
This was my first time building a full app with the App Router. Server Components vs Client Components took a while to click — figuring out what runs on the server, what needs `"use client"`, and how to pass data between them without prop drilling or redundant fetches was a learning curve.

### 3. The Dashboard Complexity
The dashboard became the most complex part of the app. It consolidates projects, applications, notifications, bookmarks, hackathons, and profile management into a single tabbed interface. Keeping the data flow clean between the server page (which fetches everything) and the client component (which handles all interactions) required careful architecture.

### 4. Real-Time-Feeling UX Without WebSockets
I wanted the app to feel responsive without the overhead of WebSockets. Using React transitions, optimistic updates, and server-side refetches gave the dashboard a snappy feel, but getting the timing right took a lot of iteration.

### 5. Prisma Schema Design
Designing the schema to handle the relationships between Users, Projects, Skills, Applications, Notifications, and Bookmarks — with proper cascading deletes and unique constraints — required careful planning upfront to avoid migration headaches later.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use SQLite for local dev)
- [Resend](https://resend.com/) API key for email verification

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/moses-fdo/project-finder.git
   cd project-finder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/forge"
   AUTH_SECRET="your-auth-secret"
   RESEND_API_KEY="re_your_resend_key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

---

## 📝 Database Models

| Model | Purpose |
|-------|---------|
| `User` | Student/faculty accounts with profile, skills, and role |
| `Project` | Project listings with owner, description, and status |
| `Skill` | Shared skill tags linking users and projects |
| `Application` | Collaboration requests between users and projects |
| `Notification` | In-app notifications for application events |
| `Bookmark` | Saved/bookmarked projects per user |
| `Hackathon` | Hackathon event listings with details |

---

## 📜 License

This project was built as a personal/academic project at Karunya Institute of Technology & Sciences.

---

<p align="center">
  <strong>Built with ☕ and late nights by Moses Fernando</strong>
</p>
