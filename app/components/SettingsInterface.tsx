// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Surface } from "@cloudflare/kumo/components/surface";
import { Switch } from "@cloudflare/kumo/components/switch";
import type { ReactNode } from "react";
import { Layout, Moon, Sun, Monitor } from "lucide-react";
import { useDarkMode } from "~/hooks/useDarkMode";
import { useUIStore } from "~/hooks/useUIStore";
import type { ThemePreference } from "~/lib/theme";

function SettingRow({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-kumo-line bg-kumo-recessed/50">
			<div className="space-y-1 min-w-0">
				<div className="font-semibold text-kumo-default">{title}</div>
				<div className="text-xs text-kumo-subtle">{description}</div>
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
}

const THEME_OPTIONS: { id: ThemePreference | "system"; label: string; icon: ReactNode }[] = [
	{ id: "light", label: "Light", icon: <Sun size={16} /> },
	{ id: "dark", label: "Dark", icon: <Moon size={16} /> },
	{ id: "system", label: "System", icon: <Monitor size={16} /> },
];

export default function SettingsInterface() {
	const {
		isNavSidebarEnabled,
		setNavSidebarEnabled,
		isAgentPanelOpen,
		setAgentPanelOpen,
		isThreadedView,
		setThreadedView,
	} = useUIStore();
	const { themePreference, setThemePreference } = useDarkMode();

	return (
		<Surface className="flex-1 p-8 rounded-3xl border border-kumo-line bg-kumo-base shadow-sm">
			<div className="space-y-8 max-w-xl">
				<div>
					<h3 className="text-xl font-bold text-kumo-default mb-1 flex items-center gap-2">
						<Layout size={20} className="text-kumo-brand" />
						Interface
					</h3>
					<p className="text-sm text-kumo-subtle">
						Layout and appearance preferences. Changes apply immediately.
					</p>
				</div>

				<div className="space-y-4">
					<div className="text-sm font-bold text-kumo-default uppercase tracking-wider">Layout</div>

					<SettingRow
						title="Folder sidebar"
						description="Show a collapsed folder rail on desktop that expands when you hover it."
					>
						<Switch
							checked={isNavSidebarEnabled}
							onCheckedChange={setNavSidebarEnabled}
						/>
					</SettingRow>

					<SettingRow
						title="Agent panel"
						description="Show a collapsed agent rail on desktop that expands when you hover it."
					>
						<Switch
							checked={isAgentPanelOpen}
							onCheckedChange={setAgentPanelOpen}
						/>
					</SettingRow>

					<SettingRow
						title="Threaded inbox"
						description="Group related emails into conversation threads."
					>
						<Switch
							checked={isThreadedView}
							onCheckedChange={setThreadedView}
						/>
					</SettingRow>
				</div>

				<div className="space-y-4">
					<div className="text-sm font-bold text-kumo-default uppercase tracking-wider">Appearance</div>

					<div className="p-5 rounded-2xl border border-kumo-line bg-kumo-recessed/50 space-y-3">
						<div className="space-y-1">
							<div className="font-semibold text-kumo-default">Theme</div>
							<div className="text-xs text-kumo-subtle">
								Choose light, dark, or match your system setting.
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							{THEME_OPTIONS.map((option) => {
								const active = themePreference === option.id;
								return (
									<button
										key={option.id}
										type="button"
										onClick={() => setThemePreference(option.id)}
										className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
											active
												? "bg-kumo-brand text-white border-kumo-brand shadow-lg shadow-kumo-brand/25"
												: "text-kumo-subtle border-kumo-line hover:bg-kumo-tint hover:text-kumo-default"
										}`}
									>
										{option.icon}
										{option.label}
									</button>
								);
							})}
						</div>
					</div>
				</div>

				<div className="p-4 rounded-2xl border border-dashed border-kumo-line bg-kumo-recessed/30 text-xs text-kumo-subtle leading-relaxed">
					On desktop, sidebars stay collapsed as thin rails at the screen edges and slide
					open while your cursor is over them.
				</div>
			</div>
		</Surface>
	);
}