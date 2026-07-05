import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/session";
import { getAcceptedFriendIds } from "@/lib/friends";
import { prisma } from "@/lib/prisma";
import StatusComposer from "@/components/StatusComposer";

export default async function FeedPage() {
  const user = await requireUser();
  const friendIds = await getAcceptedFriendIds(user.id);
  const authorIds = [user.id, ...friendIds];

  const statuses = await prisma.status.findMany({
    where: {
      authorId: { in: authorIds },
      OR: [{ visibility: { in: ["PUBLIC", "FRIENDS"] } }, { authorId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: { username: true, name: true, image: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="chrome-window">
        <div className="chrome-titlebar">what&apos;s happening</div>
        <div className="chrome-body">
          <StatusComposer />
        </div>
      </div>

      <div className="chrome-window">
        <div className="chrome-titlebar">friends feed</div>
        <div className="chrome-body space-y-3">
          {statuses.length === 0 && (
            <p className="text-sm italic">
              Nothing yet — add some friends or post your own update above.
            </p>
          )}
          {statuses.map((status) => (
            <div key={status.id} className="border-b border-black/20 pb-2">
              <div className="text-sm">
                <Link
                  href={`/profile/${status.author.username}`}
                  className="font-bold no-underline"
                >
                  {status.author.name ?? status.author.username}
                </Link>{" "}
                <span className="opacity-70">
                  {formatDistanceToNow(status.createdAt, { addSuffix: true })}
                </span>
              </div>
              <p>{status.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
