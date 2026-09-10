import argparse
import html
from pathlib import Path
import shutil
from urllib.parse import urljoin, urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parent.parent
SHARE_IMAGE = "assets/wedding-share.jpg"
URL_MARKER = "<!-- PUBLIC_URL_METADATA -->"
NOJEKYLL = Path(".nojekyll")
SITE_FILES = [
    NOJEKYLL,
    Path("index.html"),
    Path("styles.css"),
    Path("invitation.js"),
    Path("letter.js"),
    Path("music.js"),
    Path("calendar.js"),
    Path("wedding-config.js"),
    Path("AMEL_&_AMER_WEDDING_V.01.mp4"),
    Path("assets", "wedding-emblem.png"),
    Path("assets", "wedding-song.mp3"),
    Path("assets", "wedding-share.jpg"),
]


def public_url(value):
    parsed = urlsplit(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or any(character.isspace() for character in value)
        or "YOUR-USERNAME" in value.upper()
        or ".." in parsed.path.split("/")
    ):
        raise ValueError("Provide the real HTTPS website URL, without credentials, a query, or a fragment.")
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path.rstrip("/") + "/", "", ""))


def prepare(site_url, output):
    site_url = public_url(site_url)
    output = output.resolve()
    if output == ROOT or output in ROOT.parents:
        raise ValueError("The output must not be the source directory or one of its parents.")
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise ValueError("Use a new or empty output directory; existing files will not be overwritten.")
    for relative in SITE_FILES:
        if relative != NOJEKYLL and not (ROOT / relative).is_file():
            raise FileNotFoundError(f"Missing required site file: {relative}")

    source = (ROOT / "index.html").read_text(encoding="utf-8")
    image_reference = f'content="{SHARE_IMAGE}"'
    if source.count(image_reference) != 2 or source.count(URL_MARKER) != 1:
        raise ValueError("Expected two share-image references and one PUBLIC_URL_METADATA marker in index.html.")

    image_url = html.escape(urljoin(site_url, SHARE_IMAGE), quote=True)
    escaped_url = html.escape(site_url, quote=True)
    metadata = (
        f'<meta property="og:url" content="{escaped_url}">\n'
        f'    <meta property="og:image:secure_url" content="{image_url}">\n'
        f'    <link rel="canonical" href="{escaped_url}">'
    )
    source = source.replace(image_reference, f'content="{image_url}"').replace(URL_MARKER, metadata)

    output.mkdir(parents=True, exist_ok=True)
    for relative in SITE_FILES:
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if relative == NOJEKYLL:
            # Browser uploads can omit empty dotfiles; this marker is generated output.
            destination.write_bytes(b"")
        elif relative == Path("index.html"):
            destination.write_text(source, encoding="utf-8")
        else:
            shutil.copy2(ROOT / relative, destination)
    return site_url


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare a static Pages artifact with crawler-readable absolute sharing URLs.")
    parser.add_argument("--site-url", required=True, help="Public HTTPS site URL, including any repository subpath.")
    parser.add_argument("--output", type=Path, default=ROOT / "_site")
    arguments = parser.parse_args()
    deployed_url = prepare(arguments.site_url, arguments.output)
    print(f"Prepared {len(SITE_FILES)} files for {deployed_url} in {arguments.output.resolve()}")
