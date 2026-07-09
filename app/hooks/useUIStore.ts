// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { create } from "zustand";
import {
	getDefaultAgentPanelOpen,
	getStoredAgentPanelOpen,
	getStoredNavSidebarEnabled,
	getStoredThreadedView,
	setStoredAgentPanelOpen,
	setStoredNavSidebarEnabled,
	setStoredThreadedView,
} from "~/lib/ui-preferences";
import type { Email } from "~/types";

export type ComposeMode = "new" | "reply" | "reply-all" | "forward";

export interface ComposeOptions {
	mode: ComposeMode;
	originalEmail?: Email | null;
	/** When editing a draft, this holds the draft email to pre-fill the composer */
	draftEmail?: Email | null;
}

interface UIState {
	// Side panel state
	selectedEmailId: string | null;
	isComposing: boolean;
	_previousEmailId: string | null;
	selectEmail: (id: string | null) => void;
	startCompose: (options?: ComposeOptions) => void;
	closePanel: () => void;
	closeCompose: () => void;

	// Compose options
	composeOptions: ComposeOptions;

	// Mobile sidebar
	isSidebarOpen: boolean;
	openSidebar: () => void;
	closeSidebar: () => void;
	toggleSidebar: () => void;

	// Desktop nav sidebar (collapsed rail, expands on hover)
	isNavSidebarEnabled: boolean;
	setNavSidebarEnabled: (enabled: boolean) => void;

	// Agent panel
	isAgentPanelOpen: boolean;
	toggleAgentPanel: () => void;
	setAgentPanelOpen: (open: boolean) => void;

	// Inbox layout
	isThreadedView: boolean;
	setThreadedView: (threaded: boolean) => void;
	toggleThreadedView: () => void;
	agentCommand: string | null;
	setAgentCommand: (command: string | null) => void;

	// Legacy dialog support (kept for non-split views)
	isComposeModalOpen: boolean;
	openComposeModal: (options?: ComposeOptions) => void;
	closeComposeModal: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
	selectedEmailId: null,
	isComposing: false,
	_previousEmailId: null,
	composeOptions: { mode: "new", originalEmail: null },
	isComposeModalOpen: false,
	isSidebarOpen: false,
	isNavSidebarEnabled: getStoredNavSidebarEnabled(),
	isAgentPanelOpen: getStoredAgentPanelOpen() ?? getDefaultAgentPanelOpen(),
	isThreadedView: getStoredThreadedView(),
	agentCommand: null,

	selectEmail: (id) => set({ selectedEmailId: id, isComposing: false }),

	startCompose: (options) =>
		set((state) => {
			const mode = options?.mode || "new";
			const isReplyOrForward = mode === "reply" || mode === "reply-all" || mode === "forward";
			return {
				isComposing: true,
				_previousEmailId: state.selectedEmailId,
				// Keep selectedEmailId when replying/forwarding so the thread stays visible
				selectedEmailId: isReplyOrForward ? state.selectedEmailId : null,
				composeOptions: options || { mode: "new", originalEmail: null },
				isSidebarOpen: false,
			};
		}),

	closePanel: () => set({ selectedEmailId: null, isComposing: false, _previousEmailId: null, composeOptions: { mode: "new" as const, originalEmail: null } }),

	closeCompose: () =>
		set((state) => ({
			isComposing: false,
			selectedEmailId: state._previousEmailId,
			_previousEmailId: null,
			composeOptions: { mode: "new" as const, originalEmail: null },
		})),

	openSidebar: () => set({ isSidebarOpen: true }),
	closeSidebar: () => set({ isSidebarOpen: false }),
	toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),

	setNavSidebarEnabled: (enabled) => {
		setStoredNavSidebarEnabled(enabled);
		set({ isNavSidebarEnabled: enabled });
	},

	toggleAgentPanel: () => {
		const next = !get().isAgentPanelOpen;
		setStoredAgentPanelOpen(next);
		set({ isAgentPanelOpen: next });
	},

	setAgentPanelOpen: (open) => {
		setStoredAgentPanelOpen(open);
		set({ isAgentPanelOpen: open });
	},

	setThreadedView: (threaded) => {
		setStoredThreadedView(threaded);
		set({ isThreadedView: threaded });
	},

	toggleThreadedView: () => {
		const next = !get().isThreadedView;
		setStoredThreadedView(next);
		set({ isThreadedView: next });
	},

	setAgentCommand: (command) => {
		setStoredAgentPanelOpen(true);
		set({ agentCommand: command, isAgentPanelOpen: true });
	},

	openComposeModal: (options) =>
		set({
			composeOptions: options || { mode: "new", originalEmail: null },
			isComposeModalOpen: true,
		}),

	closeComposeModal: () =>
		set({
			isComposeModalOpen: false,
			composeOptions: { mode: "new", originalEmail: null },
		}),
}));
