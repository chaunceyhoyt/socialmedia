import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { createAlbum } from "@/lib/googlePhotos";

const baseAdapter = PrismaAdapter(prisma);

/** Turns "chauncey.hoyt@gmail.com" into a unique handle like "chaunceyhoyt". */
async function generateUsername(seed: string) {
  const base =
    seed
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "user";

  let candidate = base;
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...baseAdapter,
    async createUser(user: AdapterUser) {
      const username = await generateUsername(user.email ?? "user");
      return baseAdapter.createUser!({ ...user, username } as AdapterUser);
    },
  },
  providers: [
    Google({
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/photoslibrary.appendonly",
            "https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata",
          ].join(" "),
          // Force the consent screen every sign-in so Google keeps handing
          // back a refresh_token — without it we can't call the Photos API
          // once the short-lived access token expires.
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.username = (user as AdapterUser & { username: string }).username;
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google" || !account.access_token) {
        return;
      }

      // next-auth's database session strategy doesn't refresh the stored
      // Account tokens on repeat sign-ins by default, so we do it here.
      await prisma.account.updateMany({
        where: {
          provider: "google",
          providerAccountId: account.providerAccountId,
        },
        data: {
          access_token: account.access_token,
          refresh_token: account.refresh_token ?? undefined,
          expires_at: account.expires_at ?? undefined,
          scope: account.scope ?? undefined,
        },
      });

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser && !dbUser.googlePhotosAlbumId) {
        try {
          const album = await createAlbum(
            account.access_token,
            `${dbUser.username} — Social Site Photos`,
          );
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { googlePhotosAlbumId: album.id },
          });
        } catch (err) {
          console.error(
            `Failed to create Google Photos album for user ${dbUser.id}:`,
            err,
          );
        }
      }
    },
  },
});
