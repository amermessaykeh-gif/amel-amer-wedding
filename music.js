export function createMusicController(audio, button, notify) {
  const label = button.querySelector("span");
  let enabled = true;
  let failed = false;
  let loading = false;
  let attempt = 0;
  let resumeOnVisible = false;
  audio.volume = 0.55;

  function update() {
    const playing = !failed && !audio.paused && !audio.muted;
    button.setAttribute("aria-pressed", String(!failed && (loading || playing)));
    label.textContent = failed ? "Retry music" : loading ? "Loading music" : playing ? "Music on" : "Play music";
    button.setAttribute("aria-label", failed ? "Retry background music" : loading || playing ? "Turn background music off" : "Play background music");
    button.dataset.state = failed ? "error" : loading ? "loading" : playing ? "playing" : "paused";
  }

  function reportFailure(error) {
    if (!failed) {
      console.error("Wedding music could not play:", error);
      notify("The music couldn't load. You can still watch the invitation. Select Retry music to try again.");
    }
    failed = true;
    loading = false;
    update();
  }

  async function start() {
    if (!enabled || failed || document.hidden) return false;
    const request = ++attempt;
    loading = true;
    try {
      const playback = audio.play();
      update();
      await playback;
      if (request !== attempt) return false;
      loading = false;
      update();
      return true;
    } catch (error) {
      if (request !== attempt) return false;
      loading = false;
      if (error.name === "AbortError" && (!enabled || document.hidden)) return false;
      if (error.name === "NotSupportedError") {
        reportFailure(error);
        return false;
      }
      update();
      throw error;
    }
  }

  function disable() {
    enabled = false;
    loading = false;
    resumeOnVisible = false;
    ++attempt;
    audio.pause();
    update();
  }

  async function startWithFeedback() {
    try {
      await start();
    } catch (error) {
      if (error.name !== "NotAllowedError" && error.name !== "AbortError") throw error;
      notify("This browser needs a tap to enable sound. Select Play music to start the wedding song.");
    }
  }

  function autoplay() {
    if (document.hidden) {
      resumeOnVisible = enabled;
    } else {
      void startWithFeedback();
    }
  }

  button.addEventListener("click", () => {
    if (!failed && enabled && (loading || !audio.paused)) {
      disable();
    } else {
      enabled = true;
      if (failed) {
        failed = false;
        audio.load();
      }
      void startWithFeedback();
    }
  });

  audio.addEventListener("playing", update);
  audio.addEventListener("pause", update);
  audio.addEventListener("error", () => { reportFailure(audio.error); });

  function suspend() {
    resumeOnVisible = enabled && (resumeOnVisible || loading || !audio.paused);
    loading = false;
    ++attempt;
    audio.pause();
    update();
  }

  function restore() {
    if (resumeOnVisible && enabled && !failed) {
      resumeOnVisible = false;
      void startWithFeedback();
    }
  }

  update();
  return { start, autoplay, disable, suspend, restore, get playing() { return !failed && !loading && !audio.paused; }, get enabled() { return enabled; } };
}
