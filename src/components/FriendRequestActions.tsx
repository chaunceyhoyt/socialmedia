"use client";

import { useTransition } from "react";
import { respondToFriendRequest, removeFriend } from "@/actions/friends";

export function AcceptDeclineButtons({ friendshipId }: { friendshipId: string }) {
  const [pending, startTransition] = useTransition();

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

export function RemoveFriendButton({ friendshipId }: { friendshipId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="btn btn-danger btn-small"
      disabled={pending}
      onClick={() => {
        if (confirm("Remove this friend?")) {
          startTransition(() => removeFriend(friendshipId));
        }
      }}
    >
      Remove
    </button>
  );
}
