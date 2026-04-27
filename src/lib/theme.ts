export type Theme = "light" | "dark";

const THEME_COOKIE_NAME = "theme";
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function getTheme(): Theme {
  // synchronous cookie parser
  const match = document.cookie.match(
    new RegExp(`${THEME_COOKIE_NAME}=([^;]+)`),
  );
  const value = match?.[1];
  if (value === "light" || value === "dark") {
    return value;
  }
  return getSystemTheme();
}

export function toggleTheme(currentTheme: Theme): Theme {
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  const systemTheme = getSystemTheme();
  // If the new theme matches system preference, remove the cookie
  if (newTheme === systemTheme) {
    cookieStore.delete(THEME_COOKIE_NAME);
  } else {
    cookieStore.set({
      name: THEME_COOKIE_NAME,
      value: newTheme,
      expires: Date.now() + THEME_COOKIE_MAX_AGE,
    });
  }
  return newTheme;
}
