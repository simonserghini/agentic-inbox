// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useEffect, useRef } from "react";
import { Outlet, useParams } from "react-router";
import AgentSidebar from "~/components/AgentSidebar";
import ComposeEmail from "~/components/ComposeEmail";
import Header from "~/components/Header";
import MobileBottomNav from "~/components/MobileBottomNav";
import Sidebar from "~/components/Sidebar";
import { useMailbox } from "~/queries/mailboxes";
import { useUIStore } from "~/hooks/useUIStore";

export default function MailboxRoute() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	// Prefetch mailbox data for child components
	useMailbox(mailboxId);
	const prevMailboxIdRef = useRef<string | undefined>(undefined);
	const {
		isSidebarOpen,
		closeSidebar,
		isAgentPanelOpen,
		closePanel,
		closeComposeModal,
	} = useUIStore();

	useEffect(() => {
		if (
			prevMailboxIdRef.current &&
			mailboxId &&
			prevMailboxIdRef.current !== mailboxId
		) {
			closePanel();
			closeComposeModal();
			closeSidebar();
		}

		prevMailboxIdRef.current = mailboxId;
	}, [mailboxId, closeComposeModal, closePanel, closeSidebar]);

	return (
		<div className="flex h-screen overflow-hidden">
			{/* Mobile sidebar overlay backdrop */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden animate-fade-in"
					onClick={closeSidebar}
					onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
					role="button"
					tabIndex={-1}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar: hidden on mobile by default, shown as overlay when open */}
			<div
				className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:z-0 ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<Sidebar />
			</div>

			{/* Main content */}
			<div className="flex-1 flex flex-col min-w-0 bg-kumo-base">
				<Header />
				<main className="flex-1 overflow-hidden pb-14 md:pb-0">
					<Outlet />
				</main>
			</div>

			<MobileBottomNav />

			{/* Agent + MCP sidebar -- togglable on desktop, bottom sheet on mobile */}
			{isAgentPanelOpen && (
				<>
					{/* Desktop sidebar */}
					<div className="hidden lg:flex w-[380px] shrink-0 border-l border-kumo-line flex-col bg-kumo-base overflow-hidden">
						<AgentSidebar />
					</div>
					{/* Mobile bottom sheet */}
					<div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
						<div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={toggleAgentPanel} />
						<div className="relative bg-kumo-base rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-in-right">
							<div className="w-10 h-1 rounded-full bg-kumo-line mx-auto mt-2 mb-1" />
							<AgentSidebar />
						</div>
					</div>
				</>
			)}

			<ComposeEmail />
		</div>
	);
}
