import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";

const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

console.log("[Auth Config] Google ID present:", !!googleId);
console.log("[Auth Config] Google Secret present:", !!googleSecret);
console.log("[Auth Config] Auth Secret present:", !!secret);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: googleId,
      clientSecret: googleSecret,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        let dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!dbUser) {
          await prisma.user.create({
            data: {
              name: user.name || user.email.split("@")[0],
              email: user.email,
              verified: true,
              profileImage: user.image || null,
            }
          });
        } else if (!dbUser.verified) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { verified: true }
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      const email = user?.email || token.email;
      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email }
        });
        if (dbUser) {
          token.id = dbUser.id.toString();
          token.role = dbUser.role;
          token.department = dbUser.department;
          token.year = dbUser.year;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).department = token.department;
        (session.user as any).year = token.year;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
  },
  secret: secret,
  trustHost: true,
  debug: true,
});
