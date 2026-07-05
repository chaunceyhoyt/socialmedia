import { prisma } from "@/lib/prisma";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Returns a valid Google access token for the given user, refreshing it
 * via the stored refresh_token if the current one has expired. The
 * refreshed token is written back to the Account row so subsequent calls
 * can reuse it until it expires again.
 */
export async function getValidGoogleAccessToken(
  userId: string,
): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token) {
    throw new Error("No linked Google account with an access token found.");
  }

  const isExpired =
    !account.expires_at || account.expires_at * 1000 < Date.now() + 60_000;

  if (!isExpired) {
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error(
      "Google access token expired and no refresh token is available. " +
        "Sign out and back in to re-authorize.",
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to refresh Google access token: ${res.status} ${body}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    },
  });

  return data.access_token;
}
