import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getMongoClient } from "@/lib/mongodb-client";

/**
 * Google Cloud Console Setup:
 * 1. Go to console.cloud.google.com
 * 2. Create new project → APIs & Services → Credentials
 * 3. Create OAuth 2.0 Client ID → Web Application
 * 4. Authorized redirect URIs (exact path — no extra segments like /events):
 *    - http://localhost:3003/api/auth/callback/google
 *    - https://yourdomain.com/api/auth/callback/google
 * 5. Copy Client ID → AUTH_GOOGLE_ID
 * 6. Copy Client Secret → AUTH_GOOGLE_SECRET
 */

const trustHostExplicit =
  process.env.AUTH_TRUST_HOST === "false" || process.env.AUTH_TRUST_HOST === "0"
    ? false
    : true;

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel / reverse proxies: Auth.js must trust Host / x-forwarded-* or OAuth routes 500 with UntrustedHost.
  // See https://errors.authjs.dev#untrustedhost — also set AUTH_TRUST_HOST=true on Vercel Production.
  trustHost: trustHostExplicit,
  adapter: MongoDBAdapter(getMongoClient),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Determine role based on email whitelist
      const photographerEmails =
        process.env.PHOTOGRAPHER_EMAILS?.split(",").map((e) => e.trim()) || [];

      session.user.role = photographerEmails.includes(user.email ?? "")
        ? "photographer"
        : "user";
      session.user.id = user.id;

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
