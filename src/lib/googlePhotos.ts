// Thin wrapper around the Google Photos Library API.
//
// Design constraint: Google restricts the Library API so apps can only
// read back media items *they themselves created* (scope
// `photoslibrary.readonly.appcreateddata`), not a user's whole library.
// That's actually a good fit here: every "upload" on the site is pushed
// into one dedicated album (created per-user at signup) via
// `photoslibrary.appendonly`, and we only ever need to read back what we
// put there. Google Photos becomes the storage/CDN; our own database only
// keeps the mediaItem id plus visibility/caption metadata.
//
// Photo bytes are never proxied through our server for upload or
// download — we hand the browser a direct, short-lived Google-hosted URL.

const PHOTOS_API = "https://photoslibrary.googleapis.com/v1";

export class GooglePhotosError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GooglePhotosError";
  }
}

async function googleFetch(
  accessToken: string,
  path: string,
  init: RequestInit = {},
) {
  const res = await fetch(`${PHOTOS_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GooglePhotosError(
      `Google Photos API ${path} failed: ${res.status} ${body}`,
      res.status,
    );
  }

  return res.json();
}

export async function createAlbum(accessToken: string, title: string) {
  const data = await googleFetch(accessToken, "/albums", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ album: { title } }),
  });
  return data as { id: string; title: string; productUrl: string };
}

/** Uploads raw bytes and returns an upload token, valid for ~1 day. */
export async function uploadBytes(
  accessToken: string,
  bytes: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  const res = await fetch(`${PHOTOS_API}/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
      "X-Goog-Upload-Content-Type": mimeType,
      "X-Goog-Upload-Protocol": "raw",
      "X-Goog-Upload-File-Name": filename,
    },
    body: new Uint8Array(bytes),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GooglePhotosError(
      `Google Photos upload failed: ${res.status} ${body}`,
      res.status,
    );
  }

  return res.text();
}

interface NewMediaItemResult {
  uploadToken: string;
  status: { message: string; code?: number };
  mediaItem?: {
    id: string;
    baseUrl: string;
    productUrl: string;
    mimeType: string;
    mediaMetadata?: { width?: string; height?: string };
  };
}

/** Adds an uploaded item to the given album, returning the mediaItem. */
export async function addUploadToAlbum(
  accessToken: string,
  albumId: string,
  uploadToken: string,
  description?: string,
) {
  const data = await googleFetch(accessToken, "/mediaItems:batchCreate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      albumId,
      newMediaItems: [
        {
          description: description?.slice(0, 500) ?? "",
          simpleMediaItem: { uploadToken },
        },
      ],
    }),
  });

  const result: NewMediaItemResult | undefined = data.newMediaItemResults?.[0];
  if (!result?.mediaItem) {
    throw new GooglePhotosError(
      `Google Photos batchCreate did not return a media item: ${result?.status?.message ?? "unknown error"}`,
      502,
    );
  }
  return result.mediaItem;
}

export async function uploadPhotoToAlbum(
  accessToken: string,
  albumId: string,
  bytes: Buffer,
  filename: string,
  mimeType: string,
  description?: string,
) {
  const uploadToken = await uploadBytes(accessToken, bytes, filename, mimeType);
  return addUploadToAlbum(accessToken, albumId, uploadToken, description);
}

interface MediaItemResult {
  mediaItem?: {
    id: string;
    baseUrl: string;
    productUrl: string;
    mimeType: string;
  };
  status?: { message: string };
}

/**
 * Fetches fresh baseUrls for a batch of mediaItem ids. Google's baseUrls
 * expire after about an hour, so callers should always re-fetch right
 * before rendering rather than caching them long-term.
 */
export async function getFreshMediaItemUrls(
  accessToken: string,
  mediaItemIds: string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (mediaItemIds.length === 0) return urls;

  // The API caps batchGet at 50 ids per call.
  for (let i = 0; i < mediaItemIds.length; i += 50) {
    const chunk = mediaItemIds.slice(i, i + 50);
    const params = new URLSearchParams();
    for (const id of chunk) params.append("mediaItemIds", id);

    const data = await googleFetch(
      accessToken,
      `/mediaItems:batchGet?${params.toString()}`,
    );

    for (const result of (data.mediaItemResults ?? []) as MediaItemResult[]) {
      if (result.mediaItem) {
        urls.set(result.mediaItem.id, result.mediaItem.baseUrl);
      }
    }
  }

  return urls;
}

/** Appends Google Photos sizing params, e.g. `=w800-h800-c` for a square crop. */
export function sizedPhotoUrl(baseUrl: string, size: number, crop = false) {
  return `${baseUrl}=w${size}-h${size}${crop ? "-c" : ""}`;
}
