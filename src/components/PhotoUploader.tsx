"use client";

import { useRef, useState, useTransition } from "react";
import { uploadPhoto } from "@/actions/photos";

export default function PhotoUploader() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="space-y-2"
      action={(formData: FormData) => {
        setError(null);
        startTransition(async () => {
          try {
            await uploadPhoto(formData);
            formRef.current?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
          }
        });
      }}
    >
      <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/gif" required className="field-input" />
      <input type="text" name="caption" placeholder="caption (optional)" maxLength={500} className="field-input" />
      <div className="flex items-center justify-between gap-2">
        <select name="visibility" defaultValue="FRIENDS" className="field-select w-auto">
          <option value="PUBLIC">Public</option>
          <option value="FRIENDS">Friends only</option>
          <option value="PRIVATE">Just me</option>
        </select>
        <button type="submit" className="btn btn-primary btn-small" disabled={pending}>
          {pending ? "Uploading to Google Photos…" : "Upload"}
        </button>
      </div>
      <p className="text-xs opacity-70">
        Uploads go straight into a dedicated album in your own Google Photos account.
      </p>
      {error && <p className="text-red-700 text-sm font-bold">{error}</p>}
    </form>
  );
}
