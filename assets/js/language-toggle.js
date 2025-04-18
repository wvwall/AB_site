const checkbox = document.querySelector("#toggle");
const html = document.querySelector("html");
const hour = new Date().getHours();
const currentYear = new Date().getFullYear();
document.querySelector("#yearIT").textContent = currentYear;
document.querySelector("#yearEN").textContent = currentYear;

const toggleLang = () => {
  const itText = document.querySelectorAll(".it-text");
  const enText = document.querySelectorAll(".en-text");

  if (checkbox.checked) {
    html.classList.add("en");
    enText.forEach((el) => el.classList.remove("hidden"));
    itText.forEach((el) => el.classList.add("hidden"));
    itText.forEach((el) => el.classList.remove("animate__animated"));
  } else {
    html.classList.remove("en");
    enText.forEach((el) => el.classList.add("hidden"));
    itText.forEach((el) => el.classList.remove("hidden"));
  }
};

checkbox.addEventListener("click", toggleLang);
