// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Badge } from "@cloudflare/kumo/components/badge";
import { Button } from "@cloudflare/kumo/components/button";
import { Tooltip } from "@cloudflare/kumo/components/tooltip";
import {
	ArchiveIcon,
	ArrowBendUpLeftIcon,
	FileIcon,
	StarIcon,
	TrashIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { formatListDate } from "shared/dates";
import { getSnippetText, senderDisplayName, parseSender } from "~/lib/utils";
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
	onStar: (thread: ThreadSummary) => void;
	onArchive: (thread: ThreadSummary) => void;
	onDelete: (thread: ThreadSummary) => void;
}

const SWIPE_THRESHOLD = 60;

function ThreadRow({ thread, onSelectThread, selected, selectedIds, toggleSelect, onComposeReply, onStar, onArchive, onDelete }: ThreadRowProps) {
	const rowRef = useRef<HTMLDivElement>(null);
	const touchStartX = useRef(0);
	const [swipeOffset, setSwipeOffset] = useState(0);

	const isChecked = selectedIds?.has(thread.thread_id) ?? false;
	const isUnread = thread.unread_count > 0;
	const sender = useMemo(() => parseSender(thread.last_sender), [thread.last_sender]);
	const displayName = useMemo(() => senderDisplayName(thread.last_sender), [thread.last_sender]);
	const hasBatchMode = !!toggleSelect && !!selectedIds;
	const isBatchActive = hasBatchMode && selectedIds.size > 0;

	const handleStar = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		onStar(thread);
	}, [onStar, thread]);

	const handleArchive = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
		if (e && "stopPropagation" in e) e.stopPropagation();
		onArchive(thread);
	}, [onArchive, thread]);

	const handleDelete = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
		if (e && "stopPropagation" in e) e.stopPropagation();
		onDelete(thread);
	}, [onDelete, thread]);

	// Swipe handlers using React state instead of direct DOM mutation
	const onTouchStartSwipe = useCallback((e: React.TouchEvent) => {
		touchStartX.current = e.touches[0].clientX;
	}, []);

	const onTouchMoveSwipe = useCallback((e: React.TouchEvent) => {
		if (!touchStartX.current) return;
		const dx = e.touches[0].clientX - touchStartX.current;
		setSwipeOffset(Math.max(dx, -120));
	}, []);

	const onTouchEndSwipe = useCallback(() => {
		if (swipeOffset < -SWIPE_THRESHOLD) handleArchive();
		else if (swipeOffset > SWIPE_THRESHOLD) handleDelete();
		setSwipeOffset(0);
		touchStartX.current = 0;
	}, [swipeOffset, handleArchive, handleDelete]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelectThread(thread.thread_id);
		}
	}, [onSelectThread, thread.thread_id]);

	const threadLabel = `${displayName} — ${thread.subject || "No Subject"}. ${thread.unread_count > 0 ? "Unread." : ""} ${thread.message_count} message${thread.message_count !== 1 ? "s" : ""}.`;

	return (
		<div
			ref={rowRef}
			className={`group relative flex items-start gap-2.5 sm:gap-3 px-3 py-3.5 sm:py-3 cursor-pointer transition-all border-b border-kumo-line/50 active:bg-kumo-tint ${
				selected
					? "bg-kumo-brand/8 border-l-[3px] border-l-kumo-brand pl-[calc(0.75rem-1px)]"
					: isUnread
						? "thread-row-unread hover:bg-kumo-tint border-l-[3px] border-l-transparent pl-[calc(0.75rem-1px)]"
						: "hover:bg-kumo-tint border-l-[3px] border-l-transparent pl-[calc(0.75rem-1px)] opacity-90"
			}`}
			onClick={() => onSelectThread(thread.thread_id)}
			role="button"
			tabIndex={0}
			aria-label={threadLabel}
			onKeyDown={handleKeyDown}
			onTouchStart={onTouchStartSwipe}
			onTouchMove={onTouchMoveSwipe}
			onTouchEnd={onTouchEndSwipe}
			style={{ transform: swipeOffset ? `translateX(${swipeOffset}px)` : undefined, transition: swipeOffset ? "none" : "transform 0.2s ease" }}
		>
			{/* Batch checkbox */}
			{hasBatchMode && (
				<label className="shrink-0 mt-0.5 flex items-center justify-center w-6 h-6 cursor-pointer">
					<input
						type="checkbox"
						checked={isChecked}
						onChange={(e) => {
							e.stopPropagation();
							toggleSelect!(thread.thread_id);
						}}
						onClick={(e) => e.stopPropagation()}
						className="w-4 h-4 rounded border-kumo-line text-kumo-brand cursor-pointer"
						aria-label={`Select thread: ${displayName} — ${thread.subject}`}
					/>
				</label>
			)}

			{/* Star — hidden during batch mode when batch is active */}
			{(!isBatchActive) && (
				<button
					type="button"
					onClick={handleStar}
					className="shrink-0 mt-0.5 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center text-kumo-subtle hover:text-kumo-warning transition-colors rounded"
					aria-label={thread.starred ? `Unstar thread from ${displayName}` : `Star thread from ${displayName}`}
					aria-pressed={thread.starred}
				>
					<StarIcon
						size={16}
						weight={thread.starred ? "fill" : "regular"}
						className={thread.starred ? "text-kumo-warning" : ""}
					/>
				</button>
			)}

			{/* Sender avatar */}
			<div className="shrink-0 flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-kumo-fill text-xs font-bold text-kumo-subtle ring-1 ring-kumo-line/50" aria-hidden="true">
				{displayName.charAt(0).toUpperCase()}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-0.5">
					<span className="text-sm truncate font-bold text-kumo-default">
						{thread.other_senders.length > 0
							? `${displayName} + ${thread.other_senders.length}`
							: displayName}
					</span>
					<span className="hidden sm:inline text-[11px] text-kumo-subtle truncate">{sender.email}</span>
					{isUnread && (
						<div className="shrink-0 w-2 h-2 rounded-full bg-kumo-brand" aria-hidden="true" />
					)}
					{thread.draft_count > 0 && (
						<Badge variant="warning">Draft</Badge>
					)}
					{thread.has_attachment && (
						<FileIcon size={12} className="text-kumo-subtle shrink-0" weight="fill" aria-label="Has attachment" />
					)}
				</div>
				<div className="text-sm text-kumo-default truncate mb-0.5">
					{thread.subject || "(No Subject)"}
				</div>
				<div className="text-xs text-kumo-subtle truncate">
					{getSnippetText(thread.snippet || "")}
				</div>
			</div>

			{/* Right side: date + count */}
			<div className="shrink-0 flex flex-col items-end gap-1 ml-2">
				<time dateTime={thread.last_date} className="text-xs text-kumo-subtle whitespace-nowrap">
					{formatListDate(thread.last_date)}
				</time>
				{thread.message_count > 1 && (
					<Badge variant="secondary">{thread.message_count}</Badge>
				)}
			</div>

			{/* Hover quick actions — hidden during batch mode */}
			{!isBatchActive && (
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
							aria-label={`Reply to ${displayName}`}
						/>
					</Tooltip>
					<Tooltip content="Archive" side="top" asChild>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={<ArchiveIcon size={14} />}
							onClick={handleArchive}
							aria-label={`Archive thread`}
						/>
					</Tooltip>
					<Tooltip content="Delete" side="top" asChild>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={<TrashIcon size={14} />}
							onClick={handleDelete}
							aria-label={`Delete thread`}
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
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const updateEmail = useUpdateEmail();
	const moveEmail = useMoveEmail();
	const deleteEmail = useDeleteEmail();
	const qc = useQueryClient();

	const invalidate = useCallback(() => {
		if (!mailboxId) return;
		qc.invalidateQueries({ queryKey: queryKeys.emails.threads(mailboxId, {}) });
		qc.invalidateQueries({ queryKey: queryKeys.emails.list(mailboxId, {}) });
	}, [mailboxId, qc]);

	const onStar = useCallback((thread: ThreadSummary) => {
		if (!mailboxId) return;
		updateEmail.mutate(
			{ mailboxId, id: thread.thread_id, data: { starred: !thread.starred } },
			{ onSuccess: () => invalidate() },
		);
	}, [mailboxId, updateEmail, invalidate]);

	const onArchive = useCallback((thread: ThreadSummary) => {
		if (!mailboxId) return;
		moveEmail.mutate(
			{ mailboxId, id: thread.thread_id, folderId: "archive" },
			{ onSuccess: () => invalidate() },
		);
	}, [mailboxId, moveEmail, invalidate]);

	const onDelete = useCallback((thread: ThreadSummary) => {
		if (!mailboxId) return;
		deleteEmail.mutate(
			{ mailboxId, id: thread.thread_id },
			{ onSuccess: () => invalidate() },
		);
	}, [mailboxId, deleteEmail, invalidate]);

	return (
		<div className="flex flex-col relative" role="list" aria-label="Email threads">
			{threads.map((thread) => (
				<div key={thread.thread_id} className="relative" role="listitem">
					<ThreadRow
						thread={thread}
						onSelectThread={onSelectThread}
						selected={selectedThreadId === thread.thread_id}
						selectedIds={selectedIds}
						toggleSelect={toggleSelect}
						onComposeReply={onComposeReply}
						onStar={onStar}
						onArchive={onArchive}
						onDelete={onDelete}
					/>
				</div>
			))}
		</div>
	);
}
