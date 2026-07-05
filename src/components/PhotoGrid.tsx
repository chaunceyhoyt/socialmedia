import type { VisiblePhoto } from "@/lib/getPhotos";
import { sizedPhotoUrl } from "@/lib/googlePhotos";
import PhotoVisibilityControl from "@/components/PhotoVisibilityControl";

const VISIBILITY_LABEL: Record<string, string> = {
  PUBLIC: "public",
  FRIENDS: "friends",
  PRIVATE: "just me",
};

const VISIBILITY_BADGE_CLASS: Record<string, string> = {
  PUBLIC: "badge-public",
  FRIENDS: "badge-friends",
  PRIVATE: "badge-private",
};

export default function PhotoGrid({
  photos,
  isOwner,
}: {
  photos: VisiblePhoto[];
  isOwner: boolean;
}) {
  if (photos.length === 0) {
    return <p className="text-sm italic">No photos to show.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="chrome-window">
          <div className="aspect-square bg-black/20 flex items-center justify-center overflow-hidden">
            {photo.baseUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Google Photos baseUrls are short-lived and sized via query params, not a fit for next/image's static optimization.
              <img
                src={sizedPhotoUrl(photo.baseUrl, 400, true)}
                alt={photo.caption ?? "Photo"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs p-2 text-center">Photo unavailable</span>
            )}
          </div>
          <div className="chrome-body py-1.5 px-2">
            {photo.caption && <p className="text-xs">{photo.caption}</p>}
            {isOwner ? (
              <PhotoVisibilityControl photoId={photo.id} visibility={photo.visibility} />
            ) : (
              <span className={`badge ${VISIBILITY_BADGE_CLASS[photo.visibility]}`}>
                {VISIBILITY_LABEL[photo.visibility]}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
