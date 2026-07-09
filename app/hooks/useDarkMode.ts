import { useEffect, useState } from "react";
import { useBranding } from "~/contexts/BrandingContext";
import {
	applyDarkMode,
	getStoredThemePreference,
	resolveIsDark,
	setStoredThemePreference,
	type ThemePreference,
} from "~/lib/theme";

export type ThemePreferenceSetting = ThemePreference | "system";

function getThemePreferenceSetting(): ThemePreferenceSetting {
	return getStoredThemePreference() ?? "system";
}

export function useDarkMode() {
	const { branding } = useBranding();
	const [themePreference, setThemePreferenceState] = useState<ThemePreferenceSetting>(
		getThemePreferenceSetting,
	);
	const [isDarkMode, setIsDarkMode] = useState(() => resolveIsDark(branding.darkModeEnabled));

	useEffect(() => {
		const isDark = resolveIsDark(branding.darkModeEnabled);
		setIsDarkMode(isDark);
		applyDarkMode(isDark);
	}, [branding.darkModeEnabled]);

	const applyThemePreference = (preference: ThemePreferenceSetting) => {
		setThemePreferenceState(preference);
		if (preference === "system") {
			localStorage.removeItem("theme");
		} else {
			setStoredThemePreference(preference);
		}
		const isDark = resolveIsDark(branding.darkModeEnabled);
		setIsDarkMode(isDark);
		applyDarkMode(isDark);
	};

	const toggleDarkMode = () => {
		const next: ThemePreference = isDarkMode ? "light" : "dark";
		applyThemePreference(next);
	};

	const setThemePreference = (preference: ThemePreferenceSetting) => {
		applyThemePreference(preference);
	};

	return { isDarkMode, themePreference, toggleDarkMode, setThemePreference };
}