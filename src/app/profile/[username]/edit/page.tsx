import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getAcceptedFriendIds } from "@/lib/friends";
import ThemeEditorForm from "@/components/ThemeEditorForm";
import TopFriendsEditor from "@/components/TopFriendsEditor";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await requireUser();

  if (user.username !== username) {
    redirect(`/profile/${username}`);
  }

  const owner = await prisma.user.findUnique({ where: { id: user.id } });
  if (!owner) notFound();

  const friendIds = await getAcceptedFriendIds(owner.id);
  const [friends, topFriends] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: { username: true, name: true },
    }),
    prisma.topFriend.findMany({
      where: { ownerId: owner.id },
      orderBy: { rank: "asc" },
      include: { target: { select: { username: true } } },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="chrome-window">
        <div className="chrome-titlebar">customize your page</div>
        <div className="chrome-body">
          <ThemeEditorForm
            initial={{
              aboutMe: owner.aboutMe ?? "",
              mood: owner.mood ?? "",
              bannerColor: owner.bannerColor,
              accentColor: owner.accentColor,
              textColor: owner.textColor,
              fontChoice: owner.fontChoice,
              backgroundTile: owner.backgroundTile,
              profileSongUrl: owner.profileSongUrl ?? "",
            }}
          />
        </div>
      </div>

      <div className="chrome-window">
        <div className="chrome-titlebar">top 8 friends</div>
        <div className="chrome-body">
          {friends.length === 0 ? (
            <p className="text-sm italic">Add some friends first to feature them here.</p>
          ) : (
            <TopFriendsEditor
              friends={friends}
              initialSlots={topFriends.map((tf) => tf.target.username)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
