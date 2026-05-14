// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Loader, Tooltip, Surface } from "@cloudflare/kumo";
import {
	ArrowUpIcon,
	RobotIcon,
	TrashIcon,
	UserIcon,
	EnvelopeSimpleIcon,
	MagnifyingGlassIcon,
	PaperPlaneTiltIcon,
	EyeIcon,
	ArrowBendUpLeftIcon,
	WrenchIcon,
	CheckCircleIcon,
	StopIcon,
	PencilSimpleIcon,
	MagicWandIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUIStore } from "~/hooks/useUIStore";
import type { UIMessage } from "ai";
import { formatShortDate } from "~/lib/utils";

const TOOL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
	list_emails: {
		label: "Scanning inbox",
		icon: <EnvelopeSimpleIcon size={14} weight="bold" />,
	},
	get_email: {
		label: "Reading content",
		icon: <EyeIcon size={14} weight="bold" />,
	},
	get_thread: {
		label: "Analyzing thread",
		icon: <ArrowBendUpLeftIcon size={14} weight="bold" />,
	},
	search_emails: {
		label: "Searching keywords",
		icon: <MagnifyingGlassIcon size={14} weight="bold" />,
	},
	semantic_search: {
		label: "Semantic search",
		icon: <MagicWandIcon size={14} weight="bold" />,
	},
	draft_email: {
		label: "Drafting email",
		icon: <PaperPlaneTiltIcon size={14} weight="bold" />,
	},
	draft_reply: {
		label: "Drafting reply",
		icon: <PaperPlaneTiltIcon size={14} weight="bold" />,
	},
	discard_draft: {
		label: "Discarding draft",
		icon: <TrashIcon size={14} weight="bold" />,
	},
	mark_email_read: {
		label: "Updating status",
		icon: <CheckCircleIcon size={14} weight="bold" />,
	},
	move_email: {
		label: "Organizing email",
		icon: <EnvelopeSimpleIcon size={14} weight="bold" />,
	},
	scan_unanswered: {
		label: "Scanning for stale emails",
		icon: <MagicWandIcon size={14} weight="bold" />,
	},
	read_attachment: {
		label: "Analyzing attachment",
		icon: <EyeIcon size={14} weight="bold" />,
	},
};

function RichToolResult({ toolName, result, onEmailClick }: { toolName: string; result: any; onEmailClick: (id: string) => void }) {
	if (!result) return null;

	if (toolName === "search_emails" || toolName === "semantic_search" || toolName === "scan_unanswered") {
		const emails = result.emails || result.results || [];
		if (emails.length === 0) return null;

		return (
			<div className="flex flex-col gap-2 mt-2 w-full">
				{emails.map((e: any) => (
					<button
						key={e.id || e.emailId}
						onClick={() => onEmailClick(e.id || e.emailId)}
						className="flex flex-col gap-1 p-3 rounded-xl border border-kumo-line bg-kumo-base hover:bg-kumo-tint transition-all text-left group/card shadow-sm hover:shadow-md"
					>
						<div className="flex justify-between items-start gap-2">
							<span className="text-xs font-bold text-kumo-default truncate group-hover/card:text-kumo-brand transition-colors">
								{e.subject || "(No Subject)"}
							</span>
							<span className="text-[10px] text-kumo-subtle whitespace-nowrap">
								{e.date ? formatShortDate(e.date) : ""}
							</span>
						</div>
						<div className="text-[11px] text-kumo-subtle truncate">
							{e.sender || e.from || ""}
						</div>
					</button>
				))}
			</div>
		);
	}

	if (toolName === "read_attachment") {
		return (
			<Surface className="mt-2 p-3 rounded-xl border-l-4 border-l-kumo-brand bg-kumo-brand/5 text-[12px] leading-relaxed">
				<div className="font-bold text-kumo-brand mb-1 flex items-center gap-1.5">
					<MagicWandIcon size={14} />
					AI Vision Analysis: {result.filename}
				</div>
				<div className="text-kumo-default italic">"{result.analysis}"</div>
			</Surface>
		);
	}

	return null;
}

