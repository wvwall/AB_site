document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.querySelector("#toggle");
  const html = document.documentElement;
  const currentYear = new Date().getFullYear();

  document.querySelector("#yearIT").textContent = currentYear;
  document.querySelector("#yearEN").textContent = currentYear;

  const itText = document.querySelectorAll(".it-text");
  const enText = document.querySelectorAll(".en-text");

  const toggleLang = () => {
    const isEnglish = checkbox.checked;
    html.classList.toggle("en", isEnglish);

    enText.forEach((el) => el.classList.toggle("hidden", !isEnglish));
    itText.forEach((el) => {
      el.classList.toggle("hidden", isEnglish);
      if (isEnglish) el.classList.remove("animate__animated");
    });
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
