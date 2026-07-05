"use client";

import { useTransition } from "react";
import { sendFriendRequest, respondToFriendRequest, removeFriend } from "@/actions/friends";

export type Relationship = "SELF" | "NONE" | "FRIENDS" | "PENDING_OUTGOING" | "PENDING_INCOMING";

export default function FriendActionButton({
  targetUsername,
  relationship,
  friendshipId,
}: {
  targetUsername: string;
  relationship: Relationship;
  friendshipId?: string;
}) {
  const [pending, startTransition] = useTransition();

  if (relationship === "SELF") return null;

  if (relationship === "NONE") {
    return (
      <button
        className="btn btn-primary btn-small"
        disabled={pending}
        onClick={() => startTransition(() => sendFriendRequest(targetUsername))}
      >
        Add Friend
      </button>
    );
  }

  if (relationship === "PENDING_OUTGOING") {
    return (
      <button className="btn btn-small" disabled>
        Request Sent
      </button>
    );
  }

  if (relationship === "PENDING_INCOMING" && friendshipId) {
    return (
      <div className="flex gap-2">
        <button
          className="btn btn-primary btn-small"
          disabled={pending}
          onClick={() => startTransition(() => respondToFriendRequest(friendshipId, true))}
        >
          Accept
        </button>
        <button
          className="btn btn-small"
          disabled={pending}
          onClick={() => startTransition(() => respondToFriendRequest(friendshipId, false))}
        >
          Decline
        </button>
      </div>
    );
  }

  if (relationship === "FRIENDS" && friendshipId) {
    return (
      <button
        className="btn btn-danger btn-small"
        disabled={pending}
        onClick={() => {
          if (confirm(`Remove ${targetUsername} as a friend?`)) {
            startTransition(() => removeFriend(friendshipId));
          }
        }}
      >
        ✓ Friends (Remove)
      </button>
    );
  }

  return null;
}
