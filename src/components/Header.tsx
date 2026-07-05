import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export default async function Header() {
  const session = await auth();

  return (
    <header>
      <div
        className="chrome-titlebar flex items-center justify-between"
        style={{ borderBottom: "2px solid #000" }}
      >
        <Link href={session ? "/feed" : "/"} className="text-white no-underline text-lg">
          ★ friendspace ★
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <Link href="/feed" className="text-white no-underline">
                Feed
              </Link>
              <Link href="/friends" className="text-white no-underline">
                Friends
              </Link>
              <Link
                href={`/profile/${session.user.username}`}
                className="text-white no-underline"
              >
                My Profile
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="btn btn-small">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/feed" });
              }}
            >
              <button type="submit" className="btn btn-primary btn-small">
                Sign in with Google
              </button>
            </form>
          )}
        </nav>
      </div>
      <div className="marquee-track">
        <span>
          ★ welcome to friendspace ★ pick your background ★ pick who sees your
          pics ★ leave someone a comment on their wall ★ you have 1 new friend
          request ★
        </span>
      </div>
    </header>
  );
}
