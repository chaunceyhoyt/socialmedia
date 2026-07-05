import { toEmbedUrl } from "@/lib/embed";

export default function ProfileSongPlayer({ url }: { url: string | null }) {
  const embedUrl = toEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="chrome-window">
      <div className="chrome-titlebar">now playing</div>
      <iframe
        src={embedUrl}
        className="w-full"
        height={80}
        style={{ border: "none", display: "block" }}
        allow="autoplay; encrypted-media"
        title="Profile song"
      />
    </div>
  );
}
