import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/feed");
  }

  return (
    <div className="chrome-window">
      <div className="chrome-titlebar">friendspace.exe</div>
      <div className="chrome-body space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
          welcome to friendspace!!
        </h1>
        <p>
          Customize your page, leave your friends comments, and share photos
          straight from your own Google Photos library — you decide who sees
          what, photo by photo.
        </p>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Sign in with your Google account — no new password to remember.</li>
          <li>
            Every photo you post is uploaded into a private album in your own
            Google Photos, not our servers.
          </li>
          <li>Set each photo to Public, Friends only, or Just Me.</li>
          <li>Pick your Top 8, decorate your page, leave wall comments.</li>
        </ul>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/feed" });
          }}
        >
          <button type="submit" className="btn btn-primary">
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
