"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTopFriends } from "@/actions/friends";

interface Friend {
  username: string;
  name: string | null;
}

export default function TopFriendsEditor({
  friends,
  initialSlots,
}: {
  friends: Friend[];
  initialSlots: string[];
}) {
  const slots = Array.from({ length: 8 }, (_, i) => initialSlots[i] ?? "");
  const [selection, setSelection] = useState<string[]>(slots);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {selection.map((value, i) => (
          <select
            key={i}
            className="field-select"
            value={value}
            onChange={(e) => {
              const next = [...selection];
              next[i] = e.target.value;
              setSelection(next);
            }}
          >
            <option value="">— slot {i + 1} —</option>
            {friends.map((f) => (
              <option key={f.username} value={f.username}>
                {f.name ?? f.username}
              </option>
            ))}
          </select>
        ))}
      </div>
      <button
        className="btn btn-primary btn-small"
        disabled={pending}
        onClick={() => {
          setError(null);
          setSaved(false);
          startTransition(async () => {
            try {
              await setTopFriends(selection.filter(Boolean));
              setSaved(true);
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to save.");
            }
          });
        }}
      >
        {pending ? "Saving…" : "Save Top 8"}
      </button>
      {saved && !pending && <span className="text-green-800 text-sm font-bold ml-2">Saved!</span>}
      {error && <p className="text-red-700 text-sm font-bold">{error}</p>}
    </div>
  );
}
