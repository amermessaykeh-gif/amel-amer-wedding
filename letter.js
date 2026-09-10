export function createLetterController(panel, onFinish) {
  const canvas = panel.querySelector(".letter-canvas");
  const copies = [...canvas.querySelectorAll("[data-copy]")];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function finish() {
    canvas.dataset.reveal = "settled";
    copies.forEach(copy => { copy.inert = false; });
    onFinish();
  }

  function show(scene, animate) {
    copies.forEach(copy => { copy.hidden = copy.dataset.copy !== scene; });
    canvas.dataset.scene = scene;
    panel.scrollTop = 0;
    if (!animate || reducedMotion.matches) {
      finish();
      return;
    }
    copies.forEach(copy => { copy.inert = true; });
    canvas.dataset.reveal = "pending";
    // Restart the same sheet rather than replacing its DOM or crossfading cards.
    void canvas.offsetWidth;
    canvas.dataset.reveal = "active";
  }

  canvas.addEventListener("animationend", event => {
    if (event.animationName !== "letter-travel" || !event.target.classList.contains("letter-sheet")) return;
    const current = event.target.getAnimations().find(animation => animation.animationName === "letter-travel");
    if (current?.playState === "finished") finish();
  });

  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) finish();
  });

  return { show, finish, get revealing() { return canvas.dataset.reveal === "active"; } };
}
