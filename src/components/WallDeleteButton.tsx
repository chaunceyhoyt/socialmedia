"use client";

import { useTransition } from "react";
import { deleteWallPost } from "@/actions/wall";

export default function WallDeleteButton({ wallPostId }: { wallPostId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-danger btn-small"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this comment?")) {
          startTransition(() => deleteWallPost(wallPostId));
        }
      }}
    >
      Delete
    </button>
  );
}
