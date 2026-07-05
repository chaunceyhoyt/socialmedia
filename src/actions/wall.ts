"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const visibilitySchema = z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]);

export async function postWallMessage(
  profileUsername: string,
  body: string,
  visibility: string,
) {
  const user = await requireUser();
  const text = z.string().trim().min(1).max(1000).parse(body);
  const parsedVisibility = visibilitySchema.parse(visibility);

  const profile = await prisma.user.findUnique({
    where: { username: profileUsername },
  });
  if (!profile) throw new Error("Profile not found.");

  await prisma.wallPost.create({
    data: {
      authorId: user.id,
      profileId: profile.id,
      body: text,
      visibility: parsedVisibility,
    },
  });

  revalidatePath(`/profile/${profileUsername}`);
}

export async function deleteWallPost(wallPostId: string) {
  const user = await requireUser();

  const post = await prisma.wallPost.findUniqueOrThrow({ where: { id: wallPostId } });
  if (post.authorId !== user.id && post.profileId !== user.id) {
    throw new Error("You can't delete this post.");
  }

  await prisma.wallPost.delete({ where: { id: wallPostId } });

  const profile = await prisma.user.findUnique({ where: { id: post.profileId } });
  if (profile) revalidatePath(`/profile/${profile.username}`);
}
