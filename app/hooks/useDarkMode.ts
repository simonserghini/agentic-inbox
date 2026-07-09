import { useEffect, useState } from "react";
import { useBranding } from "~/contexts/BrandingContext";
import { applyDarkMode, resolveIsDark, setStoredThemePreference } from "~/lib/theme";

export function useDarkMode() {
	const { branding } = useBranding();
	const [isDarkMode, setIsDarkMode] = useState(() => resolveIsDark(branding.darkModeEnabled));

	useEffect(() => {
		const isDark = resolveIsDark(branding.darkModeEnabled);
		setIsDarkMode(isDark);
		applyDarkMode(isDark);
	}, [branding.darkModeEnabled]);

	const toggleDarkMode = () => {
		setIsDarkMode((prev) => {
			const newMode = !prev;
			setStoredThemePreference(newMode ? "dark" : "light");
			applyDarkMode(newMode);
			return newMode;
		});
	};

	return { isDarkMode, toggleDarkMode };
}