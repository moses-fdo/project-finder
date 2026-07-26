import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";

const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

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
      if (account?.provider === "google") {
        if (!user.email) return false;

        const email = user.email.toLowerCase().trim();
        const domain = email.split("@")[1] || "";
        let isAllowed =
          domain.includes(".edu") ||
          domain.includes(".ac.") ||
          domain.endsWith(".edu");

        if (!isAllowed) {
          const allowedEntry = await prisma.allowedEmail.findUnique({
            where: { email },
          });
          if (allowedEntry) {
            isAllowed = true;
          }
        }

        if (!isAllowed) {
          return "/login?error=EduEmailRequired";
        }

        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          await prisma.user.create({
            data: {
              name: user.name || user.email.split("@")[0],
              email: user.email,
              verified: true,
              profileImage: user.image || null,
            },
          });
        } else if (!dbUser.verified) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { verified: true },
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email || token.email;
      if (email) {
        const dbUser = await prisma.user.findUnique({ where: { email } });
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
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.department = token.department as any;
        session.user.year = token.year as any;
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
  debug: process.env.NODE_ENV === "development",
});
