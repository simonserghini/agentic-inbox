// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button, Tooltip } from "@cloudflare/kumo";
import {
	ClockIcon,
	MagnifyingGlassIcon,
	XIcon,
} from "@phosphor-icons/react";
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

const MAX_RECENT_SEARCHES = 10;

/** Search operators and their autocomplete suggestions. */
const OPERATOR_TEMPLATES = [
	{ prefix: "from:", label: "from: — filter by sender", placeholder: "from:name@example.com" },
	{ prefix: "to:", label: "to: — filter by recipient", placeholder: "to:name@example.com" },
	{ prefix: "subject:", label: "subject: — filter by subject", placeholder: "subject:meeting" },
	{ prefix: "is:unread", label: "is:unread — only unread emails", placeholder: "is:unread" },
	{ prefix: "is:read", label: "is:read — only read emails", placeholder: "is:read" },
	{ prefix: "is:starred", label: "is:starred — only starred", placeholder: "is:starred" },
	{ prefix: "has:attachment", label: "has:attachment — only with files", placeholder: "has:attachment" },
	{ prefix: "before:", label: "before: — before date", placeholder: "before:2025-01-01" },
	{ prefix: "after:", label: "after: — after date", placeholder: "after:2025-01-01" },
];

/** Syntax colors for search operators. */
const SYNTAX_COLORS = {
	from: "text-kumo-brand",
	to: "text-kumo-brand",
	subject: "text-kumo-brand",
	is: "text-kumo-success",
	has: "text-kumo-success",
	before: "text-kumo-warning",
	after: "text-kumo-warning",
	in: "text-kumo-brand",
} as Record<string, string>;

interface SearchInputProps {
	className?: string;
	onSearchResultPreview?: (results: any[]) => void;
}

