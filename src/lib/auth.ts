import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma, safeQuery } from "./prisma";

const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const secret =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "project-finder-fallback-secret-2026";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          if (!user.email) return false;

          const email = user.email.toLowerCase().trim();
          const domain = email.split("@")[1] || "";
          let isAllowed =
            domain.includes(".edu") ||
            domain.includes(".ac.") ||
            domain.endsWith(".edu");

          if (!isAllowed) {
            try {
              const allowedEntry = await prisma.allowedEmail.findUnique({
                where: { email },
              });
              if (allowedEntry) {
                isAllowed = true;
              }
            } catch (err) {
              console.warn("[auth] AllowedEmail check retry...", err);
            }
          }

          if (!isAllowed) {
            return "/login?error=EduEmailRequired";
          }

          let dbUser = null;
          try {
            dbUser = await prisma.user.findUnique({
              where: { email: user.email },
            });
          } catch {
            // Retry once if Neon database server was waking up
            await new Promise((r) => setTimeout(r, 1200));
            dbUser = await prisma.user.findUnique({
              where: { email: user.email },
            });
          }

          if (!dbUser) {
            const created = await prisma.user.create({
              data: {
                name: user.name || user.email.split("@")[0],
                email: user.email,
                verified: true,
                profileImage: user.image || null,
              },
            });
            user.id = created.id.toString();
            user.role = created.role as "USER" | "ADMIN";
          } else {
            user.id = dbUser.id.toString();
            user.role = dbUser.role as "USER" | "ADMIN";
            user.department = dbUser.department;
            user.year = dbUser.year;

            if (!dbUser.verified) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { verified: true },
              });
            }
          }
        }
        return true;
      } catch (err) {
        console.error("[auth] signIn callback error:", err);
        return true;
      }
    },
    async jwt({ token, user }) {
      // 1. If user object is passed during initial sign-in, use it directly (0 extra DB calls)
      if (user) {
        token.id = user.id?.toString() || token.id;
        token.role = user.role || token.role || "USER";
        token.department = user.department || token.department || null;
        token.year = user.year || token.year || null;
      }

      // 2. Only query DB if token attributes are missing
      const email = user?.email || token.email;
      if (email && (!token.id || !token.role)) {
        const dbUser = await safeQuery(
          () => prisma.user.findUnique({ where: { email } }),
          null
        );
        if (dbUser) {
          token.id = dbUser.id.toString();
          token.role = dbUser.role as "USER" | "ADMIN";
          token.department = dbUser.department;
          token.year = dbUser.year;
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          session.user.id = (token.id as string) || session.user.id;
          session.user.role = (token.role || "USER") as "USER" | "ADMIN";
          session.user.department = (token.department as string | null) || null;
          session.user.year = (token.year as number | null) || null;
        }
      } catch (err) {
        console.error("[auth] session callback error:", err);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret,
  trustHost: true,
  debug: false,
});
