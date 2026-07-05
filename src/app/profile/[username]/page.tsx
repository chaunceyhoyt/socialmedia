import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRelationship, getAcceptedFriendIds } from "@/lib/friends";
import { getVisiblePhotosForProfile } from "@/lib/getPhotos";
import { canView } from "@/lib/visibility";
import PhotoGrid from "@/components/PhotoGrid";
import PhotoUploader from "@/components/PhotoUploader";
import WallComposer from "@/components/WallComposer";
import WallDeleteButton from "@/components/WallDeleteButton";
import FriendActionButton from "@/components/FriendActionButton";
import ProfileSongPlayer from "@/components/ProfileSongPlayer";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const viewer = await currentUser();

  const owner = await prisma.user.findUnique({ where: { username } });
  if (!owner) notFound();

  const isOwner = viewer?.id === owner.id;
  const { relationship, friendshipId } = await getRelationship(viewer?.id, owner.id);
  const isFriend = relationship === "FRIENDS";

  const [photos, topFriends, wallPostsRaw, friendCount] = await Promise.all([
    getVisiblePhotosForProfile(owner.id, viewer?.id),
    prisma.topFriend.findMany({
      where: { ownerId: owner.id },
      orderBy: { rank: "asc" },
      include: { target: { select: { username: true, name: true, image: true } } },
    }),
    prisma.wallPost.findMany({
      where: { profileId: owner.id },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { username: true, name: true, image: true } } },
    }),
    getAcceptedFriendIds(owner.id).then((ids) => ids.length),
  ]);

  const wallPosts = wallPostsRaw.filter((post) =>
    canView(post.visibility, owner.id, viewer?.id, isFriend),
  );

  return (
    <div
      className={`profile-theme profile-font-${owner.fontChoice} profile-tile-${owner.backgroundTile} space-y-4 p-4`}
      style={
        {
          "--profile-banner": owner.bannerColor,
          "--profile-accent": owner.accentColor,
          "--profile-text": owner.textColor,
        } as React.CSSProperties
      }
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {owner.image && (
            <Image
              src={owner.image}
              alt={owner.name ?? owner.username}
              width={80}
              height={80}
              className="border-2"
              style={{ borderColor: owner.accentColor }}
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{owner.name ?? owner.username}</h1>
            <p className="text-sm opacity-80">@{owner.username}</p>
            {owner.mood && <p className="text-sm italic">feeling: {owner.mood}</p>}
            <p className="text-xs opacity-70">{friendCount} friends</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Link href={`/profile/${owner.username}/edit`} className="btn btn-small">
              Edit Profile
            </Link>
          ) : (
            <FriendActionButton
              targetUsername={owner.username}
              relationship={relationship}
              friendshipId={friendshipId}
            />
          )}
        </div>
      </div>

      <ProfileSongPlayer url={owner.profileSongUrl} />

      {owner.aboutMe && (
        <div className="chrome-window">
          <div className="chrome-titlebar">about me</div>
          <div className="chrome-body whitespace-pre-wrap text-sm">{owner.aboutMe}</div>
        </div>
      )}

      {topFriends.length > 0 && (
        <div className="chrome-window">
          <div className="chrome-titlebar">top friends</div>
          <div className="chrome-body grid grid-cols-4 sm:grid-cols-8 gap-2">
            {topFriends.map((tf) => (
              <Link
                key={tf.id}
                href={`/profile/${tf.target.username}`}
                className="text-center no-underline text-black"
              >
                {tf.target.image && (
                  <Image
                    src={tf.target.image}
                    alt={tf.target.name ?? tf.target.username}
                    width={56}
                    height={56}
                    className="mx-auto border border-black"
                  />
                )}
                <p className="text-xs truncate">{tf.target.name ?? tf.target.username}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="chrome-window">
        <div className="chrome-titlebar">
          photos {isOwner && "— visibility is per-photo, only you see this control"}
        </div>
        <div className="chrome-body space-y-3">
          {isOwner && <PhotoUploader />}
          <PhotoGrid photos={photos} isOwner={isOwner} />
        </div>
      </div>

      <div className="chrome-window">
        <div className="chrome-titlebar">wall ({wallPosts.length})</div>
        <div className="chrome-body space-y-3">
          {viewer && <WallComposer profileUsername={owner.username} />}
          {wallPosts.map((post) => (
            <div key={post.id} className="border-b border-black/20 pb-2">
              <div className="flex items-center justify-between">
                <Link href={`/profile/${post.author.username}`} className="font-bold no-underline">
                  {post.author.name ?? post.author.username}
                </Link>
                <span className="text-xs opacity-70">
                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm">{post.body}</p>
              {(viewer?.id === post.authorId || isOwner) && (
                <div className="mt-1">
                  <WallDeleteButton wallPostId={post.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
