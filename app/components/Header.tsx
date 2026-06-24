// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Tooltip } from "@cloudflare/kumo";
import { BellIcon, BellRingingIcon, BellSlashIcon, GearSixIcon, ListIcon, MagnifyingGlassIcon, RobotIcon } from "@phosphor-icons/react";
import ThemeToggle from "~/components/ThemeToggle";
import SearchInput from "~/components/SearchInput";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";
import { useNotifications } from "~/hooks/useNotifications";

export default function Header() {
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);
	const { toggleSidebar, toggleAgentPanel, isAgentPanelOpen } = useUIStore();
	const { permission, requestPermission } = useNotifications();
	const location = useLocation();
	const navigate = useNavigate();
	const { mailboxId } = useParams<{ mailboxId: string }>();

	const isSettingsActive = location.pathname.includes("/settings");

	return (
		<header className="flex items-center gap-2 px-3 py-2.5 bg-kumo-base border-b border-kumo-line sticky top-0 z-10 md:px-5 md:gap-4">
			{/* Hamburger menu - mobile only */}
			<Button
				variant="ghost"
				shape="square"
				size="sm"
				icon={<ListIcon size={20} />}
				onClick={toggleSidebar}
				aria-label="Toggle sidebar"
				className="md:hidden shrink-0"
			/>

			{/* Search - full on desktop, collapsible on mobile */}
			<div
				className={`flex-1 max-w-lg transition-all ${
					isSearchExpanded ? "flex" : "hidden md:flex"
				}`}
			>
				<SearchInput className="w-full" />
			</div>

			{/* Search toggle button - mobile only, hidden when search is expanded */}
			{!isSearchExpanded && (
				<Button
					variant="ghost"
					shape="square"
					size="sm"
					icon={<MagnifyingGlassIcon size={20} />}
					onClick={() => setIsSearchExpanded(true)}
					aria-label="Search"
					className="md:hidden shrink-0"
				/>
			)}

			<div className="flex items-center gap-1 ml-auto shrink-0">
				{permission !== "unsupported" && (
					<Tooltip
						content={
							permission === "denied"
								? "Notifications blocked — enable in browser settings"
								: permission === "granted"
									? "Notifications enabled"
									: "Enable notifications"
						}
						side="bottom"
						asChild
					>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={
								permission === "denied" ? (
									<BellSlashIcon size={18} className="text-kumo-subtle" />
								) : permission === "granted" ? (
									<BellRingingIcon size={18} className="text-kumo-brand" />
								) : (
									<BellIcon size={18} />
								)
							}
							onClick={permission === "default" ? requestPermission : undefined}
							aria-label="Notification settings"
						/>
					</Tooltip>
				)}
				<Tooltip content={isAgentPanelOpen ? "Hide agent panel" : "Show agent panel"} side="bottom" asChild>
					<Button
						variant={isAgentPanelOpen ? "secondary" : "ghost"}
						shape="square"
						icon={<RobotIcon size={20} />}
						onClick={toggleAgentPanel}
						aria-label="Toggle agent panel"
						className="hidden lg:inline-flex"
					/>
				</Tooltip>
				<ThemeToggle />
				<Tooltip content="Settings" side="bottom" asChild>
					<Button
						variant={isSettingsActive ? "secondary" : "ghost"}
						shape="square"
						icon={<GearSixIcon size={20} />}
						onClick={() =>
							navigate(
								isSettingsActive
									? `/mailbox/${mailboxId}/emails/inbox`
									: `/mailbox/${mailboxId}/settings`,
							)
						}
						aria-label="Settings"
					/>
				</Tooltip>
			</div>
		</header>
	);
}
