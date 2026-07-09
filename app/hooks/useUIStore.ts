// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { create } from "zustand";
import type { Email } from "~/types";

export type ComposeMode = "new" | "reply" | "reply-all" | "forward";

const NAV_COLLAPSED_KEY = "agentic-inbox-nav-collapsed";
const AGENT_PANEL_KEY = "agentic-inbox-agent-panel-open";

function getInitialNavCollapsed(): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
}

function getInitialAgentPanelOpen(): boolean {
	if (typeof window === "undefined") return false;
	const saved = localStorage.getItem(AGENT_PANEL_KEY);
	if (saved === "true") return true;
	if (saved === "false") return false;
	return window.matchMedia("(min-width: 1024px)").matches;
}

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

	// Desktop nav sidebar collapse
	isNavCollapsed: boolean;
	toggleNavCollapsed: () => void;

	// Agent panel
	isAgentPanelOpen: boolean;
	toggleAgentPanel: () => void;
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
	isNavCollapsed: getInitialNavCollapsed(),
	isAgentPanelOpen: getInitialAgentPanelOpen(),
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

	toggleNavCollapsed: () =>
		set((state) => {
			const next = !state.isNavCollapsed;
			localStorage.setItem(NAV_COLLAPSED_KEY, String(next));
			return { isNavCollapsed: next };
		}),

	toggleAgentPanel: () =>
		set((state) => {
			const next = !state.isAgentPanelOpen;
			localStorage.setItem(AGENT_PANEL_KEY, String(next));
			return { isAgentPanelOpen: next };
		}),

	setAgentCommand: (command) => {
		localStorage.setItem(AGENT_PANEL_KEY, "true");
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
