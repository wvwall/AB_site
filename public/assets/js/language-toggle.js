document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.querySelector("#toggle");

  // Detect current language from URL
  const currentPath = window.location.pathname;
  const isEnglish = currentPath.startsWith("/en");
  checkbox.checked = isEnglish;

  // Toggle language and navigate
  const toggleLang = () => {
    const newLang = checkbox.checked ? "en" : "it";
    const newPath = currentPath.replace(/^\/(it|en)\//, `/${newLang}/`);
    window.location.href = newPath;
  };

  checkbox.addEventListener("click", toggleLang);
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
