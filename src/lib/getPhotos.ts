import { prisma } from "@/lib/prisma";
import { areFriends, canView } from "@/lib/visibility";
import { getValidGoogleAccessToken } from "@/lib/googleAuth";
import { getFreshMediaItemUrls } from "@/lib/googlePhotos";

export interface VisiblePhoto {
  id: string;
  caption: string | null;
  visibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
  createdAt: Date;
  baseUrl: string | null;
}

/** Photos on `profileOwnerId`'s profile that `viewerId` is allowed to see. */
export async function getVisiblePhotosForProfile(
  profileOwnerId: string,
  viewerId: string | undefined | null,
): Promise<VisiblePhoto[]> {
  const photos = await prisma.photo.findMany({
    where: { ownerId: profileOwnerId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const isFriend = await areFriends(profileOwnerId, viewerId);
  const visible = photos.filter((p) =>
    canView(p.visibility, profileOwnerId, viewerId, isFriend),
  );

  if (visible.length === 0) return [];

  // The owner's own token is used to fetch baseUrls regardless of who is
  // viewing — the Photos API only lets an app read back items it created
  // under the owning account's authorization, not a third party's.
  let urls = new Map<string, string>();
  try {
    const accessToken = await getValidGoogleAccessToken(profileOwnerId);
    urls = await getFreshMediaItemUrls(
      accessToken,
      visible.map((p) => p.googleMediaId),
    );
  } catch (err) {
    console.error(`Failed to fetch Google Photos URLs for user ${profileOwnerId}:`, err);
  }

  return visible.map((p) => ({
    id: p.id,
    caption: p.caption,
    visibility: p.visibility,
    createdAt: p.createdAt,
    baseUrl: urls.get(p.googleMediaId) ?? null,
  }));
}
