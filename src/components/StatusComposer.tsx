"use client";

import { useRef, useState, useTransition } from "react";
import { postStatus } from "@/actions/status";

export default function StatusComposer() {
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
        const visibility = formData.get("visibility")?.toString() ?? "FRIENDS";
        startTransition(async () => {
          try {
            await postStatus(body, visibility);
            formRef.current?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to post status.");
          }
        });
      }}
    >
      <textarea
        name="body"
        maxLength={280}
        rows={2}
        placeholder="What's on your mind?"
        className="field-textarea"
        required
      />
      <div className="flex items-center justify-between gap-2">
        <select name="visibility" defaultValue="FRIENDS" className="field-select w-auto">
          <option value="PUBLIC">Public</option>
          <option value="FRIENDS">Friends only</option>
          <option value="PRIVATE">Just me</option>
        </select>
        <button type="submit" className="btn btn-primary btn-small" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="text-red-700 text-sm font-bold">{error}</p>}
    </form>
  );
}
