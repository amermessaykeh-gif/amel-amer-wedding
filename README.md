# Amel & Amer wedding invitation

A dependency-free, mobile-first static website using the selected **Gilded Letter** design. One folded sheet leaves an envelope and opens downward; it is not a crossfade between two cards. The portrait film remains the main experience, accompanied by the supplied wedding song.

## Before publishing

Update **`wedding-config.js`**. The video supplies **4 October 2026**, **17:00 guest arrival**, and **Shater Hassan Palace, Ras Masqa, Tripoli**. `Asia/Beirut` and the `+03:00` offset assume the venue is in Lebanon; confirm these with the couple.

**The end time was not supplied.** Leave `end` empty to create a start-only calendar event using the confirmed 17:00 arrival. The `.ics` deliberately omits `DTEND` instead of inventing a finish time; calendar apps may show no duration or offer their own default duration. Add a confirmed end time later if desired.

The required `start` and optional `end`, when provided, must use `YYYY-MM-DDTHH:mm:ss+HH:mm` (or `Z` for UTC). For example, **only if the confirmed end is 23:00 that evening**, use:

```js
end: "2026-10-04T23:00:00+03:00",
```

For a wedding ending after midnight, use the following day's date. Include the correct UTC offset in each timestamp, including any daylight-saving change. Set `timeZone` to the venue's IANA timezone. Edit `title`, `location`, and the optional `description` as needed. Missing required fields, placeholder values, impossible dates, invalid timezones, and an end at or before the start prevent calendar export.

### Wedding schedule

The ending lists these local venue times:

| Time | Moment |
| --- | --- |
| 17:00 | Guest arrival |
| 17:40 | Grand entrance, bride & groom |
| 19:00 | Dinner |
| 19:50 | First Dance |
| 20:50 | Cake |

Edit the `wedding-schedule` list in `index.html` to change it. The calendar export reads this same list and appends it to the configured wedding message, so the displayed and exported schedules stay consistent.

### Supplied artwork and music

- `logo.svg` and `Wedding Song.wav` are the untouched source assets.
- The website uses web-ready derivatives, `assets/wedding-emblem.png` and `assets/wedding-song.mp3`, instead of making guests download the large SVG and uncompressed WAV.
- The transparent emblem is 260 x 512 pixels and about 18 KB. The full-length soundtrack is approximately 107 seconds, encoded as 128 kbps stereo MP3 at about 1.7 MB.
- The emblem appears on the envelope seal, folded paper, invitation heading, loading/error screens, and browser icon.
- The MP3 contains the full supplied song. It loops as independent background music and does not restart when the invitation video is replayed.
- Per the couple's choice, the film's embedded audio is muted and replaced by the background song. The original MP4 is not altered.

## Preview

Serve this directory over HTTP; ES modules do not work by double-clicking the HTML file.

```powershell
python -m http.server 4173
```

Open `http://localhost:4173`. Python's basic server is sufficient for a preview but does not support video byte-range requests. For reliable seeking, test on the intended static host.

## Deploy

For the updated GitHub Pages plan, see [GITHUB-PAGES.md](GITHUB-PAGES.md). Choose **GitHub Actions** as the Pages source, rather than the earlier branch-only setup. The included workflow reads the actual public URL and prepares crawler-readable sharing metadata automatically.

The published static site contains:

- `index.html`, `styles.css`
- `invitation.js`, `letter.js`, `music.js`
- `calendar.js`, `wedding-config.js`
- `assets/wedding-emblem.png`, `assets/wedding-song.mp3`, `assets/wedding-share.jpg`
- `AMEL_&_AMER_WEDDING_V.01.mp4`
- `.nojekyll` when deploying to GitHub Pages

For GitHub Pages, also upload `.github/workflows/pages.yml` and `scripts/prepare_pages.py` from the final package. The workflow runs the small, standard-library Python preparation step for you; no packages, secrets, manual build commands, backend, cookies, analytics, or external fonts are needed.

The original SVG/WAV, obsolete `favicon.svg`, and ZIP itself are not required for deployment. The workflow publishes only the explicit static-file list, not the repository's documentation, scripts, or archive.

The host should:

- Serve MP4 as `video/mp4`, MP3 as `audio/mpeg`, PNG as `image/png`, and JavaScript as a JavaScript MIME type.
- Support byte-range requests (`206 Partial Content`) for efficient media loading and replay.
- Compress text assets and cache the media. Use versioned filenames if replacing media; avoid long-lived immutable caching for the editable event configuration.
- The HTML and controller imports include a release query for the CSS/JavaScript. Bump this value when changing the page structure or controllers, so returning guests do not combine new markup with an older cached script.
- Publish the prepared HTML so its canonical, Open Graph, and Twitter image URLs point to the actual HTTPS website. The GitHub Pages workflow supplies these automatically.

The portrait MP4 uses H.264 video and includes an AAC track, which this website intentionally mutes. Its metadata precedes the video data (fast-start), so playback need not wait for the full download. Media is served directly, without JavaScript-fetching entire files or duplicating the video. Preloading is a browser hint; low-data modes may defer loading.

