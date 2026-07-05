import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("You must be signed in to do that.");
  }
  return session.user;
}

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}
