# Folio Reader

A small EPUB reader that can also read books aloud. Reading and listening share
**one bookmark per book**, so you can switch between them at any time and pick up
from the same sentence.

It is a standalone static web app with no build step, separate from the Next.js app in this repo.

## How the bookmark works

| You are…  | Your place is…                                         |
|-----------|--------------------------------------------------------|
| Reading   | the line at the top of the screen                      |
| Listening | the sentence being spoken (highlighted as it goes)     |

- **Press play while reading:** narration starts with the sentence at the top of the screen.
- **Press pause while listening:** the sentence you were hearing scrolls to the top
  and stays highlighted, so you can keep reading from it.
- The bookmark is saved as you go, and when the app is closed or sent to the background.
  Each book in the library shows its progress and whether you last read or listened.

A bookmark is stored as `{ chapter, paragraph, character offset }`, so it doesn't
depend on screen size, text size or typeface.

## Features

- Import DRM-free `.epub` files (EPUB 2 and 3), with covers, contents, images and internal links
- Narration uses the device's own voices (Web Speech API). It goes sentence by sentence
  with highlighting and auto-scroll, and continues into the next chapter by itself.
- Skip back and forward a sentence. While narrating, tap any sentence to jump to it.
- Speed from 0.8× to 2×, voice picker, and a sleep timer (15/30/60 min or end of chapter)
- Text size, serif or sans typeface, and Auto, Paper, Sepia or Night colours
- Keeps the screen awake while listening (many phones stop web speech when the screen locks)
- Removing a book keeps its bookmark, so adding the same file again picks up where you left off
- Installable and works offline (manifest + service worker)
- Books and bookmarks stay on the device in IndexedDB and are never uploaded

## Running it

Any static file server works:

```bash
cd epub-reader
python3 -m http.server 8080
# open http://localhost:8080
```

To use it on a phone, host the folder on any HTTPS static host (GitHub Pages,
Netlify, Cloudflare Pages, Vercel…). Then open it in the browser and choose
**Add to Home Screen** (Safari) or **Install app** (Chrome).

## Limitations

- **DRM:** books from Kindle, Apple Books, Kobo and similar stores are usually
  DRM-locked and can't be opened.
- **Screen lock:** browsers generally stop speech when the screen locks, which is
  why the app keeps the screen on while listening. Narration that keeps playing with
  the screen locked would need a native app or cloud text-to-speech.
- **One device:** bookmarks are per device and browser. Syncing between a phone and
  a tablet would need a small backend (for example, the Postgres database this repo
  already uses).
- **Voice quality** depends on the device. Recent iPhones, Macs, Android phones and
  Edge on Windows have good "natural" voices.