function ToolCallBadge({
	toolName,
	state,
	result,
	onEmailClick
}: {
	toolName: string;
	state: string;
	result?: any;
	onEmailClick: (id: string) => void;
}) {
	const info = TOOL_LABELS[toolName] || {
		label: toolName,
		icon: <WrenchIcon size={14} weight="bold" />,
	};
	const isDone =
		state === "output-available" ||
		state === "result" ||
		state === "output-error";

	return (
		<div className="flex flex-col gap-1 w-full max-w-full">
			<div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-kumo-tint border border-kumo-line text-[11px] font-medium w-fit">
				<span className="text-kumo-brand">{info.icon}</span>
				<span className="text-kumo-default">{info.label}</span>
				{isDone ? (
					<CheckCircleIcon
						size={12}
						weight="fill"
						className="text-kumo-success ml-1"
					/>
				) : (
					<Loader size="sm" className="ml-1" />
				)}
			</div>
			{isDone && <RichToolResult toolName={toolName} result={result} onEmailClick={onEmailClick} />}
		</div>
	);
}

function getToolNameFromPart(part: UIMessage["parts"][number]): string | null {
	if (part.type === "dynamic-tool") return (part as any).toolName ?? null;
	if (part.type.startsWith("tool-")) return part.type.replace("tool-", "");
	return null;
}

function hasDraftReplyTool(message: UIMessage): boolean {
	return message.parts.some((part) => {
		const toolName = getToolNameFromPart(part);
		return toolName === "draft_reply" || toolName === "draft_email";
	});
}

function DraftActions({
	onEdit,
	disabled,
}: {
	onEdit: () => void;
	disabled: boolean;
}) {
	return (
		<div className="flex gap-1.5 mt-2">
			<Button
				variant="primary"
				size="sm"
				icon={<PencilSimpleIcon size={14} />}
				onClick={onEdit}
				disabled={disabled}
				className="rounded-full shadow-lg shadow-kumo-brand/20"
			>
				Edit & Send
			</Button>
		</div>
	);
}

function MessageBubble({
	message,
	onAction,
	onEmailClick,
	isStreaming,
}: {
	message: UIMessage;
	onAction?: (action: string) => void;
	onEmailClick: (id: string) => void;
	isStreaming: boolean;
}) {
	const isUser = message.role === "user";

	return (
		<div
			className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
		>
			<div
				className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl shadow-sm border ${
					isUser
						? "bg-kumo-brand text-kumo-inverse border-kumo-brand"
						: "bg-kumo-base text-kumo-brand border-kumo-line"
				}`}
			>
				{isUser ? (
					<UserIcon size={14} weight="bold" />
				) : (
					<RobotIcon size={16} weight="bold" />
				)}
			</div>
			<div
				className={`flex flex-col gap-2 max-w-[88%] min-w-0 ${
					isUser ? "items-end" : "items-start"
				}`}
			>
				{message.parts.map((part, i) => {
					const key = `${message.id}-part-${i}`;
					if (part.type === "text" && part.text.trim()) {
						return (
							<div
								key={key}
								className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed break-words overflow-wrap-anywhere shadow-sm ${
									isUser
										? "bg-kumo-brand text-kumo-inverse rounded-tr-sm"
										: "bg-kumo-base text-kumo-default border border-kumo-line rounded-tl-sm"
								}`}
							>
								{isUser ? (
									part.text
								) : (
									<Markdown
										remarkPlugins={[remarkGfm]}
										components={{
											// ... (Markdown components kept the same)
											a: ({ href, children }) => (
												<a
													href={href}
													target="_blank"
													rel="noopener noreferrer"
													style={{
														color: "var(--color-link)",
														textDecoration: "underline",
													}}
												>
													{children}
												</a>
											),
											p: ({ children }) => (
												<p className="mb-2 last:mb-0">
													{children}
												</p>
											),
											strong: ({ children }) => (
												<strong className="font-semibold text-kumo-brand">
													{children}
												</strong>
											),
											ul: ({ children }) => (
												<ul className="list-disc pl-4 mb-2 last:mb-0 space-y-1">
													{children}
												</ul>
											),
											ol: ({ children }) => (
												<ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-1">
													{children}
												</ol>
											),
											li: ({ children }) => (
												<li className="pl-1">{children}</li>
											),
											h1: ({ children }) => (
												<h3 className="font-bold text-sm mb-2 mt-1 uppercase tracking-wider text-kumo-subtle">
													{children}
												</h3>
											),
											h2: ({ children }) => (
												<h4 className="font-bold text-[13px] mb-1.5 text-kumo-default">
													{children}
												</h4>
											),
											code: ({ children }) => (
												<code className="bg-kumo-tint px-1.5 py-0.5 rounded text-[12px] font-mono border border-kumo-line/50">
													{children}
												</code>
											),
											table: ({ children }) => (
												<div className="overflow-x-auto my-3 rounded-xl border border-kumo-line">
													<table className="w-full text-xs border-collapse">
														{children}
													</table>
												</div>
											),
											thead: ({ children }) => (
												<thead className="bg-kumo-tint">
													{children}
												</thead>
											),
											th: ({ children }) => (
												<th className="text-left px-3 py-2 font-bold text-kumo-default border-b border-kumo-line">
													{children}
												</th>
											),
											td: ({ children }) => (
												<td className="px-3 py-2 border-b border-kumo-line/50 last:border-b-0">
													{children}
												</td>
											),
										}}
									>
										{part.text}
									</Markdown>
								)}
							</div>
						);
					}
					const toolName = getToolNameFromPart(part);
					if (toolName) {
						return (
							<ToolCallBadge
								key={key}
								toolName={toolName}
								state={(part as any).state ?? "running"}
								result={(part as any).result}
								onEmailClick={onEmailClick}
							/>
						);
					}
					return null;
				})}
				{!isUser && hasDraftReplyTool(message) && onAction && (
					<DraftActions
						onEdit={() => onAction("edit")}
						disabled={isStreaming}
					/>
				)}
			</div>
		</div>
	);
}

