"use client";

import { useTransition } from "react";
import { updatePhotoVisibility, deletePhoto } from "@/actions/photos";

export default function PhotoVisibilityControl({
  photoId,
  visibility,
}: {
  photoId: string;
  visibility: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1 mt-1">
      <select
        defaultValue={visibility}
        disabled={pending}
        className="field-select text-xs py-0.5"
        onChange={(e) => startTransition(() => updatePhotoVisibility(photoId, e.target.value))}
      >
        <option value="PUBLIC">Public</option>
        <option value="FRIENDS">Friends</option>
        <option value="PRIVATE">Just me</option>
      </select>
      <button
        type="button"
        className="btn btn-danger btn-small"
        disabled={pending}
        onClick={() => {
          if (confirm("Remove this photo from your profile?")) {
            startTransition(() => deletePhoto(photoId));
          }
        }}
      >
        ✕
      </button>
    </div>
  );
}
