import { prisma } from "@/lib/prisma";
import type { Relationship } from "@/components/FriendActionButton";

export async function getRelationship(
  viewerId: string | undefined | null,
  ownerId: string,
): Promise<{ relationship: Relationship; friendshipId?: string }> {
  if (!viewerId) return { relationship: "NONE" };
  if (viewerId === ownerId) return { relationship: "SELF" };

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: viewerId, addresseeId: ownerId },
        { requesterId: ownerId, addresseeId: viewerId },
      ],
    },
  });

  if (!friendship) return { relationship: "NONE" };
  if (friendship.status === "ACCEPTED") {
    return { relationship: "FRIENDS", friendshipId: friendship.id };
  }
  if (friendship.status === "DECLINED") return { relationship: "NONE" };

  // PENDING
  if (friendship.requesterId === viewerId) {
    return { relationship: "PENDING_OUTGOING", friendshipId: friendship.id };
  }
  return { relationship: "PENDING_INCOMING", friendshipId: friendship.id };
}

export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  return friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId));
}
