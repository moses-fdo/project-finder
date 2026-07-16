# Deployment Guide: Karunya Collab Project Finder

This guide provides step-by-step instructions to deploy the **Karunya Collab** Next.js application as a production-ready, full-fledged web application.

---

## 🏗️ Architecture & Pre-deployment Overview

The application is built on a modern full-stack TypeScript stack:
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **ORM:** Prisma
- **Database (Development):** SQLite (`dev.db` file)
- **Authentication:** Auth.js (NextAuth v5)
- **Emails / OTP Verification:** Resend

> [!IMPORTANT]
> **The SQLite Database Limitation**
> While SQLite is excellent for local development, it is **not suited** for serverless production environments (like Vercel). Serverless instances are ephemeral—meaning write operations to a local file will be lost whenever the serverless function spins down.
> 
> To deploy this as a full-fledged application, you should migrate to a cloud-hosted relational database (like **PostgreSQL**) OR deploy on a platform with persistent disk storage (like **Railway** or **Fly.io** using persistent volume mounts).

---

## 🛠️ Step 1: Database Migration (SQLite to PostgreSQL)

To migrate the schema from SQLite to PostgreSQL:

1. **Update the Prisma Schema**
   Open `prisma/schema.prisma` and change the database provider to `postgresql`:
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Clean Up SQLite Migrations**
   Delete the SQLite migration files since SQL syntax differences will cause failures on PostgreSQL:
   - Delete the `prisma/migrations` folder.

3. **Obtain a PostgreSQL Database URL**
   Create a managed PostgreSQL database. Recommended providers:
   - **Neon** (Serverless PostgreSQL, offers a generous free tier)
   - **Supabase** (PostgreSQL with database, authentication, and storage features)
   - **Railway / Render** (Provision a managed database alongside your app)
   
   Your database URL will look similar to:
   ```env
   DATABASE_URL="postgresql://username:password@ep-cool-snowflake-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

4. **Generate PostgreSQL Client & Schema**
   Run the following commands locally to regenerate the Prisma client and push your schema to the new PostgreSQL database:
   ```bash
   # Generates the Prisma client
   npx prisma generate

   # Direct schema push for fast setup (or npx prisma migrate dev --name init to generate SQL migrations)
   npx prisma db push
   ```

5. **Seed lookup tables (Skills)**
   Seed your new PostgreSQL database with the default skill tags:
   ```bash
   npx prisma db seed
   ```

---

## 🔐 Step 2: Configure Environment Variables

Create your production environment variables. Do not commit these to GitHub.

| Variable Name | Description | Example / How to generate |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | Secret key used by NextAuth to sign session tokens | Generate with `openssl rand -base64 33` or run `npx auth secret` |
| `RESEND_API_KEY` | Resend API key for OTP verification | Obtain from your [Resend Dashboard](https://resend.com) |
| `EMAIL_FROM` | Verified domain sender address | `noreply@yourdomain.com` (Defaults to `onboarding@resend.dev` in dev) |
| `NEXTAUTH_URL` | Canonical URL of the website (Needed for non-Vercel platforms) | `https://karunya-collab.vercel.app` |

---

## 🚀 Step 3: Choose Your Deployment Platform

Here are the three best paths to deploy your Next.js application:

### Option A: Vercel + Neon Postgres (Recommended & Simplest)

Vercel is the creator of Next.js and provides native serverless support.

