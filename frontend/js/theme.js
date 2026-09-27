(() => {
  const themeStorageKey = "theme";
  const savedTheme = localStorage.getItem(themeStorageKey);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme === "dark" || savedTheme === "light"
    ? savedTheme
    : prefersDark ? "dark" : "light";

  document.documentElement.classList.toggle("dark", initialTheme === "dark");

  document.addEventListener("DOMContentLoaded", () => {
    const themeButton = document.createElement("button");
    themeButton.type = "button";
    const themeButtonHost = document.getElementById("themeToggleHost");
    themeButton.className = themeButtonHost
      ? "theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-800 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
      : "theme-toggle fixed right-4 top-4 z-50 rounded-full border border-gray-300 bg-white p-3 text-gray-800 shadow-md transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-700";
    themeButton.setAttribute("aria-label", "Switch to dark theme");
    themeButton.title = "Switch to dark theme";
    themeButton.innerHTML = `
      <svg data-theme-icon="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/></svg>
      <svg data-theme-icon="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hidden h-5 w-5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path stroke-linecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>`;

    const syncThemeButton = () => {
      const isDark = document.documentElement.classList.contains("dark");
      themeButton.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      themeButton.title = isDark ? "Switch to light theme" : "Switch to dark theme";
      themeButton.querySelector('[data-theme-icon="moon"]').classList.toggle("hidden", !isDark);
      themeButton.querySelector('[data-theme-icon="sun"]').classList.toggle("hidden", isDark);
    };

    themeButton.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem(themeStorageKey, isDark ? "dark" : "light");
      syncThemeButton();
    });

    if (themeButtonHost) themeButtonHost.append(themeButton);
    else document.body.append(themeButton);
    syncThemeButton();
  });
})();
