import { wedding } from "./wedding-config.js";
import { CalendarConfigurationError, createCalendarEvent, createIcs, parseEventDate, validateTimeZone } from "./calendar.js";
import { createLetterController } from "./letter.js?v=gilded-20260910";
import { createMusicController } from "./music.js?v=opening-music-20260910";

const invitation = document.getElementById("invitation");
const stage = document.getElementById("video-stage");
const video = document.getElementById("invitation-video");
const audio = document.getElementById("wedding-music");
const status = document.getElementById("playback-status");
const playButton = document.getElementById("play-button");
const playLabel = document.getElementById("play-label");
const pauseButton = document.getElementById("pause-button");
const earlyAction = document.getElementById("early-action");
const letterPanel = document.getElementById("letter-panel");
const loadingPanel = document.getElementById("loading-panel");
const errorPanel = document.getElementById("error-panel");
const calendarButton = document.getElementById("calendar-button");
const loadingTitle = document.getElementById("loading-title");
const loadingMessage = document.getElementById("loading-message");
const loadingRetry = document.getElementById("loading-retry");
const withoutMusic = document.getElementById("continue-without-music");

let state = "loading";
let playRequest = 0;
let playPending = false;
let letterWasShown = false;
let slowLoadTimer;
let retryTimer;

video.controls = false;
// The couple selected the supplied song instead of the video's embedded audio.
video.muted = true;

function notify(id, message) {
  document.getElementById(`${id}-message`).textContent = message;
  document.getElementById(`${id}-notice`).hidden = false;
}

const music = createMusicController(
  audio,
  document.getElementById("music-toggle"),
  message => notify("music", message),
);
audio.addEventListener("playing", () => { document.getElementById("music-notice").hidden = true; });

const letter = createLetterController(letterPanel, () => {
  const hadFocus = document.activeElement === earlyAction;
  earlyAction.hidden = true;
  if (hadFocus && state === "ready") playButton.focus({ preventScroll: true });
  if (hadFocus && state === "ended") document.getElementById("end-heading").focus({ preventScroll: true });
});

function setState(next, announcement = "", animateLetter = false) {
  state = next;
  invitation.dataset.state = next;
  stage.setAttribute("aria-busy", String(next === "loading"));
  loadingPanel.hidden = next !== "loading";
  errorPanel.hidden = next !== "error";
  letterPanel.hidden = next !== "ready" && next !== "ended";
  pauseButton.hidden = next !== "playing";
  status.textContent = announcement;
  if (!letterPanel.hidden) {
    letter.show(next === "ended" ? "ending" : "opening", animateLetter);
  } else {
    letter.finish();
  }
  earlyAction.textContent = next === "ended" ? "Show details" : "Open invitation";
  earlyAction.hidden = letterPanel.hidden || !letter.revealing;
  if (next !== "loading") {
    clearTimeout(slowLoadTimer);
    clearTimeout(retryTimer);
  }
}

function showLoading(buffering = false) {
  clearTimeout(slowLoadTimer);
  clearTimeout(retryTimer);
  loadingRetry.hidden = true;
  withoutMusic.hidden = true;
  loadingTitle.textContent = buffering ? "A little pause" : "A little moment of love";
  loadingMessage.textContent = buffering ? "Your invitation is buffering..." : "Preparing your invitation and music...";
  setState("loading", loadingMessage.textContent);
  slowLoadTimer = setTimeout(() => {
    loadingMessage.textContent = "Taking a little longer on this connection. Your invitation is on its way.";
    withoutMusic.hidden = music.playing || !music.enabled;
    status.textContent = loadingMessage.textContent;
  }, 9000);
  retryTimer = setTimeout(() => {
    loadingMessage.textContent = "Still waiting? Check your connection, or try loading again.";
    loadingRetry.hidden = false;
    status.textContent = loadingMessage.textContent;
  }, 25000);
}

function showPlayPrompt(animate = !letterWasShown && video.currentTime < 0.1) {
  const moveFocus = document.activeElement === pauseButton;
  const resuming = video.currentTime > 0 && !video.ended;
  playLabel.textContent = resuming ? "Resume Invitation" : "Play Invitation";
  setState("ready", resuming ? "Invitation paused. Select Resume Invitation to continue." : "Select Play Invitation to watch with the wedding music.", animate);
  letterWasShown = true;
  if (moveFocus) playButton.focus({ preventScroll: true });
}

function showError(message) {
  document.getElementById("error-message").textContent = message;
  setState("error", message);
}

async function playInvitation() {
  const request = ++playRequest;
  playPending = true;
  showLoading(video.currentTime > 0);
  try {
    // Start sound in the gesture handler; don't let the film run behind a waiting audio request.
    await music.start();
    if (request !== playRequest || state === "error") return;
    await video.play();
    if (request !== playRequest) return;
    playPending = false;
    if (!video.paused) setState("playing", "Your wedding invitation is playing.");
  } catch (error) {
    if (request !== playRequest) return;
    playPending = false;
    video.pause();
    if (state === "error") return;
    if (error.name === "NotAllowedError" || (error.name === "AbortError" && !video.error)) {
      showPlayPrompt();
    } else {
      console.error("Invitation playback failed:", error);
      showError("Your invitation couldn't play in this browser. Try again, or open the video directly.");
    }
  }
}

