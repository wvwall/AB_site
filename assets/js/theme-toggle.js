document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.querySelector("#themeToggle");
  const body = document.body;

  // Check for saved theme preference or default to dark mode
  const currentTheme = localStorage.getItem("theme") || "dark";

  if (currentTheme === "light") {
    body.classList.add("light-mode");
    themeToggle.checked = true;
  }

  // Toggle theme
  themeToggle.addEventListener("click", () => {
    body.classList.toggle("light-mode");

    // Save theme preference
    const theme = body.classList.contains("light-mode") ? "light" : "dark";
    localStorage.setItem("theme", theme);
  });
});
