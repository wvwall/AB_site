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
