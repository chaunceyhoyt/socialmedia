"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getValidGoogleAccessToken } from "@/lib/googleAuth";
import { createAlbum, uploadPhotoToAlbum } from "@/lib/googlePhotos";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 15 * 1024 * 1024;

const visibilitySchema = z.enum(["PUBLIC", "FRIENDS", "PRIVATE"]);

async function ensureAlbum(userId: string, accessToken: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.googlePhotosAlbumId) return user.googlePhotosAlbumId;

  const album = await createAlbum(accessToken, `${user.username} — Social Site Photos`);
  await prisma.user.update({
    where: { id: userId },
    data: { googlePhotosAlbumId: album.id },
  });
  return album.id;
}

export async function uploadPhoto(formData: FormData) {
  const user = await requireUser();

  const file = formData.get("file");
  const caption = z
    .string()
    .max(500)
    .optional()
    .parse(formData.get("caption")?.toString() || undefined);
  const visibility = visibilitySchema.parse(
    formData.get("visibility")?.toString() ?? "FRIENDS",
  );

  if (!(file instanceof File)) {
    throw new Error("No file provided.");
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WEBP, or GIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is too large (max 15MB).");
  }

  const accessToken = await getValidGoogleAccessToken(user.id);
  const albumId = await ensureAlbum(user.id, accessToken);

  const bytes = Buffer.from(await file.arrayBuffer());
  const mediaItem = await uploadPhotoToAlbum(
    accessToken,
    albumId,
    bytes,
    file.name || "upload",
    file.type,
    caption,
  );

  await prisma.photo.create({
    data: {
      ownerId: user.id,
      googleMediaId: mediaItem.id,
      caption,
      visibility,
    },
  });

  revalidatePath(`/profile/${user.username}`);
}

export async function updatePhotoVisibility(photoId: string, visibility: string) {
  const user = await requireUser();
  const parsedVisibility = visibilitySchema.parse(visibility);

  const photo = await prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
  if (photo.ownerId !== user.id) {
    throw new Error("You can only change visibility on your own photos.");
  }

  await prisma.photo.update({
    where: { id: photoId },
    data: { visibility: parsedVisibility },
  });

  revalidatePath(`/profile/${user.username}`);
}

export async function deletePhoto(photoId: string) {
  const user = await requireUser();

  const photo = await prisma.photo.findUniqueOrThrow({ where: { id: photoId } });
  if (photo.ownerId !== user.id) {
    throw new Error("You can only delete your own photos.");
  }

  // We only remove the site's reference; the Photos Library API grants no
  // permission to delete the underlying item from the user's own Google
  // Photos library, so it simply stops appearing on the site.
  await prisma.photo.delete({ where: { id: photoId } });

  revalidatePath(`/profile/${user.username}`);
}
