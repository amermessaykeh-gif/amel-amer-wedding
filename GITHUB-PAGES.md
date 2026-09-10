# Publish the final invitation on GitHub Pages

This is a static website. You do not need a backend, npm, a build command, or a custom GitHub Actions workflow.

## 1. Check the event details

Before sharing the invitation, confirm these values in [wedding-config.js](wedding-config.js):

- **Title:** Amel & Amer Wedding
- **Date:** 4 October 2026
- **Guest arrival:** 17:00
- **Venue:** Shater Hassan Palace, Ras Masqa, Tripoli
- **Timezone:** Asia/Beirut, with the configured `+03:00` offset
- **End time:** intentionally empty until confirmed. The calendar invitation works without inventing a finish time.

The five schedule entries are in [index.html](index.html). They are also included automatically in calendar exports.

## 2. Extract the final ZIP

Extract `amel-amer-wedding-final.zip` into a new folder on your computer.

The extracted folder contains:

```text
.nojekyll
index.html
styles.css
invitation.js
letter.js
music.js
calendar.js
wedding-config.js
AMEL_&_AMER_WEDDING_V.01.mp4
assets/
  wedding-emblem.png
  wedding-song.mp3
README.md
GITHUB-PAGES.md
```

The original large SVG/WAV, old favicon, prototype files, and local preview/testing tools are deliberately excluded. Keep the originals in your working folder for future editing.

**Upload the extracted contents, not the ZIP itself.** GitHub Pages does not unpack uploaded ZIP files. `index.html` must be at the repository root, not inside an extra outer folder.

## 3. Create a GitHub repository

1. Sign in to [GitHub](https://github.com/).
2. Select **New repository**.
3. Suggested name: **`amel-amer-wedding`**.
4. For the straightforward free setup, choose **Public**.
5. Leave initialization options unchecked; the package already includes a README.
6. Create the repository.

**Privacy:** GitHub Pages is public hosting. The invitation, names, date, venue, images, and music will be accessible online. A private repository does not ordinarily make its Pages website private. If you need guest-only access, use a host with access controls instead.

## 4. Upload the site

1. On the empty repository page, follow **uploading an existing file**. If the repository already has files, use **Add file > Upload files**.
2. Drag in all extracted files and the **`assets` folder**, preserving that folder.
3. Commit the upload to **`main`**, with a message such as `Publish wedding invitation`.
4. Confirm the root contains `index.html`, the MP4, and `.nojekyll`; confirm the PNG and MP3 are inside `assets`.

Do not rename files or change capitalization. The video filename contains `&`; its existing URL encoding in the HTML is intentional.

If `.nojekyll` was omitted by your file picker, create it using **Add file > Create new file**. Name it exactly `.nojekyll`, add a blank line, and commit it. This marker tells Pages to serve the files directly without Jekyll processing.

Every file in this release is below GitHub's **25 MiB per-file browser upload limit**, so the web upload method is sufficient.

## 5. Enable Pages

Open the repository's **Settings > Pages**.

Under **Build and deployment**, select:

| Setting | Value |
| --- | --- |
| Source | **Deploy from a branch** |
| Branch | **main** |
| Folder | **/ (root)** |

Click **Save**.

GitHub will run its Pages deployment. Check the repository's **Actions** tab if you need to see its progress or any errors. You do not need to add a workflow file yourself for this branch-based setup.

## 6. Open the published invitation

When deployment succeeds, use **Visit site** in Settings > Pages.

With the suggested repository name, the address will be:

```text
https://YOUR-USERNAME.github.io/amel-amer-wedding/
```

Replace `YOUR-USERNAME` with your GitHub username. Share the **HTTPS website URL**, not the repository URL and not a `localhost`/`127.0.0.1` preview URL.

All runtime file references are relative, so the site supports this repository subpath without code changes.

## 7. Check it before sending to guests

Test the published URL on a phone and a desktop:

- The envelope appears and the same sheet unfolds.
- The wedding song starts during the opening where audible autoplay is permitted. Otherwise, **Play music** enables it after a tap; this is a browser rule, not a hosting fault.
- The video waits for **Play Invitation**, plays inline, and does not crop the portrait frame.
- The music control works and the embedded video audio does not overlap it.
- The ending shows all five schedule entries, with descriptions on the left and times on the right.
- **Add to Calendar** provides the `.ics` invitation. Open it and confirm the date, local start time, venue, and schedule.
- The end time remains unspecified unless you configured it.
- Replay works, and short screens can scroll the letter.

In WhatsApp's browser, guests may need to open the page in Safari or Chrome to handle the calendar file. A website cannot force a particular calendar app to launch.

## Updating the invitation later

Edit or upload changed files to the same `main` branch. Pages will publish the update.

- Change event details in [wedding-config.js](wedding-config.js).
- Change wording or the visible schedule in [index.html](index.html).
- If changing CSS/JavaScript, bump the release query on the HTML references and any changed controller imports so returning visitors receive the new code.
- If replacing media, use a new filename and update its references to avoid stale cached copies.
- To stop publishing later, use the Pages settings to unpublish the site.

For richer WhatsApp link previews, optionally add absolute `og:url` and `og:image` URLs to the HTML after your public address is known. Use a suitable public PNG/JPEG image. No public domain is hardcoded in this release.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Site returns 404 | Pages points to `main` and `/ (root)`; the deployment succeeded; `index.html` is at the root |
| Only a download link or ZIP appears | Upload the extracted files, not just the archive |
| Video, logo, or music is missing | Exact filenames/capitalization and the `assets` folder were preserved |
| Old styling appears | Bump CSS/JS release queries when uploading changed code, then reload |
| Music waits for a tap | Use Play music; audible autoplay is controlled by the browser |
| Calendar downloads instead of opening an app | Open the downloaded `.ics` with the device's calendar application |

## Official references

- [Configure the GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Upload files to a repository and file-size limits](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