### Sharing thumbnail

[assets/wedding-share.jpg](assets/wedding-share.jpg) is the 1200 x 630 sharing image: ivory invitation paper, the supplied emblem, gold botanical details, the couple's names, and 4 October 2026 on deep green. It is an opaque, progressive JPEG of about 91 KB.

The HTML includes Open Graph image type/dimensions/alternative text and a large-image Twitter card. During deployment, `scripts/prepare_pages.py` writes absolute image, canonical, and page URLs directly into the HTML. Sharing apps do not need to execute JavaScript.

The source HTML uses a relative image path only as a local-preview fallback. Reliable public sharing previews require the prepared output. No fake domain or GitHub username is hardcoded.

For another static host, run this once with your real public URL, then upload the contents of the new output folder:

```powershell
python .\scripts\prepare_pages.py --site-url "https://your-real-domain.example/" --output .\_site
```

Use a new or empty output folder; the script deliberately refuses to overwrite existing output. If wedding names/date change, update the thumbnail and its descriptive metadata too. Different messaging apps crop/cache previews differently, and existing messages may keep older thumbnails.

## Playback and calendars

- Every visit begins with the animated envelope and opening letter, including browsers that allow autoplay. The opening stays visible until the guest selects Play Invitation; the video does not automatically skip it.
- The wedding song attempts to play automatically from the beginning during the opening letter, independently of the video. If the browser blocks audible autoplay, a message and Play music control let the guest enable it. A page opened in a background tab starts the music when that tab first becomes visible.
- Open invitation immediately finishes the unfolding without starting the film. Play Invitation starts the muted, inline video and enables the song if it has not started yet, unless the guest explicitly turned music off. Already-playing music continues without restarting. The video does not advance invisibly while waiting for the soundtrack. Show details can immediately finish the ending reveal.
- Music on/off is a separate, accessible control. Pausing the film does not stop background music. Switching away from the page pauses both; returning can restore previously enabled music, but the guest resumes the film explicitly.
- A failed soundtrack is reported with a Retry music control, rather than blocking the entire invitation. Slow initial audio loading also offers Watch without music. A deliberate music-off choice persists through video replay.
- Uses full-frame `object-fit: contain`, a quiet video pause/resume control, buffering feedback, slow-connection retry, and explicit video error recovery. The direct-video fallback may play the MP4's own embedded audio.
- Shows the schedule and calendar actions only on the video's actual `ended` event. Replay resets the video, not the background song.
- The letter is one persistent sheet with a connected centre hinge, opaque printed front/back faces, and separate envelope layers. Short screens can scroll the letter without cropping its schedule or actions; the video itself remains viewport-sized.
- Respects reduced motion with a static open letter. Without JavaScript, native video controls remain available; the animated letter, soundtrack coordination, and calendar export require JavaScript.
- **Add to Calendar directly provides the device calendar invitation**, without a provider menu or intermediate click. It is a UTF-8 `.ics` with a UTC start, an optional confirmed end, escaped text, CRLF line endings, and RFC 5545 line folding. Repeated downloads use a stable event UID.
- Apple Calendar, Outlook, and other device calendar apps can open/import the `.ics`; Google Calendar can import it through its web settings. The site does not redirect guests to a particular provider.
- A website cannot force the default calendar app to open. The device/browser decides whether to offer a calendar preview, an app, or a file download. If downloaded, open `amel-and-amer-wedding.ics` with the installed calendar app and confirm saving. Some devices need an app capable of importing `.ics`. In WhatsApp, the guest may need to open the page in Safari/Chrome. Calendar data is generated locally; no guest information is sent to a third-party calendar website.

## Verification checklist

1. Confirm the event configuration, especially arrival time and venue timezone. Leave the end empty if it is unknown.
2. In both fresh and returning browsers, verify the opening remains visible while the song autoplays from its beginning. With audible autoplay blocked, verify the sound prompt/control. The video must stay paused until Play Invitation; starting the film must not restart an already-playing song or override an explicit music-off choice.
3. Test iPhone Safari, Android Chrome, desktop, tablet, and landscape. The entire portrait video must remain visible; the letter must scroll on short screens rather than clip its contents.
4. Check that the same sheet rises out of the envelope before unfolding, with no replacement-paper fade. Test Open invitation, Show details, reduced motion, and keyboard focus. A tab opened in the background should pause its reveal until visible.
5. Test music on/off, video pause/replay, the natural music loop, and background/foreground tab changes.
6. Test slow media, a failed music request, and a failed video request; verify visible feedback and each recovery path.
7. Watch to the end and verify all five schedule entries, with event descriptions on the left and times aligned on the right. Activate Add to Calendar with keyboard and touch and confirm it directly offers/downloads the invitation without a chooser.
8. Open the `.ics` file in a device calendar; verify title, venue, message plus schedule, local-time conversion, and the omitted end time when unconfigured. Also check a configured end time.

The deployment preparation script uses only Python's standard library. The website has no npm, linter, or frontend build-tool dependencies.
