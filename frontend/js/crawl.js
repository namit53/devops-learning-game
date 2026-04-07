const CRAWL_DURATION_MS = 25000;

window.addEventListener("DOMContentLoaded", () => {
  const enterButton = document.getElementById("enterButton");
  const skipButton = document.getElementById("skipButton");
  const crawlText = document.querySelector(".crawl-text");

  if (!enterButton) {
    return;
  }

  let crawlTimerId;
  let hasCompleted = false;

  const showEnterButton = () => {
    if (hasCompleted) {
      return;
    }

    hasCompleted = true;

    if (typeof crawlTimerId === "number") {
      window.clearTimeout(crawlTimerId);
    }

    if (crawlText) {
      crawlText.style.animation = "none";
    }

    enterButton.hidden = false;
    enterButton.style.animation = "none";
    enterButton.style.opacity = "1";
    enterButton.style.pointerEvents = "auto";
    enterButton.classList.add("is-visible");

    if (skipButton) {
      skipButton.disabled = true;
      skipButton.hidden = true;
    }
  };

  crawlTimerId = window.setTimeout(showEnterButton, CRAWL_DURATION_MS);

  if (skipButton) {
    skipButton.addEventListener("click", showEnterButton, { once: true });
  }
});
