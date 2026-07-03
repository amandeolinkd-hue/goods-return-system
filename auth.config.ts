import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/roles";

// Edge-safe config: NO database or bcrypt here. Shared by middleware and the
// full Node config in auth.ts. Providers are added in auth.ts.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
