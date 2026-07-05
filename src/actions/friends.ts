"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function sendFriendRequest(targetUsername: string) {
  const user = await requireUser();
  const username = z.string().min(1).parse(targetUsername);

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) throw new Error("User not found.");
  if (target.id === user.id) throw new Error("You can't friend yourself.");

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status === "DECLINED") {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          requesterId: user.id,
          addresseeId: target.id,
          respondedAt: null,
        },
      });
    }
    // PENDING or ACCEPTED: nothing to do.
  } else {
    await prisma.friendship.create({
      data: { requesterId: user.id, addresseeId: target.id },
    });
  }

  revalidatePath(`/profile/${target.username}`);
  revalidatePath("/friends");
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
  const user = await requireUser();

  const friendship = await prisma.friendship.findUniqueOrThrow({
    where: { id: friendshipId },
  });
  if (friendship.addresseeId !== user.id) {
    throw new Error("Only the recipient can respond to this request.");
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });

  revalidatePath("/friends");
}

export async function removeFriend(friendshipId: string) {
  const user = await requireUser();

  const friendship = await prisma.friendship.findUniqueOrThrow({
    where: { id: friendshipId },
  });
  if (friendship.requesterId !== user.id && friendship.addresseeId !== user.id) {
    throw new Error("Not your friendship to remove.");
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });
  revalidatePath("/friends");
}

export async function setTopFriends(usernames: string[]) {
  const user = await requireUser();
  const trimmed = z.array(z.string()).max(8).parse(usernames);

  const targets = await prisma.user.findMany({
    where: { username: { in: trimmed } },
  });
  const byUsername = new Map(targets.map((t) => [t.username, t]));

  const orderedIds: string[] = [];
  for (const username of trimmed) {
    const target = byUsername.get(username);
    if (!target || target.id === user.id) continue;
    orderedIds.push(target.id);
  }

  await prisma.$transaction([
    prisma.topFriend.deleteMany({ where: { ownerId: user.id } }),
    ...orderedIds.map((targetId, index) =>
      prisma.topFriend.create({
        data: { ownerId: user.id, targetId, rank: index },
      }),
    ),
  ]);

  revalidatePath(`/profile/${user.username}`);
}
