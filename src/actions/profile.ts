"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #ff00c8");

const profileSchema = z.object({
  aboutMe: z.string().max(2000).optional().or(z.literal("")),
  mood: z.string().max(60).optional().or(z.literal("")),
  bannerColor: hexColor,
  accentColor: hexColor,
  textColor: hexColor,
  fontChoice: z.enum(["comic", "serif", "sans", "monospace", "cursive"]),
  backgroundTile: z.enum(["stars", "flames", "clouds", "hearts", "none"]),
  profileSongUrl: z.string().url().optional().or(z.literal("")),
});

interface ProfileInput {
  aboutMe: string;
  mood: string;
  bannerColor: string;
  accentColor: string;
  textColor: string;
  fontChoice: string;
  backgroundTile: string;
  profileSongUrl: string;
}

export async function updateProfile(data: ProfileInput) {
  const user = await requireUser();
  const parsed = profileSchema.parse(data);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      aboutMe: parsed.aboutMe || null,
      mood: parsed.mood || null,
      bannerColor: parsed.bannerColor,
      accentColor: parsed.accentColor,
      textColor: parsed.textColor,
      fontChoice: parsed.fontChoice,
      backgroundTile: parsed.backgroundTile,
      profileSongUrl: parsed.profileSongUrl || null,
    },
  });

  revalidatePath(`/profile/${user.username}`);
}
