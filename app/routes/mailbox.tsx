// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { useEffect, useRef } from "react";
import { Outlet, useParams } from "react-router";
import AgentSidebar from "~/components/AgentSidebar";
import ComposeEmail from "~/components/ComposeEmail";
import Header from "~/components/Header";
import HoverExpandPanel from "~/components/HoverExpandPanel";
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
		isNavSidebarEnabled,
		isAgentPanelOpen,
		toggleAgentPanel,
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

			{/* Sidebar: overlay on mobile only */}
			<div
				className={`md:hidden fixed inset-y-0 left-0 z-40 w-[min(280px,85vw)] transform transition-transform duration-200 ease-in-out shadow-2xl ${
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

			{/* Desktop: collapsed sidebars that expand on hover */}
			<HoverExpandPanel
				side="left"
				expandedWidth={256}
				enabled={isNavSidebarEnabled}
				breakpoint="md"
			>
				<Sidebar />
			</HoverExpandPanel>

			<HoverExpandPanel
				side="right"
				expandedWidth={380}
				enabled={isAgentPanelOpen}
				breakpoint="md"
			>
				<AgentSidebar />
			</HoverExpandPanel>

			{/* Agent bottom sheet — phone only; tablet/small desktop uses hover rail */}
			{isAgentPanelOpen && (
				<div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
					<div
						className="absolute inset-0 bg-black/40 backdrop-blur-sm"
						onClick={toggleAgentPanel}
						aria-hidden="true"
					/>
					<div className="relative bg-kumo-base rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up safe-area-bottom shadow-[0_-8px_40px_rgba(0,0,0,0.15)]">
						<div className="w-10 h-1 rounded-full bg-kumo-line mx-auto mt-3 mb-1 shrink-0" />
						<AgentSidebar />
					</div>
				</div>
			)}

			<ComposeEmail />
		</div>
	);
}