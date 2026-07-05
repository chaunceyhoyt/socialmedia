# friendspace

A very-early-2000s-Myspace-style social network. Sign in with Google, decorate
your profile, and share photos that live in your own Google Photos account —
you choose who sees each one.

## How photo sharing works

Google no longer lets an app read a user's whole Photos library — the
[Photos Library API](https://developers.google.com/photos) only allows apps
to read back media items *the app itself created*. So instead of "linking"
your existing library, this app:

1. Creates one dedicated Google Photos album for you the first time you sign in.
2. Every photo you "upload" on the site is pushed straight into that album via
   the Google Photos API — the bytes are never stored on this app's server.
3. The site keeps its own record of each photo (a reference id + your chosen
   visibility) and fetches a fresh, short-lived display URL from Google
   whenever the photo needs to be shown.
4. You pick **Public**, **Friends only**, or **Just me** per photo. That
   visibility is enforced entirely by this app, not by Google Photos sharing —
   the album itself is never made public, so there's no way to see your
   private photos by finding the raw Google Photos link.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Postgres + Prisma
- Auth.js (NextAuth v5) with the Google provider, session strategy: database
- Server Actions for all mutations (no separate REST API layer)

## 1. Google Cloud setup

You need a Google Cloud project with two things enabled: OAuth sign-in and
the Photos Library API.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create a new project (or pick an existing one).
2. **APIs & Services → Library**: search for **Photos Library API** and
   enable it.
3. **APIs & Services → OAuth consent screen**: configure it (External is
   fine for testing). Add these scopes:
   - `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
   - `https://www.googleapis.com/auth/photoslibrary.appendonly`
   - `https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata`
   While the app is in "Testing" mode, add your own Google account under
   **Test users** so you can sign in with it.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
     (add your production URL's equivalent later, e.g.
     `https://yourdomain.com/api/auth/callback/google`)
5. Copy the generated **Client ID** and **Client Secret**.

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL="postgresql://socialmedia:socialmedia@localhost:5432/socialmedia?schema=public"
AUTH_SECRET="..."          # generate with `npx auth secret`
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="..."       # from step 1
AUTH_GOOGLE_SECRET="..."   # from step 1
```

## 3. Database

A `docker-compose.yml` is included for local Postgres:

```
docker compose up -d
```

(If you don't have Docker, point `DATABASE_URL` at any Postgres 14+ instance
instead — a local install works the same way.)

Then apply the schema:

```
npm install
npx prisma migrate dev
```

## 4. Run it

```
npm run dev
```

Visit `http://localhost:3000`, sign in with Google (using a test user you
added in step 1 if the app is still in Testing mode), and you're in. The
first sign-in creates your Google Photos album automatically — check your
Google Photos account and you should see a new album named
`<your-username> — Social Site Photos`.

## Notes & limitations

- **Refresh tokens**: the app requests `access_type=offline` and
  `prompt=consent` so Google keeps issuing a refresh token on every sign-in,
  which is what lets it call the Photos API in the background (e.g. to
  refresh a photo's display URL) between logins.
- **Deleting a photo** on the site only removes it from friendspace — the
  Photos API doesn't grant apps permission to delete items from a user's
  library, so the original photo stays in your Google Photos album.
- **No raw HTML/CSS profile customization.** Real early Myspace let you paste
  arbitrary HTML/CSS/JS into your profile, which is exactly how the
  [Samy worm](https://en.wikipedia.org/wiki/Samy_(computer_worm)) happened.
  This app offers the same spirit (custom colors, fonts, background pattern,
  profile song, Top 8) through structured, sanitized fields instead.
- **Profile songs** only embed from YouTube, Spotify, or SoundCloud links —
  any other URL is silently ignored.
