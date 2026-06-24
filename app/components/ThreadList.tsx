// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge, Button, Tooltip } from "@cloudflare/kumo";
import {
	ArchiveIcon,
	ArrowBendUpLeftIcon,
	FileIcon,
	StarIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { formatListDate } from "shared/dates";
import { getSnippetText } from "~/lib/utils";
import {
	useDeleteEmail,
	useMoveEmail,
	useUpdateEmail,
} from "~/queries/emails";
import type { ThreadSummary } from "~/queries/emails";
import { queryKeys } from "~/queries/keys";

interface ThreadRowProps {
	thread: ThreadSummary;
	onSelectThread: (threadId: string) => void;
	selected: boolean;
	selectedIds?: Set<string>;
	toggleSelect?: (id: string) => void;
	onComposeReply: (mode: "reply" | "reply-all", sender: string, subject: string) => void;
}

function ThreadRow({ thread, onSelectThread, selected, selectedIds, toggleSelect, onComposeReply }: ThreadRowProps) {
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const updateEmail = useUpdateEmail();
	const moveEmail = useMoveEmail();
	const deleteEmail = useDeleteEmail();
	const qc = useQueryClient();

	const invalidate = () => {
		if (!mailboxId) return;
		qc.invalidateQueries({ queryKey: queryKeys.emails.threads(mailboxId, {}) });
		qc.invalidateQueries({ queryKey: queryKeys.emails.list(mailboxId, {}) });
	};

	const handleStar = (e: React.MouseEvent) => {
		e.stopPropagation();
		// Star the latest email in the thread — we track the thread representative
		updateEmail.mutate(
			{ mailboxId: mailboxId!, id: thread.thread_id, data: { starred: !thread.starred } },
			{ onSuccess: () => invalidate() },
		);
	};

	const handleArchive = (e: React.MouseEvent) => {
		e.stopPropagation();
		moveEmail.mutate(
			{ mailboxId: mailboxId!, id: thread.thread_id, folderId: "archive" },
			{ onSuccess: () => invalidate() },
		);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		deleteEmail.mutate(
			{ mailboxId: mailboxId!, id: thread.thread_id },
			{ onSuccess: () => invalidate() },
		);
	};

	const isUnread = thread.unread_count > 0;

	return (
		<div
			className={`group flex items-start gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-kumo-line/50 ${
				selected
					? "bg-kumo-brand/5 border-l-2 border-l-kumo-brand"
					: "hover:bg-kumo-tint border-l-2 border-l-transparent"
			} ${isUnread ? "" : "opacity-85"}`}
			onClick={() => onSelectThread(thread.thread_id)}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => e.key === "Enter" && onSelectThread(thread.thread_id)}
		>
			{/* Checkbox for batch selection */}
			{toggleSelect && selectedIds && (
				<div className="shrink-0 mt-0.5">
					<input
						type="checkbox"
						checked={selectedIds.has(thread.thread_id)}
						onChange={(e) => {
							e.stopPropagation();
							toggleSelect(thread.thread_id);
						}}
						onClick={(e) => e.stopPropagation()}
						className="w-4 h-4 rounded border-kumo-line text-kumo-brand cursor-pointer"
						aria-label={`Select thread ${thread.subject}`}
					/>
				</div>
			)}
			{(!toggleSelect || !selectedIds?.size) ? (
			<>
			{/* Star */}
			<button
				type="button"
				onClick={handleStar}
				className="shrink-0 mt-0.5 text-kumo-subtle hover:text-kumo-warning transition-colors"
				aria-label={thread.starred ? "Unstar" : "Star"}
			>
				<StarIcon
					size={16}
					weight={thread.starred ? "fill" : "regular"}
					className={thread.starred ? "text-kumo-warning" : ""}
				/>
			</button>

			{/* Sender avatar */}
			<div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-kumo-fill text-xs font-bold text-kumo-subtle">
				{(thread.last_sender || "?")[0].toUpperCase()}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-0.5">
					<span
						className={`text-sm truncate ${
							isUnread ? "font-bold text-kumo-default" : "font-medium text-kumo-strong"
						}`}
					>
						{thread.other_senders.length > 0
							? `${thread.last_sender} + ${thread.other_senders.length}`
							: thread.last_sender}
					</span>
					{isUnread && (
						<div className="shrink-0 w-2 h-2 rounded-full bg-kumo-brand" />
					)}
					{thread.draft_count > 0 && (
				<Badge variant="warning">
					Draft
				</Badge>
					)}
					{thread.has_attachment && (
						<FileIcon size={12} className="text-kumo-subtle shrink-0" weight="fill" />
					)}
				</div>
				<div className="text-sm text-kumo-default truncate mb-0.5">
					{thread.subject || "(No Subject)"}
				</div>
				<div className="text-xs text-kumo-subtle truncate">
					{getSnippetText(thread.snippet || "")}
				</div>
			</div>

			{/* Right side: count + date */}
			<div className="shrink-0 flex flex-col items-end gap-1 ml-2">
				<span className="text-xs text-kumo-subtle whitespace-nowrap">
					{formatListDate(thread.last_date)}
				</span>
				{thread.message_count > 1 && (
			<Badge variant="secondary">
				{thread.message_count}
			</Badge>
				)}
			</div>

			</>
			) : null}

			{/* Hover quick actions */}
			{(!toggleSelect || !selectedIds?.size) && (
				<div className="hidden group-hover:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-0.5 bg-kumo-base/95 backdrop-blur-sm rounded-lg px-1 py-0.5 shadow-sm border border-kumo-line/60">
				<Tooltip content="Reply" side="top" asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<ArrowBendUpLeftIcon size={14} />}
						onClick={(e) => {
							e.stopPropagation();
							onComposeReply("reply", thread.last_sender, thread.subject);
						}}
						aria-label="Reply"
					/>
				</Tooltip>
				<Tooltip content="Archive" side="top" asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<ArchiveIcon size={14} />}
						onClick={handleArchive}
						aria-label="Archive"
					/>
				</Tooltip>
				<Tooltip content="Delete" side="top" asChild>
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<TrashIcon size={14} />}
						onClick={handleDelete}
						aria-label="Delete"
					/>
				</Tooltip>
			</div>
			)}
		</div>
	);
}

interface ThreadListProps {
	threads: ThreadSummary[];
	selectedThreadId: string | null;
	selectedIds?: Set<string>;
	toggleSelect?: (id: string) => void;
	onSelectThread: (threadId: string) => void;
	onComposeReply: (mode: "reply" | "reply-all", sender: string, subject: string) => void;
}

export default function ThreadList({
	threads,
	selectedThreadId,
	selectedIds,
	toggleSelect,
	onSelectThread,
	onComposeReply,
}: ThreadListProps) {
	return (
		<div className="flex flex-col relative">
			{threads.map((thread) => (
				<div key={thread.thread_id} className="relative">
					<ThreadRow
						thread={thread}
						onSelectThread={onSelectThread}
						selected={selectedThreadId === thread.thread_id}
						selectedIds={selectedIds}
						toggleSelect={toggleSelect}
						onComposeReply={onComposeReply}
					/>
				</div>
			))}
		</div>
	);
}
