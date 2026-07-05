"use client";

import { useRef, useState, useTransition } from "react";
import { sendFriendRequest } from "@/actions/friends";

export default function AddFriendForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex gap-2 items-start"
      action={(formData: FormData) => {
        setMessage(null);
        const username = formData.get("username")?.toString().trim() ?? "";
        if (!username) return;
        startTransition(async () => {
          try {
            await sendFriendRequest(username);
            setMessage(`Friend request sent to ${username}.`);
            formRef.current?.reset();
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Something went wrong.");
          }
        });
      }}
    >
      <div className="flex-1">
        <input
          name="username"
          placeholder="friend's username"
          className="field-input"
          required
        />
        {message && <p className="text-xs mt-1">{message}</p>}
      </div>
      <button type="submit" className="btn btn-primary btn-small" disabled={pending}>
        {pending ? "Sending…" : "Add Friend"}
      </button>
    </form>
  );
}
