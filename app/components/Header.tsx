// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button } from "@cloudflare/kumo/components/button";
import { Tooltip } from "@cloudflare/kumo/components/tooltip";
import { BellIcon, BellRingingIcon, BellSlashIcon, GearSixIcon, ListIcon, MagnifyingGlassIcon, RobotIcon, XIcon } from "@phosphor-icons/react";
import ThemeToggle from "~/components/ThemeToggle";
import SearchInput from "~/components/SearchInput";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";
import { useNotifications } from "~/hooks/useNotifications";

export default function Header() {
	const [isSearchExpanded, setIsSearchExpanded] = useState(false);
	const { toggleSidebar, toggleAgentPanel, isAgentPanelOpen, selectedEmailId, isComposing } = useUIStore();
	const { permission, requestPermission } = useNotifications();
	const location = useLocation();
	const navigate = useNavigate();
	const { mailboxId } = useParams<{ mailboxId: string }>();

	const isSettingsActive = location.pathname.includes("/settings");
	const inDetailView = !!selectedEmailId || isComposing;

	return (
		<header className={`flex items-center gap-2 px-3 py-2.5 border-b border-kumo-line sticky top-0 z-10 md:px-5 md:gap-4 safe-area-top transition-colors ${
			inDetailView ? "hidden md:flex bg-kumo-base" : "flex glass"
		}`}>
			{/* Mobile search takeover */}
			{isSearchExpanded ? (
				<>
					<div className="flex-1 min-w-0">
						<SearchInput className="w-full" autoFocus onSubmit={() => setIsSearchExpanded(false)} />
					</div>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<XIcon size={20} />}
						onClick={() => setIsSearchExpanded(false)}
						aria-label="Close search"
						className="shrink-0"
					/>
				</>
			) : (
				<>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<ListIcon size={20} />}
						onClick={toggleSidebar}
						aria-label="Toggle sidebar"
						className="md:hidden shrink-0"
					/>

					<div className="hidden md:flex flex-1 max-w-lg">
						<SearchInput className="w-full" />
					</div>

					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<MagnifyingGlassIcon size={20} />}
						onClick={() => setIsSearchExpanded(true)}
						aria-label="Search"
						className="md:hidden shrink-0"
					/>

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
				</>
			)}
		</header>
	);
}