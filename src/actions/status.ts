"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const visibilitySchema = z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]);

export async function postStatus(body: string, visibility: string) {
  const user = await requireUser();
  const text = z.string().trim().min(1).max(280).parse(body);
  const parsedVisibility = visibilitySchema.parse(visibility);

  await prisma.status.create({
    data: { authorId: user.id, body: text, visibility: parsedVisibility },
  });

  revalidatePath("/feed");
  revalidatePath(`/profile/${user.username}`);
}

export async function deleteStatus(statusId: string) {
  const user = await requireUser();

  const status = await prisma.status.findUniqueOrThrow({ where: { id: statusId } });
  if (status.authorId !== user.id) {
    throw new Error("You can only delete your own status updates.");
  }

  await prisma.status.delete({ where: { id: statusId } });

  revalidatePath("/feed");
  revalidatePath(`/profile/${user.username}`);
}
