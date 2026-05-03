import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

// ─── File-based user store (dev/local) ────────────────────────────────────────
const DATA_DIR = join(process.cwd(), ".admin-data");
const USERS_FILE = join(DATA_DIR, "users.json");

export type DbUser = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  passwordHash?: string;
  profilePicture?: string;
  googleId?: string;
  authProvider: "local" | "google";
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

function readUsers(): DbUser[] {
  try {
    if (!existsSync(USERS_FILE)) return [];
    return JSON.parse(readFileSync(USERS_FILE, "utf-8")) as DbUser[];
  } catch { return []; }
}

function writeUsers(users: DbUser[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function findByEmail(email: string) {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function upsertUser(user: DbUser) {
  const all = readUsers();
  const idx = all.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx >= 0) all[idx] = user;
  else all.push(user);
  writeUsers(all);
}

// ─── NextAuth Options ──────────────────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = findByEmail(credentials.email);
        if (!user || user.authProvider !== "local") return null;
        const hash = createHash("sha256").update(credentials.password).digest("hex");
        if (hash !== user.passwordHash) return null;
        const now = new Date().toISOString();
        upsertUser({ ...user, lastLoginAt: now, updatedAt: now });
        return { id: user.id, name: user.fullName, email: user.email, image: user.profilePicture };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile: gProfile }) {
      if (account?.provider === "google") {
        const now = new Date().toISOString();
        const existing = findByEmail(user.email ?? "");
        const dbUser: DbUser = {
          id: existing?.id ?? `user_${Date.now()}`,
          username: existing?.username ?? (user.email ?? "").split("@")[0],
          fullName: (gProfile as { name?: string })?.name ?? user.name ?? "",
          email: user.email ?? "",
          profilePicture: user.image ?? "",
          googleId: account.providerAccountId,
          authProvider: "google",
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          lastLoginAt: now,
        };
        upsertUser(dbUser);
      }
      return true;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },

  pages: {
    signIn: "/profile",
    error: "/profile",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "geeta-ai-secret-change-in-production",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