export default function SearchInput({ className }: SearchInputProps) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

	// Recent searches from localStorage
	const [recentSearches, setRecentSearches] = useState<string[]>(() => {
		try {
			const saved = localStorage.getItem("agentic-inbox-recent-searches");
			return saved ? JSON.parse(saved) : [];
		} catch {
			return [];
		}
	});

	const saveRecentSearch = useCallback((query: string) => {
		if (!query.trim()) return;
		setRecentSearches((prev) => {
			const filtered = prev.filter((s) => s !== query);
			const next = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
			localStorage.setItem("agentic-inbox-recent-searches", JSON.stringify(next));
			return next;
		});
	}, []);

	const clearRecentSearches = useCallback(() => {
		setRecentSearches([]);
		localStorage.removeItem("agentic-inbox-recent-searches");
	}, []);

	// Filtered suggestions based on current input
	const suggestions = useMemo(() => {
		const lower = value.toLowerCase().trim();

		// If user is typing after an operator prefix, suggest completions
		if (lower.startsWith("from:")) return OPERATOR_TEMPLATES.filter((t) => t.prefix.startsWith("from"));
		if (lower.startsWith("to:")) return OPERATOR_TEMPLATES.filter((t) => t.prefix.startsWith("to"));
		if (lower.startsWith("subject:")) return OPERATOR_TEMPLATES.filter((t) => t.prefix.startsWith("subject"));
		if (lower.startsWith("is:")) {
			return ["unread", "read", "starred", "unstarred"]
				.filter((v) => v.startsWith(lower.slice(3)))
				.map((v) => ({ prefix: `is:${v}`, label: `is:${v}`, placeholder: `is:${v}` }));
		}
		if (lower.startsWith("has:")) {
			return ["attachment"].filter((v) => v.startsWith(lower.slice(4)))
				.map((v) => ({ prefix: `has:${v}`, label: `has:${v}`, placeholder: `has:${v}` }));
		}
		if (lower.startsWith("before:")) return OPERATOR_TEMPLATES.filter((t) => t.prefix.startsWith("before"));
		if (lower.startsWith("after:")) return OPERATOR_TEMPLATES.filter((t) => t.prefix.startsWith("after"));

		// Otherwise suggest operators that start with what the user typed
		const matches = OPERATOR_TEMPLATES.filter(
			(t) => lower === "" || t.prefix.startsWith(lower),
		);

		// Add recent searches
		const recentMatches = recentSearches
			.filter((s) => s.toLowerCase().includes(lower))
			.slice(0, 5)
			.map((s) => ({ prefix: s, label: s, placeholder: s, isRecent: true }));

		return [...matches, ...recentMatches];
	}, [value, recentSearches]);

	// Reset selection when suggestions change
	useEffect(() => {
		setSelectedSuggestion(-1);
	}, [suggestions.length]);

	const performSearch = useCallback(() => {
		const query = value.trim();
		if (!query || !mailboxId) return;
		saveRecentSearch(query);
		navigate(`/mailbox/${mailboxId}/search?q=${encodeURIComponent(query)}`);
		setIsFocused(false);
	}, [value, mailboxId, navigate, saveRecentSearch]);

	const applySuggestion = useCallback((suggestion: string) => {
		setValue(suggestion);
		setIsFocused(false);
		inputRef.current?.focus();
		// Auto-search after picking a suggestion
		if (mailboxId) {
			saveRecentSearch(suggestion);
			navigate(`/mailbox/${mailboxId}/search?q=${encodeURIComponent(suggestion)}`);
		}
	}, [mailboxId, navigate, saveRecentSearch]);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			if (selectedSuggestion >= 0 && selectedSuggestion < suggestions.length) {
				applySuggestion(suggestions[selectedSuggestion].prefix);
			} else {
				performSearch();
			}
		}
		if (e.key === "Escape") {
			setIsFocused(false);
			inputRef.current?.blur();
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedSuggestion((prev) =>
				Math.min(prev + 1, suggestions.length - 1),
			);
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedSuggestion((prev) => Math.max(prev - 1, -1));
		}
	};

	// Render syntax-highlighted value as overlay
	const renderSyntaxHighlight = () => {
		if (!value) return null;
		const parts: React.ReactNode[] = [];
		const regex = /\b(from|to|subject|in|is|has|before|after):(?:"[^"]*?"|\S*)/gi;

		// Reset regex state
		regex.lastIndex = 0;
		const tokens: { start: number; end: number; color: string }[] = [];

		while ((match = regex.exec(value)) !== null) {
			const op = match[1].toLowerCase();
			tokens.push({ start: match.index, end: regex.lastIndex, color: SYNTAX_COLORS[op] || "text-kumo-brand" });
		}

		if (tokens.length === 0) return null;

		let idx = 0;
		for (const token of tokens) {
			if (token.start > idx) {
				parts.push(
					<span key={`plain-${idx}`} className="opacity-0">
						{value.slice(idx, token.start)}
					</span>,
				);
			}
			parts.push(
				<span key={`token-${token.start}`} className={token.color}>
					{value.slice(token.start, token.end)}
				</span>,
			);
			idx = token.end;
		}
		if (idx < value.length) {
			parts.push(
				<span key={`plain-${idx}`} className="opacity-0">
					{value.slice(idx)}
				</span>,
			);
		}

		return (
			<div
				className="absolute inset-0 flex items-center pointer-events-none px-3 text-sm font-mono whitespace-pre overflow-hidden"
				aria-hidden="true"
			>
				{parts}
			</div>
		);
	};

	return (
		<div className={`relative ${className || ""}`}>
			<div className="relative flex items-center">
				<div className="relative flex-1">
					<input
						ref={inputRef}
						type="text"
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							setIsFocused(true);
						}}
						onFocus={() => setIsFocused(true)}
						onBlur={() => {
							// Delay to allow click on suggestion
							setTimeout(() => setIsFocused(false), 150);
						}}
						onKeyDown={handleKeyDown}
						placeholder="Search emails... (try from:name, is:unread, has:attachment)"
						className="w-full bg-transparent text-sm text-kumo-default placeholder:text-kumo-subtle py-1.5 px-3 rounded-md border border-kumo-line focus:border-kumo-brand focus:outline-none font-mono"
						aria-label="Search emails"
						autoComplete="off"
					/>
					{renderSyntaxHighlight()}
				</div>
				{value && (
					<button
						type="button"
						onClick={() => setValue("")}
						className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded text-kumo-subtle hover:text-kumo-default hover:bg-kumo-tint"
						aria-label="Clear search"
					>
						<XIcon size={14} />
					</button>
				)}
				<Tooltip content="Search" side="bottom" asChild>
					<Button
						variant="ghost"
						shape="square"
						icon={<MagnifyingGlassIcon size={20} />}
						onClick={performSearch}
						aria-label="Search"
					/>
				</Tooltip>
			</div>

			{/* Autocomplete dropdown */}
			{isFocused && suggestions.length > 0 && (
				<div className="absolute top-full left-0 right-0 mt-1 bg-kumo-base border border-kumo-line rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
					{suggestions.map((suggestion, idx) => (
						<div
							key={suggestion.prefix}
							className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${
								idx === selectedSuggestion
									? "bg-kumo-brand/10 text-kumo-default"
									: "text-kumo-strong hover:bg-kumo-tint"
							}`}
							onMouseDown={(e) => {
								e.preventDefault();
								applySuggestion(suggestion.prefix);
							}}
							onMouseEnter={() => setSelectedSuggestion(idx)}
						>
							{"isRecent" in suggestion && suggestion.isRecent ? (
								<ClockIcon size={14} className="text-kumo-subtle shrink-0" />
							) : (
								<MagnifyingGlassIcon size={14} className="text-kumo-subtle shrink-0" />
							)}
							<span className="truncate">{suggestion.label}</span>
						</div>
					))}
					<div className="border-t border-kumo-line px-3 py-1.5 flex justify-between items-center">
						<span className="text-xs text-kumo-subtle">
							Press Enter to search, ↑↓ to navigate
						</span>
						{recentSearches.length > 0 && (
							<button
								type="button"
								onClick={clearRecentSearches}
								className="text-xs text-kumo-subtle hover:text-kumo-default"
							>
								Clear history
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
