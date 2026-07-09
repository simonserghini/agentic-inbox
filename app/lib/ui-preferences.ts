// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

export const NAV_COLLAPSED_KEY = "agentic-inbox-nav-collapsed";
export const AGENT_PANEL_KEY = "agentic-inbox-agent-panel-open";
export const THREADED_VIEW_KEY = "agentic-inbox-threaded";

export function getStoredNavCollapsed(): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(NAV_COLLAPSED_KEY) === "true";
}

export function setStoredNavCollapsed(collapsed: boolean): void {
	localStorage.setItem(NAV_COLLAPSED_KEY, String(collapsed));
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