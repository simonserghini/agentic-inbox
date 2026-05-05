import { Button, Tooltip } from "@cloudflare/kumo";
import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "~/hooks/useDarkMode";

export default function ThemeToggle() {
	const { isDarkMode, toggleDarkMode } = useDarkMode();

	return (
		<Tooltip content={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} side="bottom" asChild>
			<Button
				variant="ghost"
				shape="square"
				icon={isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
				onClick={toggleDarkMode}
				aria-label="Toggle theme"
			/>
		</Tooltip>
	);
}
