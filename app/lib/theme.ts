// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export const THEME_STORAGE_KEY = "theme";

export type ThemePreference = "dark" | "light";

export function getStoredThemePreference(): ThemePreference | null {
	if (typeof window === "undefined") return null;
	const saved = localStorage.getItem(THEME_STORAGE_KEY);
	return saved === "dark" || saved === "light" ? saved : null;
}

export function setStoredThemePreference(theme: ThemePreference): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function systemPrefersDark(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveIsDark(brandingDarkModeEnabled: boolean): boolean {
	const userPref = getStoredThemePreference();
	if (userPref === "dark") return true;
	if (userPref === "light") return false;
	return brandingDarkModeEnabled || systemPrefersDark();
}

export function applyDarkMode(isDark: boolean): void {
	if (typeof document === "undefined") return;
	if (isDark) {
		document.documentElement.classList.add("dark");
		document.documentElement.setAttribute("data-mode", "dark");
	} else {
		document.documentElement.classList.remove("dark");
		document.documentElement.setAttribute("data-mode", "light");
	}
}