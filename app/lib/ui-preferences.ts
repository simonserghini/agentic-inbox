// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export const NAV_SIDEBAR_KEY = "agentic-inbox-nav-sidebar";
/** @deprecated migrated to NAV_SIDEBAR_KEY */
export const NAV_COLLAPSED_KEY = "agentic-inbox-nav-collapsed";
export const AGENT_PANEL_KEY = "agentic-inbox-agent-panel-open";
export const THREADED_VIEW_KEY = "agentic-inbox-threaded";

export function getStoredNavSidebarEnabled(): boolean {
	if (typeof window === "undefined") return true;
	const saved = localStorage.getItem(NAV_SIDEBAR_KEY);
	if (saved !== null) return saved === "true";
	// Legacy: collapsed=true meant hidden; collapsed=false meant always visible
	const legacy = localStorage.getItem(NAV_COLLAPSED_KEY);
	if (legacy !== null) return legacy !== "true";
	return true;
}

export function setStoredNavSidebarEnabled(enabled: boolean): void {
	localStorage.setItem(NAV_SIDEBAR_KEY, String(enabled));
}

export function getStoredAgentPanelOpen(): boolean | null {
	if (typeof window === "undefined") return null;
	const saved = localStorage.getItem(AGENT_PANEL_KEY);
	if (saved === "true") return true;
	if (saved === "false") return false;
	return null;
}

export function setStoredAgentPanelOpen(open: boolean): void {
	localStorage.setItem(AGENT_PANEL_KEY, String(open));
}

export function getDefaultAgentPanelOpen(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(min-width: 1024px)").matches;
}

export function getStoredThreadedView(): boolean {
	if (typeof window === "undefined") return true;
	const saved = localStorage.getItem(THREADED_VIEW_KEY);
	if (saved !== null) return saved === "true";
	return true;
}

export function setStoredThreadedView(threaded: boolean): void {
	localStorage.setItem(THREADED_VIEW_KEY, String(threaded));
}