1. **Push your code to GitHub/GitLab/Bitbucket.**
2. **Deploy on Vercel:**
   - Log in to [Vercel](https://vercel.com).
   - Click **Add New** > **Project** and import your Git repository.
3. **Configure Build & Development Settings:**
   - Vercel automatically detects Next.js.
   - Expand the **Environment Variables** section and add all items from **Step 2** (`DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`).
4. **Define Post-install / Build Script Hook:**
   To ensure that Prisma client is generated during build time on Vercel, verify your package.json build script. If needed, you can prepend the prisma generate step:
   ```json
   "build": "prisma generate && next build"
   ```
5. **Deploy:** Click **Deploy**. Vercel will build the frontend, deploy serverless functions for the API routes, and link your custom domain.

---

### Option B: Railway (PaaS - Supports SQLite with volume or PostgreSQL)

Railway is excellent if you want to deploy without changing SQLite to PostgreSQL, or if you prefer a single-provider hosted dashboard.

#### Way 1: SQLite with Persistent Disk
1. Set up a volume in Railway under `/data`.
2. Configure your `DATABASE_URL` as:
   ```env
   DATABASE_URL="file:/data/dev.db"
   ```
3. During startup, Railway will persist this SQLite database file, keeping your data intact between redeployments.

#### Way 2: Managed PostgreSQL
1. Click **+ New Project** in Railway and choose **Provision PostgreSQL**.
2. Click **+ New** > **GitHub Repo** and connect your repo.
3. Link the PostgreSQL database to the Next.js app container. Railway will automatically inject `DATABASE_URL` from the PostgreSQL service.
4. Set the rest of the environment variables (`AUTH_SECRET`, `RESEND_API_KEY`, etc.).
5. Railway will automatically build and deploy.

---

### Option C: Self-Hosting using Docker (VPS / AWS EC2 / DigitalOcean)

If you wish to deploy on your own server, Docker is the most robust and consistent method.

1. **Enable Standalone Builds in Next.js**
   Update `next.config.ts` to enable standalone production server output, which greatly reduces Docker image size:
   ```typescript
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     output: "standalone",
   };

   export default nextConfig;
   ```

2. **Add a `Dockerfile`**
   Create a file named `Dockerfile` in the root of the project:
   ```dockerfile
   # Dockerfile
   FROM node:20-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app

   COPY package.json package-lock.json ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .

   ENV NEXT_TELEMETRY_DISABLED 1
   RUN npx prisma generate
   RUN npm run build

   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app

   ENV NODE_ENV production
   ENV NEXT_TELEMETRY_DISABLED 1

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public

   # Set the correct permission for prerender cache
   RUN mkdir .next
   RUN chown nextjs:nodejs .next

   # Automatically leverage output traces to reduce image size
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

   USER nextjs

   EXPOSE 3000
   ENV PORT 3000

   CMD ["node", "server.js"]
   ```

3. **Add `docker-compose.yml`**
   Create a `docker-compose.yml` to launch the app and a postgres DB container together:
   ```yaml
   version: '3.8'

   services:
     web:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://postgres:mysecretpassword@db:5432/collabdb?schema=public
         - AUTH_SECRET=your_auth_secret_here
         - RESEND_API_KEY=your_resend_api_key_here
         - EMAIL_FROM=noreply@yourdomain.com
       depends_on:
         - db

     db:
       image: postgres:15-alpine
       restart: always
       environment:
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=mysecretpassword
         - POSTGRES_DB=collabdb
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"

   volumes:
     postgres_data:
   ```

4. **Launch docker-compose**
   Run the following commands on your server:
   ```bash
   docker-compose up -d --build
   
   # Run prisma migrations inside the web container
   docker-compose exec web npx prisma migrate deploy
   
   # Seed database
   docker-compose exec web npx prisma db seed
   ```

---

## 📧 Step 4: Resend Email Domain Setup

Since the application requires `@karunya.edu.in` emails to register and verifies them via 6-digit OTP codes:

1. **Verify your Custom Domain on Resend:**
   - Go to your Resend dashboard -> **Domains** -> **Add Domain**.
   - Input your custom domain (e.g., `collab.karunyastudents.com` or your institution domain if you have access).
   - Add the specified DNS records (MX, TXT) to your Domain Registrar (Cloudflare, GoDaddy, Namecheap, etc.) to verify ownership.
2. **Update the `EMAIL_FROM` variable:**
   - Once verified, configure the env variable `EMAIL_FROM="noreply@collab.karunyastudents.com"` (replace with your domain).
   - *Note: If you don't verify a domain, Resend will only let you send emails to your own account registered under the developer dashboard, meaning signup will fail for regular users.*

---

## ✅ Post-Deployment Checklist

- [ ] Check if `/login` and `/signup` render properly on your production URL.
- [ ] Attempt to sign up a new account. Check if the OTP is delivered successfully to the user's `@karunya.edu.in` inbox (or check container/server logs if in development test mode).
- [ ] Log in with the newly created account.
- [ ] Create a new project post to verify writes work in the production database.
- [ ] Ensure all API endpoints (`/api/projects`, `/api/applications`, `/api/notifications`) respond correctly without CORS issues.
