"use client";

import { useRef, useState, useTransition } from "react";
import { postWallMessage } from "@/actions/wall";

export default function WallComposer({ profileUsername }: { profileUsername: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="space-y-2"
      action={(formData: FormData) => {
        setError(null);
        const body = formData.get("body")?.toString() ?? "";
        const visibility = formData.get("visibility")?.toString() ?? "PUBLIC";
        startTransition(async () => {
          try {
            await postWallMessage(profileUsername, body, visibility);
            formRef.current?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to post.");
          }
        });
      }}
    >
      <textarea
        name="body"
        rows={2}
        maxLength={1000}
        placeholder="Leave a comment…"
        className="field-textarea"
        required
      />
      <div className="flex items-center justify-between gap-2">
        <select name="visibility" defaultValue="PUBLIC" className="field-select w-auto">
          <option value="PUBLIC">Public</option>
          <option value="FRIENDS">Friends only</option>
        </select>
        <button type="submit" className="btn btn-primary btn-small" disabled={pending}>
          {pending ? "Posting…" : "Post Comment"}
        </button>
      </div>
      {error && <p className="text-red-700 text-sm font-bold">{error}</p>}
    </form>
  );
}
