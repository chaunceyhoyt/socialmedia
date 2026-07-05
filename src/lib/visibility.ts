import { prisma } from "@/lib/prisma";
import type { Visibility } from "@/generated/prisma/enums";

/** Are `viewerId` and `ownerId` accepted friends? Always false for anonymous viewers. */
export async function areFriends(
  ownerId: string,
  viewerId: string | undefined | null,
): Promise<boolean> {
  if (!viewerId || viewerId === ownerId) return false;

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: ownerId, addresseeId: viewerId },
        { requesterId: viewerId, addresseeId: ownerId },
      ],
    },
    select: { id: true },
  });

  return friendship !== null;
}

/**
 * Central visibility check used by every read path (photos, wall posts,
 * status updates). Owners can always see their own content.
 */
export function canView(
  visibility: Visibility,
  ownerId: string,
  viewerId: string | undefined | null,
  isFriend: boolean,
): boolean {
  if (viewerId === ownerId) return true;
  if (visibility === "PUBLIC") return true;
  if (visibility === "FRIENDS") return isFriend;
  return false; // PRIVATE
}

/** Filters a list of items down to what `viewerId` is allowed to see. */
export async function filterVisible<T extends { visibility: Visibility; ownerId: string }>(
  items: T[],
  viewerId: string | undefined | null,
): Promise<T[]> {
  if (items.length === 0) return items;

  const ownerIds = [...new Set(items.map((i) => i.ownerId))];
  const friendSet = new Set<string>();
  for (const ownerId of ownerIds) {
    if (await areFriends(ownerId, viewerId)) friendSet.add(ownerId);
  }

  return items.filter((item) =>
    canView(item.visibility, item.ownerId, viewerId, friendSet.has(item.ownerId)),
  );
}
