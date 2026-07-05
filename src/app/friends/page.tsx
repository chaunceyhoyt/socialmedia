import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AddFriendForm from "@/components/AddFriendForm";
import { AcceptDeclineButtons, RemoveFriendButton } from "@/components/FriendRequestActions";

export default async function FriendsPage() {
  const user = await requireUser();

  const [incoming, outgoing, accepted] = await Promise.all([
    prisma.friendship.findMany({
      where: { addresseeId: user.id, status: "PENDING" },
      include: { requester: { select: { username: true, name: true, image: true } } },
    }),
    prisma.friendship.findMany({
      where: { requesterId: user.id, status: "PENDING" },
      include: { addressee: { select: { username: true, name: true, image: true } } },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
      include: {
        requester: { select: { id: true, username: true, name: true, image: true } },
        addressee: { select: { id: true, username: true, name: true, image: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="chrome-window">
        <div className="chrome-titlebar">add a friend</div>
        <div className="chrome-body">
          <AddFriendForm />
        </div>
      </div>

      {incoming.length > 0 && (
        <div className="chrome-window">
          <div className="chrome-titlebar">friend requests</div>
          <div className="chrome-body space-y-2">
            {incoming.map((f) => (
              <div key={f.id} className="flex items-center justify-between">
                <Link href={`/profile/${f.requester.username}`} className="no-underline font-bold">
                  {f.requester.name ?? f.requester.username}
                </Link>
                <AcceptDeclineButtons friendshipId={f.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="chrome-window">
          <div className="chrome-titlebar">pending requests you sent</div>
          <div className="chrome-body space-y-1">
            {outgoing.map((f) => (
              <div key={f.id}>
                <Link href={`/profile/${f.addressee.username}`} className="no-underline">
                  {f.addressee.name ?? f.addressee.username}
                </Link>{" "}
                <span className="text-xs opacity-70">waiting for a response…</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chrome-window">
        <div className="chrome-titlebar">your friends ({accepted.length})</div>
        <div className="chrome-body space-y-2">
          {accepted.length === 0 && <p className="text-sm italic">No friends yet.</p>}
          {accepted.map((f) => {
            const friend = f.requesterId === user.id ? f.addressee : f.requester;
            return (
              <div key={f.id} className="flex items-center justify-between">
                <Link href={`/profile/${friend.username}`} className="no-underline font-bold">
                  {friend.name ?? friend.username}
                </Link>
                <RemoveFriendButton friendshipId={f.id} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
