const CRAWL_DURATION_MS = 25000;

window.addEventListener("DOMContentLoaded", () => {
  const enterButton = document.getElementById("enterButton");

  window.setTimeout(() => {
    if (!enterButton) {
      return;
    }

    enterButton.hidden = false;
    enterButton.classList.add("is-visible");
  }, CRAWL_DURATION_MS);
});
