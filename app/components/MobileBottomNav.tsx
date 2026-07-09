// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Tooltip } from "@cloudflare/kumo/components/tooltip";
import {
	EnvelopeSimpleIcon,
	GearSixIcon,
	ListIcon,
	PencilSimpleIcon,
	RobotIcon,
} from "@phosphor-icons/react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useUIStore } from "~/hooks/useUIStore";

export default function MobileBottomNav() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const location = useLocation();
	const navigate = useNavigate();
	const {
		toggleSidebar,
		toggleAgentPanel,
		startCompose,
		isAgentPanelOpen,
		selectedEmailId,
		isComposing,
	} = useUIStore();

	if (selectedEmailId || isComposing) return null;

	const isInbox =
		location.pathname.includes("/emails/inbox") ||
		location.pathname.endsWith(`/mailbox/${mailboxId}`);

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-kumo-base/95 backdrop-blur-md border-t border-kumo-line safe-area-bottom">
			<div className="flex items-center justify-around h-14 px-2">
				<Tooltip content="Inbox" side="top" asChild>
					<button
						type="button"
						onClick={() => navigate(`/mailbox/${mailboxId}/emails/inbox`)}
						className={`flex flex-col items-center gap-0.5 p-1.5 min-w-[56px] rounded-lg transition-colors ${
							isInbox ? "text-kumo-brand" : "text-kumo-subtle hover:text-kumo-default"
						}`}
					>
						<EnvelopeSimpleIcon size={22} weight={isInbox ? "fill" : "regular"} />
						<span className="text-[10px] font-medium">Inbox</span>
					</button>
				</Tooltip>

				<Tooltip content="Folders" side="top" asChild>
					<button
						type="button"
						onClick={toggleSidebar}
						className="flex flex-col items-center gap-0.5 text-kumo-subtle hover:text-kumo-default p-1.5 min-w-[56px] rounded-lg transition-colors"
					>
						<ListIcon size={22} weight="regular" />
						<span className="text-[10px] font-medium">Folders</span>
					</button>
				</Tooltip>

				<button
					type="button"
					onClick={() => startCompose()}
					className="flex items-center justify-center w-12 h-12 rounded-full bg-kumo-brand text-white -mt-5 shadow-lg shadow-kumo-brand/30 hover:bg-kumo-brand-hover active:scale-95 transition-all"
					aria-label="Compose"
				>
					<PencilSimpleIcon size={24} weight="bold" />
				</button>

				<Tooltip content="Agent" side="top" asChild>
					<button
						type="button"
						onClick={toggleAgentPanel}
						className={`flex flex-col items-center gap-0.5 p-1.5 min-w-[56px] rounded-lg transition-colors ${
							isAgentPanelOpen
								? "text-kumo-brand"
								: "text-kumo-subtle hover:text-kumo-default"
						}`}
					>
						<RobotIcon size={22} weight={isAgentPanelOpen ? "fill" : "regular"} />
						<span className="text-[10px] font-medium">Agent</span>
					</button>
				</Tooltip>

				<Tooltip content="Settings" side="top" asChild>
					<button
						type="button"
						onClick={() => navigate(`/mailbox/${mailboxId}/settings`)}
						className={`flex flex-col items-center gap-0.5 p-1.5 min-w-[56px] rounded-lg transition-colors ${
							location.pathname.includes("/settings")
								? "text-kumo-brand"
								: "text-kumo-subtle hover:text-kumo-default"
						}`}
					>
						<GearSixIcon
							size={22}
							weight={location.pathname.includes("/settings") ? "fill" : "regular"}
						/>
						<span className="text-[10px] font-medium">Settings</span>
					</button>
				</Tooltip>
			</div>
		</nav>
	);
}