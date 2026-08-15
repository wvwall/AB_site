document.addEventListener("click", (event) => {
  document.querySelectorAll("details.lang-dropdown[open]").forEach((details) => {
    if (!details.contains(event.target)) {
      details.removeAttribute("open");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const cookieToggle = document.querySelector("#cookieToggle");
  const cookieText = document.querySelector("#cookieText");
  const cookieChevron = document.querySelector("#cookieChevron");

  if (!cookieToggle || !cookieText || !cookieChevron) return;

  cookieToggle.addEventListener("click", () => {
    const isOpen =
      cookieText.style.maxHeight !== "" && cookieText.style.maxHeight !== "0px";

    if (isOpen) {
      cookieText.style.maxHeight = "0px";
      cookieChevron.style.transform = "rotate(0deg)";
      cookieToggle.setAttribute("aria-expanded", "false");
    } else {
      cookieText.style.maxHeight = cookieText.scrollHeight + "px";
      cookieChevron.style.transform = "rotate(180deg)";
      cookieToggle.setAttribute("aria-expanded", "true");
    }
  });
});
