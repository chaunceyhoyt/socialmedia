const ALLOWED_EMBED_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "open.spotify.com",
  "w.soundcloud.com",
  "soundcloud.com",
];

/**
 * Turns a profile-song link into a safe, embeddable iframe URL, or `null`
 * if the link isn't from an allowed host. This is the only thing standing
 * between "user-provided URL" and an <iframe src>, so it's deliberately a
 * strict allowlist rather than freeform HTML/CSS injection (the classic
 * Myspace "Samy worm" vector).
 */
export function toEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;
  if (!ALLOWED_EMBED_HOSTS.includes(url.hostname)) return null;

  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (url.hostname.endsWith("youtube.com")) {
    const id = url.searchParams.get("v");
    if (url.pathname.startsWith("/embed/")) return url.toString();
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (url.hostname === "open.spotify.com") {
    if (url.pathname.startsWith("/embed/")) return url.toString();
    return `https://open.spotify.com/embed${url.pathname}`;
  }

  if (url.hostname.includes("soundcloud.com")) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.toString())}`;
  }

  return null;
}
