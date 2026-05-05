import { useEffect, useState } from "react";

export function useDarkMode() {
	const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

	useEffect(() => {
		// Initialize theme from localStorage or system preference
		const savedTheme = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
		
		setIsDarkMode(shouldBeDark);
		
		if (shouldBeDark) {
			document.documentElement.classList.add("dark");
			// Add data-mode="dark" for Kumo UI library compatibility
			document.documentElement.setAttribute("data-mode", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			document.documentElement.setAttribute("data-mode", "light");
		}
	}, []);

	const toggleDarkMode = () => {
		setIsDarkMode((prev) => {
			const newMode = !prev;
			if (newMode) {
				document.documentElement.classList.add("dark");
				document.documentElement.setAttribute("data-mode", "dark");
				localStorage.setItem("theme", "dark");
			} else {
				document.documentElement.classList.remove("dark");
				document.documentElement.setAttribute("data-mode", "light");
				localStorage.setItem("theme", "light");
			}
			return newMode;
		});
	};

	return { isDarkMode, toggleDarkMode };
}