function retryVideo() {
  ++playRequest;
  playPending = false;
  video.load();
  void playInvitation();
}

video.addEventListener("playing", () => {
  if (!playPending) setState("playing", "Your wedding invitation is playing.");
});
video.addEventListener("waiting", () => {
  if (!video.paused && state === "playing") showLoading(true);
});
video.addEventListener("pause", () => {
  if (!playPending && !video.ended && !video.error && (state === "playing" || state === "loading")) showPlayPrompt(false);
});
video.addEventListener("ended", () => {
  playPending = false;
  const moveFocus = document.activeElement === pauseButton;
  setState("ended", "Your invitation is complete. The wedding schedule, calendar invitation, and replay are now available.", true);
  if (moveFocus) (letter.revealing ? earlyAction : calendarButton).focus({ preventScroll: true });
});
video.addEventListener("error", () => {
  console.error("Invitation media error:", video.error);
  playPending = false;
  const unsupported = video.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || video.error?.code === MediaError.MEDIA_ERR_DECODE;
  showError(unsupported
    ? "This browser couldn't play the invitation. Try opening the video directly, or use Safari or Chrome."
    : "Your invitation couldn't load. Please check your connection and try again.");
});
video.querySelector("source").addEventListener("error", () => {
  console.error("The invitation video source could not be loaded.");
  playPending = false;
  showError("Your invitation couldn't load. Please check your connection and try again.");
});

playButton.addEventListener("click", () => { void playInvitation(); });
pauseButton.addEventListener("click", () => { video.pause(); });
earlyAction.addEventListener("click", () => {
  if (state === "ready" || state === "ended") letter.finish();
});
document.getElementById("retry-button").addEventListener("click", retryVideo);
loadingRetry.addEventListener("click", retryVideo);
withoutMusic.addEventListener("click", () => {
  music.disable();
  void playInvitation();
});
document.getElementById("replay-button").addEventListener("click", () => {
  if (calendarButton.hasAttribute("href")) document.getElementById("calendar-notice").hidden = true;
  video.currentTime = 0;
  void playInvitation();
});
calendarButton.addEventListener("click", event => {
  if (!calendarButton.hasAttribute("href")) {
    event.preventDefault();
    document.getElementById("calendar-notice").hidden = false;
  } else {
    notify("calendar", "Open the downloaded invitation with your calendar to save the date. In WhatsApp, use Safari or Chrome if needed.");
  }
});
document.querySelectorAll("[data-dismiss]").forEach(button => {
  button.addEventListener("click", () => { document.getElementById(button.dataset.dismiss).hidden = true; });
});

document.addEventListener("visibilitychange", () => {
  document.body.classList.toggle("page-hidden", document.hidden);
  if (document.hidden) {
    ++playRequest;
    playPending = false;
    if (!video.paused && !video.ended) video.pause();
    if (state === "loading") showPlayPrompt(false);
    music.suspend();
  } else {
    music.restore();
  }
});

function prepareCalendar() {
  try {
    const start = parseEventDate(wedding.start, "start date/time");
    const timeZone = validateTimeZone(wedding.timeZone);
    const date = new Intl.DateTimeFormat("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone,
    }).format(start);
    document.getElementById("event-date").textContent = date;
    document.getElementById("opening-date").textContent = new Intl.DateTimeFormat("en-GB", {
      day: "numeric", month: "long", year: "numeric", timeZone,
    }).format(start);
    document.getElementById("event-location").textContent = wedding.location;
    const schedule = [...document.querySelectorAll("#wedding-schedule li")].map(item =>
      `${item.querySelector("time").textContent} ${item.querySelector("span").textContent.replace(/\s+/g, " ")}`,
    ).join("\n");
    const event = createCalendarEvent(wedding);
    event.description = `${event.description}\n\nWedding schedule (local venue time):\n${schedule}`.trim();
    calendarButton.href = URL.createObjectURL(new Blob([createIcs(event)], { type: "text/calendar;charset=utf-8" }));
  } catch (error) {
    if (!(error instanceof CalendarConfigurationError)) throw error;
    console.warn("Calendar setup required:", error.message);
    calendarButton.setAttribute("aria-disabled", "true");
    calendarButton.tabIndex = 0;
    notify("calendar", "The calendar invitation couldn't be prepared. Please contact Amel or Amer for the wedding details.");
  }
}

prepareCalendar();
document.body.classList.toggle("page-hidden", document.hidden);
if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
  showError("Your invitation couldn't load. Please check your connection and try again.");
} else {
  // Music may autoplay, but the film always waits for the guest's Play Invitation tap.
  showPlayPrompt(true);
  music.autoplay();
}
