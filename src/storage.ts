import { type Resume, createEmptyResume } from "./cv-parser";

const STORAGE_KEY = "cv-builder-resume";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function saveToStorage(resume: Resume): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
  } catch {
    console.error("Failed to save resume to localStorage");
  }
}

export function loadFromStorage(): Resume {
  if (!isBrowser()) return createEmptyResume();
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as Resume;
    }
  } catch {
    console.error("Failed to load resume from localStorage");
  }
  return createEmptyResume();
}
