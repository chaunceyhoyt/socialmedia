"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/profile";

interface Props {
  initial: {
    aboutMe: string;
    mood: string;
    bannerColor: string;
    accentColor: string;
    textColor: string;
    fontChoice: string;
    backgroundTile: string;
    profileSongUrl: string;
  };
}

export default function ThemeEditorForm({ initial }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-3"
      action={(formData: FormData) => {
        setError(null);
        setSaved(false);
        const data = {
          aboutMe: formData.get("aboutMe")?.toString() ?? "",
          mood: formData.get("mood")?.toString() ?? "",
          bannerColor: formData.get("bannerColor")?.toString() ?? "#1a0d3d",
          accentColor: formData.get("accentColor")?.toString() ?? "#ff00c8",
          textColor: formData.get("textColor")?.toString() ?? "#e6e6ff",
          fontChoice: formData.get("fontChoice")?.toString() ?? "comic",
          backgroundTile: formData.get("backgroundTile")?.toString() ?? "stars",
          profileSongUrl: formData.get("profileSongUrl")?.toString() ?? "",
        };
        startTransition(async () => {
          try {
            await updateProfile(data);
            setSaved(true);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save.");
          }
        });
      }}
    >
      <div>
        <label className="text-sm font-bold block mb-1">About Me</label>
        <textarea
          name="aboutMe"
          rows={4}
          maxLength={2000}
          defaultValue={initial.aboutMe}
          className="field-textarea"
        />
      </div>

      <div>
        <label className="text-sm font-bold block mb-1">Mood</label>
        <input
          name="mood"
          maxLength={60}
          defaultValue={initial.mood}
          placeholder="e.g. nostalgic"
          className="field-input"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-sm font-bold block mb-1">Banner color</label>
          <input type="color" name="bannerColor" defaultValue={initial.bannerColor} className="w-full h-10 border-2 border-black" />
        </div>
        <div>
          <label className="text-sm font-bold block mb-1">Accent color</label>
          <input type="color" name="accentColor" defaultValue={initial.accentColor} className="w-full h-10 border-2 border-black" />
        </div>
        <div>
          <label className="text-sm font-bold block mb-1">Text color</label>
          <input type="color" name="textColor" defaultValue={initial.textColor} className="w-full h-10 border-2 border-black" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-bold block mb-1">Font</label>
          <select name="fontChoice" defaultValue={initial.fontChoice} className="field-select">
            <option value="comic">Comic Sans</option>
            <option value="serif">Serif</option>
            <option value="sans">Sans</option>
            <option value="monospace">Monospace</option>
            <option value="cursive">Cursive</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-bold block mb-1">Background</label>
          <select name="backgroundTile" defaultValue={initial.backgroundTile} className="field-select">
            <option value="stars">Stars</option>
            <option value="flames">Flames</option>
            <option value="clouds">Clouds</option>
            <option value="hearts">Hearts</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-bold block mb-1">Profile song (YouTube, Spotify, or SoundCloud link)</label>
        <input
          name="profileSongUrl"
          type="url"
          defaultValue={initial.profileSongUrl}
          placeholder="https://open.spotify.com/track/..."
          className="field-input"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save Profile"}
      </button>
      {saved && !pending && <p className="text-green-800 text-sm font-bold">Saved!</p>}
      {error && <p className="text-red-700 text-sm font-bold">{error}</p>}
    </form>
  );
}
