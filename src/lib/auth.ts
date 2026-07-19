import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

class CustomAuthError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new CustomAuthError("missing_credentials");
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          throw new CustomAuthError("no_user");
        }

        if (!user.verified) {
          throw new CustomAuthError("not_verified");
        }

        if (!user.password) {
          throw new CustomAuthError("invalid_password");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new CustomAuthError("invalid_password");
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          year: user.year,
        };
      }
    })
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
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          if (dbUser) {
            token.id = dbUser.id.toString();
            token.role = dbUser.role;
            token.department = dbUser.department;
            token.year = dbUser.year;
          }
        } else {
          token.id = user.id;
          token.role = (user as any).role;
          token.department = (user as any).department;
          token.year = (user as any).year;
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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  debug: true,
});