function AgentChatConnected({
	mailboxId,
	useAgent,
	useAgentChat,
}: {
	mailboxId: string;
	useAgent: typeof import("agents/react").useAgent;
	useAgentChat: typeof import("@cloudflare/ai-chat/react").useAgentChat;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [inputValue, setInputValue] = useState("");
	const { startCompose, selectEmail } = useUIStore();

	const agent = useAgent({ agent: "EmailAgent", name: mailboxId });
	const { messages, sendMessage, status, setMessages, stop } =
		useAgentChat({ agent });
	const isStreaming = status === "streaming" || status === "submitted";

	const agentCommand = useUIStore((state) => state.agentCommand);
	const setAgentCommand = useUIStore((state) => state.setAgentCommand);

	useEffect(() => {
		if (agentCommand) {
			sendMessage({ text: agentCommand });
			setAgentCommand(null);
		}
	}, [agentCommand, sendMessage, setAgentCommand]);

	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSend = () => {
		const text = inputValue.trim();
		if (!text || isStreaming) return;
		setInputValue("");
		sendMessage({ text });
		if (inputRef.current) inputRef.current.style.height = "auto";
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const suggestedPrompts = [
		"Show me the latest inbox emails",
		"Scan for unanswered emails",
		"Find that receipt from my trip",
	];

	return (
		<div className="flex flex-col h-full bg-kumo-recessed/30">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-kumo-line bg-kumo-base shrink-0">
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-lg bg-kumo-brand/10">
						<RobotIcon size={18} weight="bold" className="text-kumo-brand" />
					</div>
					<div className="flex flex-col">
						<span className="text-xs font-bold text-kumo-default">Agentic Co-pilot</span>
						<div className="flex items-center gap-1.5">
							<div className={`h-1.5 w-1.5 rounded-full ${isStreaming ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
							<span className="text-[10px] text-kumo-subtle uppercase tracking-wider font-medium">
								{isStreaming ? "Thinking..." : "Ready"}
							</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-1">
					{messages.length > 0 && (
						<Tooltip content="Clear history" asChild>
							<Button
								variant="ghost"
								shape="square"
								size="sm"
								icon={<TrashIcon size={16} />}
								onClick={() => {
									if (window.confirm("Clear chat history?")) {
										setMessages([]);
									}
								}}
								className="text-kumo-subtle hover:text-red-500"
							/>
						</Tooltip>
					)}
				</div>
			</div>

			{/* Messages */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
				{messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full gap-6">
						<div className="relative">
							<div className="absolute inset-0 bg-kumo-brand/20 blur-2xl rounded-full" />
							<div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-kumo-base border border-kumo-line shadow-xl">
								<RobotIcon
									size={32}
									weight="duotone"
									className="text-kumo-brand"
								/>
							</div>
						</div>
						<div className="text-center space-y-2 max-w-[200px]">
							<h3 className="text-sm font-bold text-kumo-default">Hello! I'm your AI co-pilot.</h3>
							<p className="text-xs text-kumo-subtle leading-relaxed">
								I can summarize threads, read attachments, and organize your inbox automatically.
							</p>
						</div>
						<div className="flex flex-col gap-2 w-full">
							{suggestedPrompts.map((prompt) => (
								<button
									key={prompt}
									type="button"
									onClick={() =>
										sendMessage({ text: prompt })
									}
									className="text-left px-4 py-3 rounded-2xl border border-kumo-line text-xs font-medium text-kumo-default hover:bg-kumo-brand hover:text-white hover:border-kumo-brand hover:shadow-lg hover:shadow-kumo-brand/20 transition-all cursor-pointer bg-kumo-base"
								>
									{prompt}
								</button>
							))}
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-6">
						{messages.map((msg) => (
							<MessageBubble
								key={msg.id}
								message={msg}
								isStreaming={isStreaming}
								onEmailClick={selectEmail}
								onAction={(action) => {
									if (action === "edit") {
										let draftData: any = null;
										for (const part of msg.parts) {
											const toolName = getToolNameFromPart(part);
											if ((toolName === "draft_reply" || toolName === "draft_email") && (part as any).result) {
												draftData = (part as any).result;
												break;
											}
										}
										if (draftData) {
											const draftEmail = {
												id: draftData.id || draftData.messageId || "",
												subject: draftData.subject || "",
												sender: mailboxId,
												recipient: draftData.to || "",
												date: new Date().toISOString(),
												read: true,
												starred: false,
												body: draftData.body || "",
											};
											startCompose({
												mode: draftData.originalEmailId ? "reply" : "new",
												originalEmail: null,
												draftEmail,
											});
										}
									}
								}}
							/>
						))}
						{isStreaming && (
							<div className="flex gap-3">
								<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-kumo-base border border-kumo-line text-kumo-brand shadow-sm">
									<RobotIcon size={16} weight="bold" />
								</div>
								<div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-kumo-base border border-kumo-line shadow-sm">
									<Loader size="sm" />
									<span className="text-xs font-medium text-kumo-subtle">
										Thinking...
									</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Input */}
			<div className="shrink-0 border-t border-kumo-line bg-kumo-base px-4 py-4">
				{isStreaming ? (
					<div className="flex justify-center">
						<Button
							variant="secondary"
							size="sm"
							icon={<StopIcon size={14} weight="fill" />}
							onClick={() => stop()}
							className="rounded-full px-6"
						>
							Stop Generation
						</Button>
					</div>
				) : (
					<div className="relative group">
						<div className="absolute -inset-0.5 bg-gradient-to-r from-kumo-brand to-kumo-brand-alt rounded-2xl opacity-0 group-focus-within:opacity-20 transition-opacity blur-sm" />
						<div className="relative flex items-end gap-2 bg-kumo-base rounded-2xl border border-kumo-line shadow-sm focus-within:border-kumo-brand transition-all p-1">
							<textarea
								ref={inputRef}
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Ask co-pilot..."
								rows={1}
								className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[13px] text-kumo-default placeholder:text-kumo-subtle focus:outline-none min-h-[44px] max-h-[150px]"
								style={{ height: "auto", overflow: "hidden" }}
								onInput={(e) => {
									const t = e.target as HTMLTextAreaElement;
									t.style.height = "auto";
									t.style.height = `${Math.min(t.scrollHeight, 150)}px`;
									t.style.overflow = t.scrollHeight > 150 ? "auto" : "hidden";
								}}
							/>
							<Button
								variant="primary"
								shape="square"
								disabled={!inputValue.trim()}
								icon={<ArrowUpIcon size={18} weight="bold" />}
								onClick={handleSend}
								className={`h-10 w-10 rounded-xl transition-all ${!inputValue.trim() ? "opacity-50" : "shadow-lg shadow-kumo-brand/30 scale-100 hover:scale-105"}`}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function AgentPanel() {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const [hooks, setHooks] = useState<{
		useAgent: typeof import("agents/react").useAgent;
		useAgentChat: typeof import("@cloudflare/ai-chat/react").useAgentChat;
	} | null>(null);

	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		Promise.all([
			import("agents/react"),
			import("@cloudflare/ai-chat/react"),
		]).then(([a, c]) =>
			setHooks({
				useAgent: a.useAgent,
				useAgentChat: c.useAgentChat,
			}),
		).catch((err) => {
			console.error("Failed to load agent modules:", err);
			setLoadError("Failed to connect to agent. Reload to retry.");
		});
	}, []);

	if (loadError) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
				<span className="text-xs text-kumo-error">{loadError}</span>
			</div>
		);
	}

	if (!hooks) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-2">
				<Loader size="base" />
				<span className="text-xs text-kumo-subtle">
					Connecting...
				</span>
			</div>
		);
	}

	return (
		<AgentChatConnected
			mailboxId={mailboxId ?? "default"}
			useAgent={hooks.useAgent}
			useAgentChat={hooks.useAgentChat}
		/>
	);
}
