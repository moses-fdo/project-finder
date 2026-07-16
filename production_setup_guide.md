# Production Setup & Security Guide for Project Finder

This guide outlines the precise steps to transition your local Next.js project into a secure, production-ready web application with real-time authentication, active OTP email verification, and proper database hosting.

---

## 1. Setting up Real-Time OTP Email Verification (Resend)

Currently, the code falls back to printing the 6-digit OTP to the terminal console if `RESEND_API_KEY` is not configured. To send actual emails to users, follow these steps:

### A. Sign up on Resend
1. Go to [resend.com](https://resend.com) and create an account.
2. Navigate to your dashboard and create a new **API Key**.
3. Add the key to your `.env` file:
   ```env
   RESEND_API_KEY="re_your_api_key_here"
   ```

### B. Configure a Custom Sending Domain (Required for Production)
Resend's default sender (`onboarding@resend.dev`) will only send emails to the email address used to register the Resend account. To send emails to any `@karunya.edu.in` address:
1. In the Resend dashboard, go to **Domains** and click **Add Domain**.
2. Enter your domain (e.g., `yourdomain.com`).
3. Add the generated DNS records (SPF, DKIM, and MX) to your Domain Registrar (such as GoDaddy, Namecheap, or Cloudflare).
4. Once verified, update the email sender in [route.ts](file:///C:/Users/Moses%20Fernando/Documents/GitHub/project-finder/src/app/api/auth/signup/route.ts#L9-L15) by adding this to your `.env`:
   ```env
   EMAIL_FROM="noreply@yourdomain.com"
   ```

> [!IMPORTANT]
> If you do not have a custom domain yet, you can test with Resend's default sender, but you will only be able to sign up with the exact email address you registered your Resend account with.

---

## 2. Moving from Local SQLite to a Production Database

SQLite stores data in a local file (`dev.db`). If you deploy this to a serverless platform like **Vercel** or **Netlify**, the database will reset every few minutes because serverless functions are stateless and spin up/down on demand.

To build a full-fledged web application, you must use a hosted database (like PostgreSQL or MySQL).

### A. Spin up a Cloud Database
You can get a free-tier PostgreSQL database from providers like:
* **Supabase** (supabase.com)
* **Neon** (neon.tech)
* **Aiven** (aiven.io)

### B. Update the Prisma Schema
Change the database provider from `sqlite` to `postgresql` in [schema.prisma](file:///C:/Users/Moses%20Fernando/Documents/GitHub/project-finder/prisma/schema.prisma#L1-L4):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

> [!WARNING]
> SQLite uses `Int` with `@default(autoincrement())` for IDs. While PostgreSQL supports this, for higher security and scale, consider using `String` with `@default(uuid())` or `@default(cuid())` to prevent ID enumeration attacks (where someone guesses project IDs like `/projects/1`, `/projects/2`).

### C. Update the Connection URL
Update your `.env` file to point to your new cloud database:
```env
DATABASE_URL="postgresql://username:password@hostname:5432/dbname?sslmode=require"
```

### D. Run Database Migrations
Run the following commands to create the database schema in your cloud PostgreSQL instance and generate the updated Prisma Client:
```bash
npx prisma migrate dev --name init_postgres
npx prisma db seed
```

---

## 3. Configuring Secure Production Authentication (NextAuth / Auth.js)

NextAuth requires additional configuration to be secure in production.

### A. Generate a Strong Authentication Secret
In development, a placeholder is used. For production, generate a secure 32-character random string.
Run this command in your terminal to generate one:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add the output to your `.env` file:
```env
AUTH_SECRET="your_generated_32_character_hex_string"
```

### B. Configure Canonical URL
NextAuth needs to know the base URL of the site. In production, add this to your environment variables:
```env
NEXTAUTH_URL="https://yourdomain.com"
```

---

## 4. Crucial Security Essentials for a Web App

To prevent spam, abuse, and security vulnerabilities, you should implement the following security layers:

### A. API Rate Limiting (Prevent OTP Spamming)
Because OTP verification sends real emails (which cost money and affect your email domain reputation), attackers can script requests to `/api/auth/signup` to spam emails.
* **Solution**: Implement rate limiting on signup and verify APIs.
* **How-to**: Use `upstash/ratelimit` (with Redis) or Next.js middleware to limit requests to a maximum of 3 signup requests per IP address every 15 minutes.

### B. Lockout After Failed OTP Attempts
Currently, the `/api/auth/verify` endpoint allows unlimited attempts to guess the 6-digit OTP code (which has only 1,000,000 possibilities).
* **Vulnerability**: Brute-force OTP guessing.
* **Solution**: Keep track of the number of failed attempts on the `User` model. If a user enters an incorrect OTP 5 times, invalidate the OTP code and require them to request a new one.
* **Database fields to add in `schema.prisma`**:
  ```prisma
  model User {
    ...
    failedOtpAttempts Int @default(0)
  }
  ```

### C. Secure Cookies & CSRF Protection
Make sure your cookies are secure. In production, NextAuth automatically sets these flags:
* `HttpOnly` - prevents JavaScript from reading the session token (blocks XSS token theft).
* `Secure` - ensures cookies are only sent over HTTPS.
* `SameSite=Lax` - protects against Cross-Site Request Forgery (CSRF).

### D. Input Sanitization and Validation
Ensure that user inputs (like Name, Bio, and Project Descriptions) are sanitized to prevent Stored Cross-Site Scripting (XSS).
* Use the existing `zod` schema to enforce strict lengths and character rules.
* Escape or filter HTML when rendering user content on the front end.

---

## 5. Next Steps Checklist for Deployment

| Task | Dev Environment | Production Environment | Done? |
| :--- | :--- | :--- | :---: |
| **Auth Secret** | Placeholder | Generated cryptographically (`openssl` / `crypto`) | [ ] |
| **Database** | SQLite local file (`dev.db`) | Hosted PostgreSQL (Supabase/Neon) | [ ] |
| **Email Service** | Local Terminal Console logs | Resend API + Verified Domain | [ ] |
| **Hosting** | Localhost:3000 | Vercel / Netlify / Render (with HTTPS) | [ ] |
| **Rate Limits** | Disabled | Configured on Signup and Verify endpoints | [ ] |
