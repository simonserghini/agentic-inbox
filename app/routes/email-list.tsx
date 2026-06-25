import { Button, Loader, Pagination, Tooltip } from "@cloudflare/kumo";
import {
	ArchiveIcon,
	ArrowBendUpLeftIcon,
	ArrowsClockwiseIcon,
	ClockIcon,
	EnvelopeOpenIcon,
	EnvelopeSimpleIcon,
	FileIcon,
	PaperPlaneTiltIcon,
	PencilSimpleIcon,
	StarIcon,
	TrashIcon,
	TrayIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router";
import { Folders } from "shared/folders";
import { formatListDate } from "shared/dates";
import MailboxSplitView from "~/components/MailboxSplitView";
import ThreadList from "~/components/ThreadList";
import { getSnippetText, senderDisplayName, parseSender } from "~/lib/utils";
import {
	useDeleteEmail,
	useEmails,
	useInfiniteEmails,
	useMarkThreadRead,
	useMoveEmail,
	useSnoozeEmail,
	useThreads,
	useUnsnoozeEmail,
	useUpdateEmail,
} from "~/queries/emails";
import { useFolders } from "~/queries/folders";
import { queryKeys } from "~/queries/keys";
import { useUIStore } from "~/hooks/useUIStore";
import { useKeyboardNavigation } from "~/hooks/useKeyboardNavigation";
import { useNotifications, useNewEmailNotifications } from "~/hooks/useNotifications";
import { useSwipe } from "~/hooks/useSwipe";
import SnoozePicker from "~/components/SnoozePicker";
import type { Email } from "~/types";

const PAGE_SIZE = 25;

const FOLDER_EMPTY_STATES: Record<
	string,
	{
		icon: React.ReactNode;
		title: string;
		description: string;
		showCompose?: boolean;
	}
> = {
	[Folders.INBOX]: {
		icon: <TrayIcon size={48} weight="thin" className="text-kumo-subtle" />,
		title: "Your inbox is empty",
		description:
			"New emails will appear here when they arrive. Send an email to get the conversation started.",
		showCompose: true,
	},
	[Folders.SENT]: {
		icon: (
			<PaperPlaneTiltIcon size={48} weight="thin" className="text-kumo-subtle" />
		),
		title: "No sent emails",
		description: "Emails you send will show up here.",
		showCompose: true,
	},
	[Folders.DRAFT]: {
		icon: <FileIcon size={48} weight="thin" className="text-kumo-subtle" />,
		title: "No drafts",
		description: "Emails you're still working on will be saved here.",
		showCompose: true,
	},
	[Folders.ARCHIVE]: {
		icon: <ArchiveIcon size={48} weight="thin" className="text-kumo-subtle" />,
		title: "Archive is empty",
		description:
			"Move emails here to keep your inbox clean without deleting them.",
	},
	[Folders.TRASH]: {
		icon: <TrashIcon size={48} weight="thin" className="text-kumo-subtle" />,
		title: "Trash is empty",
		description:
			"Deleted emails will appear here. You can restore them or permanently delete them.",
	},
};

function EmailListSkeleton() {
	return (
		<div className="space-y-1 p-2">
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 px-3 py-3 email-row-enter" style={{ animationDelay: `${i * 0.03}s` }}>
					<div className="w-4 h-4 rounded animate-shimmer" />
					<div className="w-5 h-5 rounded animate-shimmer" />
					<div className="flex-1 space-y-2">
						<div className="flex items-center gap-2">
							<div className="h-3 w-24 rounded animate-shimmer" />
							<div className="h-3 w-4 rounded animate-shimmer" />
							<div className="h-3 flex-1 rounded animate-shimmer" />
							<div className="h-3 w-12 rounded animate-shimmer" />
						</div>
						<div className="h-2.5 w-3/4 rounded animate-shimmer" />
					</div>
				</div>
			))}
		</div>
	);
}

function FolderEmptyState({
	folder,
	onCompose,
}: {
	folder?: string;
	onCompose: () => void;
}) {
	const config = (folder && FOLDER_EMPTY_STATES[folder]) || {
		icon: (
			<EnvelopeSimpleIcon size={48} weight="thin" className="text-kumo-subtle" />
		),
		title: "No emails",
		description: "This folder is empty.",
	};

	return (
		<div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-in">
			<div className="mb-4">{config.icon}</div>
			<h3 className="text-base font-semibold text-kumo-default mb-1.5">
				{config.title}
			</h3>
			<p className="text-sm text-kumo-subtle max-w-xs mb-5">
				{config.description}
			</p>
			{"showCompose" in config && config.showCompose && (
				<Button
					variant="primary"
					size="sm"
					icon={<PencilSimpleIcon size={16} />}
					onClick={onCompose}
				>
					Compose
				</Button>
			)}
		</div>
	);
}

function SparkleParticles() {
	const particles = useMemo(() => {
		return Array.from({ length: 12 }).map((_, i) => ({
			id: i,
			left: `${10 + Math.random() * 80}%`,
			top: `${10 + Math.random() * 80}%`,
			delay: `${Math.random() * 0.5}s`,
			size: 4 + Math.random() * 8,
			rotation: Math.random() * 360,
		}));
	}, []);

	return (
		<div className="absolute inset-0 pointer-events-none overflow-hidden">
			{particles.map((p) => (
				<div
					key={p.id}
					className="absolute animate-sparkle"
					style={{
						left: p.left,
						top: p.top,
						animationDelay: p.delay,
					}}
				>
					<StarIcon
						size={p.size}
						weight="fill"
						className="text-kumo-warning"
						style={{ transform: `rotate(${p.rotation}deg)` }}
					/>
				</div>
			))}
		</div>
	);
}

interface HoverPreviewProps {
	email: Email;
	style: React.CSSProperties;
}

function HoverPreviewCard({ email, style }: HoverPreviewProps) {
	return createPortal(
		<div
			className="fixed z-50 w-80 rounded-xl hover-card p-4 pointer-events-none animate-fade-in"
			style={style}
		>
			<div className="text-sm font-semibold text-kumo-default truncate mb-1">
				{email.subject || "(no subject)"}
			</div>
			<div className="text-xs text-kumo-subtle mb-2">
				{email.sender}
				{email.date && (
					<>
						<span className="mx-1">&middot;</span>
						{formatListDate(email.date)}
					</>
				)}
			</div>
			{email.snippet && (
				<div className="text-xs text-kumo-strong line-clamp-3">
					{getSnippetText(email.snippet, 200)}
				</div>
			)}
			{email.thread_count && email.thread_count > 1 && (
				<div className="mt-2 text-xs text-kumo-subtle">
					{email.thread_count} messages in thread
				</div>
			)}
		</div>,
		document.body,
	);
}

interface ToastState {
	message: string;
	type: "undo" | "info";
	onUndo?: () => void;
	id: string;
}

export default function EmailListRoute() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	const {
		selectedEmailId,
		isComposing,
		selectEmail,
		closePanel,
		startCompose,
	} = useUIStore();
	const [page, setPage] = useState(1);
	const [animateRows, setAnimateRows] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const [isScrolled, setIsScrolled] = useState(false);
	const [toasts, setToasts] = useState<ToastState[]>([]);
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [hoverTarget, setHoverTarget] = useState<{
		email: Email;
		rect: DOMRect;
	} | null>(null);

	const queryClient = useQueryClient();
	const updateEmail = useUpdateEmail();
	const markThreadRead = useMarkThreadRead();
	const deleteEmail = useDeleteEmail();
	const moveEmail = useMoveEmail();
	const snoozeEmail = useSnoozeEmail();
	const unsnoozeEmail = useUnsnoozeEmail();
	const [snoozePickerOpen, setSnoozePickerOpen] = useState<string | null>(null);
	const [undoSendId, setUndoSendId] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [threaded, setThreaded] = useState(() => {
		// Default to threaded view, persist preference in localStorage
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("agentic-inbox-threaded");
			if (saved !== null) return saved === "true";
		}
		return true;
	});

	const toggleThreaded = () => {
		setThreaded((prev) => {
			const next = !prev;
			if (typeof window !== "undefined") {
				localStorage.setItem("agentic-inbox-threaded", String(next));
			}
			return next;
		});
		closePanel();
	};

	const params = useMemo(
		() => ({
			folder: folder || "",
			page: String(page),
			limit: String(PAGE_SIZE),
		}),
		[folder, page],
	);

	const { notify } = useNotifications();

	const [smartMode, setSmartMode] = useState(false);
	const [pullRefreshing, setPullRefreshing] = useState(false);
	const pullStartRef = useRef(0);
	const pullMoveRef = useRef(0);
	const pullElRef = useRef<HTMLDivElement>(null);

	// Pull-to-refresh handler — uses the handleRefresh defined below
	const doPullRefresh = async () => {
		if (pullMoveRef.current > 60) {
			setPullRefreshing(true);
			handleRefresh();
			setTimeout(() => {
				setPullRefreshing(false);
				if (pullElRef.current) pullElRef.current.style.height = "0px";
			}, 800);
		} else {
			if (pullElRef.current) pullElRef.current.style.height = "0px";
		}
		pullStartRef.current = 0;
		pullMoveRef.current = 0;
	};

	useEffect(() => {
		const el = scrollRef.current;
		if (!el) return;
		const onTouchStart = (e: TouchEvent) => {
			if (el.scrollTop <= 0) pullStartRef.current = e.touches[0].clientY;
		};
		const onTouchMove = (e: TouchEvent) => {
			if (pullStartRef.current === 0) return;
			const dy = e.touches[0].clientY - pullStartRef.current;
			if (dy > 0 && el.scrollTop <= 0) {
				pullMoveRef.current = Math.min(dy, 120);
				if (pullElRef.current) pullElRef.current.style.height = `${pullMoveRef.current}px`;
				e.preventDefault();
			}
		};
		el.addEventListener("touchstart", onTouchStart, { passive: true });
		el.addEventListener("touchmove", onTouchMove, { passive: false });
		el.addEventListener("touchend", doPullRefresh);
		return () => {
			el.removeEventListener("touchstart", onTouchStart);
			el.removeEventListener("touchmove", onTouchMove);
			el.removeEventListener("touchend", doPullRefresh);
		};
	}, []);

	const { data: smartData } = useQuery<any>({
		queryKey: ["smart-inbox", mailboxId],
		queryFn: () => fetch(`/api/v1/mailboxes/${mailboxId}/smart-inbox`).then(r => r.json()),
		enabled: !!mailboxId && smartMode,
		refetchInterval: 30_000,
	});

	const smartGroups = smartData?.groups ?? {};
	const smartSections = useMemo(() => {
		const order = ["Important", "Updates", "No Reply", "Promotions", "uncategorized"];
		return order.filter((cat) => smartGroups[cat]?.length > 0);
	}, [smartGroups]);

	const {
		data: threadData,
		isFetching: isThreadRefreshing,
		isError: threadError,
	} = useThreads(mailboxId, params, { enabled: threaded });

	// If threads fail, silently fall back to flat list
	const threadFailed = threadError && threaded;
	const effectiveThreaded = threaded && !threadFailed;

	const {
		data: emailData,
		isFetching: isRefreshing,
	} = useEmails(mailboxId, params, { refetchInterval: 30_000, enabled: (!threaded || threadFailed) && !smartMode });

	// Infinite scroll query — used when NOT in threaded mode and not in pagination mode
	const {
		data: infiniteData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isFetching: isInfiniteFetching,
	} = useInfiniteEmails(mailboxId, { folder: params.folder || "" }, {
		enabled: !threaded,
	});

	// Flatten infinite scroll pages
	const infiniteEmails = useMemo(() => {
		if (!infiniteData) return [];
		return infiniteData.pages.flatMap((page) => page.emails);
	}, [infiniteData]);

	const threads = threadData?.threads ?? [];
	const threadTotalCount = threadData?.totalCount ?? 0;

	const emails = emailData?.emails ?? [];
	const totalCount = emailData?.totalCount ?? 0;
	const displayTotal = effectiveThreaded ? threadTotalCount : totalCount;
	const emailIds = useMemo(() => emails.map((e) => e.id), [emails]);

	// IntersectionObserver sentinel for infinite scroll
	const loadMoreRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = loadMoreRef.current;
		if (!el || threaded) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ rootMargin: "200px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [threaded, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const { data: folders = [] } = useFolders(mailboxId);

	const folderName = useMemo(() => {
		const found = folders.find((f) => f.id === folder);
		if (found) return found.name;
		return folder ? folder.charAt(0).toUpperCase() + folder.slice(1) : "Inbox";
	}, [folders, folder]);

	useNewEmailNotifications(emailIds, folderName, (title, body) => {
		notify(title, body);
	});

	const isPanelOpen = selectedEmailId !== null || isComposing;
	const isInbox = folder === Folders.INBOX;

	const prevFolderRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		const folderChanged = prevFolderRef.current !== `${mailboxId}/${folder}`;
		prevFolderRef.current = `${mailboxId}/${folder}`;

		if (folderChanged) {
			closePanel();
			setPage(1);
			setAnimateRows(true);
			const timer = setTimeout(() => setAnimateRows(false), 500);
			return () => clearTimeout(timer);
		}
	}, [mailboxId, folder, closePanel]);

	useEffect(() => {
		if (emails.length > 0) {
			setAnimateRows(true);
			const timer = setTimeout(() => setAnimateRows(false), 500);
			return () => clearTimeout(timer);
		}
	}, [emailIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

	const sentinelRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				setIsScrolled(!entry.isIntersecting);
			},
			{ threshold: 0 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, []);

	const dismissToast = (id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	const addToast = (message: string, onUndo?: () => void) => {
		const id = `toast-${Date.now()}-${Math.random()}`;
		setToasts((prev) => [
			...prev,
			{ id, message, type: onUndo ? "undo" : "info", onUndo },
		]);
		setTimeout(() => dismissToast(id), 5000);
	};

	const handleDelete = (e: React.MouseEvent | null, emailId: string) => {
		e?.preventDefault();
		e?.stopPropagation();
		if (!mailboxId) return;

		const email = emails.find((e) => e.id === emailId);
		const isInTrash = folder === Folders.TRASH || email?.folder_id === Folders.TRASH;

		if (isInTrash) {
			deleteEmail.mutate({ mailboxId, id: emailId });
			addToast("Permanently deleted");
			if (selectedEmailId === emailId) closePanel();
		} else {
			moveEmail.mutate({ mailboxId, id: emailId, folderId: Folders.TRASH });
			addToast("Moved to trash", () => {
				moveEmail.mutate({
					mailboxId,
					id: emailId,
					folderId: Folders.INBOX,
				});
			});
			if (selectedEmailId === emailId) closePanel();
		}
	};

	const handleUndoSend = () => {
		if (undoSendId && mailboxId) {
			deleteEmail.mutate({ mailboxId, id: undoSendId });
			setUndoSendId(null);
		}
	};

	const handleSnooze = (emailId: string, until: string) => {
		if (mailboxId) snoozeEmail.mutate({ mailboxId, id: emailId, until });
		if (selectedEmailId === emailId) closePanel();
	};

	const handleUnsnooze = (emailId: string) => {
		if (mailboxId) unsnoozeEmail.mutate({ mailboxId, id: emailId });
	};

	const handleSwipeLeft = (emailId: string) => {
		handleDelete(null as any, emailId);
	};

	const handleSwipeRight = (emailId: string) => {
		setSnoozePickerOpen(emailId);
	};

	const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
		onSwipeLeft: handleSwipeLeft,
		onSwipeRight: handleSwipeRight,
	});

	const handleRefresh = () => {
		if (mailboxId) {
			queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] });
			queryClient.invalidateQueries({
				queryKey: queryKeys.folders.list(mailboxId),
			});
		}
	};

	const hasUnread = (email: Email): boolean => {
		if (email.thread_unread_count !== undefined) {
			return email.thread_unread_count > 0;
		}
		return !email.read;
	};

	const handleRowClick = (email: Email) => {
		selectEmail(email.id);
		if (mailboxId && hasUnread(email)) {
			if (email.thread_id && email.thread_count && email.thread_count > 1) {
				markThreadRead.mutate({
					mailboxId,
					threadId: email.thread_id,
				});
			} else {
				updateEmail.mutate({
					mailboxId,
					id: email.id,
					data: { read: true },
				});
			}
		}
	};

	const handleStar = (emailId: string) => {
		const email = emails.find((e) => e.id === emailId);
		if (email && mailboxId) {
			updateEmail.mutate({
				mailboxId,
				id: email.id,
				data: { starred: !email.starred },
			});
		}
	};

	const handleToggleRead = (emailId: string) => {
		const email = emails.find((e) => e.id === emailId);
		if (email && mailboxId) {
			updateEmail.mutate({
				mailboxId,
				id: email.id,
				data: { read: !email.read },
			});
		}
	};

	const handleKeyDelete = (emailId: string) => {
		if (!mailboxId) return;
		const email = emails.find((e) => e.id === emailId);
		const isInTrash = folder === Folders.TRASH || email?.folder_id === Folders.TRASH;

		if (isInTrash) {
			deleteEmail.mutate({ mailboxId, id: emailId });
			addToast("Permanently deleted");
		} else {
			moveEmail.mutate({ mailboxId, id: emailId, folderId: Folders.TRASH });
			addToast("Moved to trash", () => {
				moveEmail.mutate({
					mailboxId,
					id: emailId,
					folderId: Folders.INBOX,
				});
			});
		}
		if (selectedEmailId === emailId) closePanel();
	};

	const handleSearch = () => {
		const searchInput = document.querySelector<HTMLInputElement>('input[aria-label="Search emails"]');
		searchInput?.focus();
	};

		const toggleStar = (e: React.MouseEvent, email: Email) => {
		e.preventDefault();
		e.stopPropagation();
		if (mailboxId)
			updateEmail.mutate({
				mailboxId,
				id: email.id,
				data: { starred: !email.starred },
			});
	};

	const { listRef } = useKeyboardNavigation({
		emailIds,
		selectedId: selectedEmailId,
		onSelect: (id) => selectEmail(id),
		onOpen: (id) => {
			const email = emails.find((e) => e.id === id);
			if (email) handleRowClick(email);
		},
		onStar: handleStar,
		onToggleRead: handleToggleRead,
		onArchive: (id) => {
			if (mailboxId) {
				moveEmail.mutate({ mailboxId, id, folderId: Folders.ARCHIVE });
				addToast("Archived", () => {
					moveEmail.mutate({ mailboxId, id, folderId: Folders.INBOX });
				});
			}
		},
		onDelete: handleKeyDelete,
		onCompose: () => startCompose(),
		onSearch: handleSearch,
	});

	const handleMouseEnter = (e: React.MouseEvent, email: Email) => {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		hoverTimeoutRef.current = setTimeout(() => {
			setHoverTarget({ email, rect });
		}, 400);
	};

	const handleMouseLeave = () => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setHoverTarget(null);
	};

	const isRefreshingAny = effectiveThreaded ? isThreadRefreshing : (isRefreshing || isInfiniteFetching);
	const effectiveEmails = infiniteEmails.length > 0 ? infiniteEmails : emails;
	const isShowingEmptyInbox = !isRefreshingAny && (effectiveThreaded ? threads.length : effectiveEmails.length) === 0 && isInbox;

	// Handle thread click: select the thread and load thread emails
	const handleThreadClick = (threadId: string) => {
		selectEmail(threadId);
	};

	const handleComposeReply = (mode: "reply" | "reply-all", sender: string, subject: string) => {
		// Find the actual email in the thread to pass as originalEmail
		startCompose({ mode, originalEmail: { sender, subject } as any });
	};

	const qc = queryClient;

	// ── Batch selection ────────────────────────────────────────────

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const selectAll = () => {
		const ids = effectiveThreaded ? threads.map((t) => t.thread_id) : emails.map((e) => e.id);
		setSelectedIds(new Set(ids));
	};

	const clearSelection = () => setSelectedIds(new Set());

	const handleBatchMove = (folderId: string) => {
		if (!mailboxId || selectedIds.size === 0) return;
		fetch(`/api/v1/mailboxes/${mailboxId}/batch/move`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selectedIds], folderId }) }).then(() => {
			clearSelection();
			qc.invalidateQueries({ queryKey: queryKeys.emails.list(mailboxId, {}) });
			qc.invalidateQueries({ queryKey: queryKeys.emails.threads(mailboxId, {}) });
		});
	};

	const handleBatchDelete = () => {
		if (!mailboxId || selectedIds.size === 0) return;
		fetch(`/api/v1/mailboxes/${mailboxId}/batch/delete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selectedIds] }) }).then(() => {
			clearSelection();
			qc.invalidateQueries({ queryKey: queryKeys.emails.list(mailboxId, {}) });
			qc.invalidateQueries({ queryKey: queryKeys.emails.threads(mailboxId, {}) });
		});
	};

	const handleBatchRead = (read: boolean) => {
		if (!mailboxId || selectedIds.size === 0) return;
		fetch(`/api/v1/mailboxes/${mailboxId}/batch/read`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selectedIds], read }) }).then(() => {
			clearSelection();
			qc.invalidateQueries({ queryKey: queryKeys.emails.list(mailboxId, {}) });
			qc.invalidateQueries({ queryKey: queryKeys.emails.threads(mailboxId, {}) });
		});
	};

	const selectedCount = selectedIds.size;

	return (
		<MailboxSplitView
			selectedEmailId={selectedEmailId}
			isComposing={isComposing}
			onNavigate={(dir) => {
				const ids = effectiveEmails.map((e) => e.id);
				const idx = ids.indexOf(selectedEmailId || "");
				if (dir === "next" && idx < ids.length - 1) selectEmail(ids[idx + 1]);
				if (dir === "prev" && idx > 0) selectEmail(ids[idx - 1]);
			}}
		>
			<div ref={sentinelRef} className="absolute top-0 left-0 right-0 h-px pointer-events-none" />

			{/* Batch selection toolbar */}
			{selectedCount > 0 && (
				<div className="flex items-center gap-2 px-4 py-2 bg-kumo-brand/10 border-b border-kumo-line shrink-0 animate-fade-in">
					<Button variant="ghost" size="sm" onClick={clearSelection}>
						<XIcon size={14} className="mr-1" />
						{selectedCount} selected
					</Button>
					<div className="flex-1" />
					<Button
						variant="ghost"
						size="sm"
						icon={<ArchiveIcon size={14} />}
						onClick={() => handleBatchMove(Folders.ARCHIVE)}
					>
						Archive
					</Button>
					<Button
						variant="ghost"
						size="sm"
						icon={<EnvelopeOpenIcon size={14} />}
						onClick={() => handleBatchRead(true)}
					>
						Mark Read
					</Button>
					<Button
						variant="ghost"
						size="sm"
						icon={<EnvelopeSimpleIcon size={14} />}
						onClick={() => handleBatchRead(false)}
					>
						Mark Unread
					</Button>
					<Button
						variant="ghost"
						size="sm"
						icon={<TrashIcon size={14} />}
						onClick={handleBatchDelete}
					>
						Delete
					</Button>
					<Button variant="ghost" size="sm" onClick={selectAll}>
						Select All
					</Button>
				</div>
			)}

			<div
				ref={headerRef}
				className={`flex items-center justify-between px-4 py-3.5 border-b border-kumo-line shrink-0 md:px-5 transition-shadow ${
					isScrolled ? "shadow-sm shadow-kumo-line/20" : ""
				}`}
			>
				<div className="flex items-center gap-3">
					<h1 className="text-lg font-semibold text-kumo-default">
						{folderName}
					</h1>
					{folder === Folders.INBOX && (
						<Tooltip content={smartMode ? "Switch to regular inbox" : "Smart — Important first"} side="bottom" asChild>
							<Button
								variant={smartMode ? "secondary" : "ghost"}
								size="sm"
								onClick={() => setSmartMode(!smartMode)}
								aria-label={smartMode ? "Regular inbox" : "Smart Inbox"}
							>
								{smartMode ? "Smart ✓" : "Smart"}
							</Button>
						</Tooltip>
					)}
					{!smartMode && (
						<Tooltip content={threaded ? "Switch to flat list" : "Group by threads"} side="bottom" asChild>
							<Button
								variant={threaded ? "secondary" : "ghost"}
								size="sm"
								onClick={toggleThreaded}
								aria-label={threaded ? "Switch to flat list" : "Group by threads"}
							>
								{threaded ? "Threaded" : "Flat"}
							</Button>
						</Tooltip>
					)}
				</div>
				<div className="flex items-center gap-1">
					{displayTotal > 0 && (
						<span className="text-sm text-kumo-subtle mr-2 hidden sm:inline">
							{displayTotal} conversation{displayTotal !== 1 ? "s" : ""}
						</span>
					)}
					{folder !== Folders.TRASH && (
						<Tooltip content="Mark all as read" side="bottom" asChild>
							<Button
								variant="ghost"
								size="sm"
								icon={<EnvelopeOpenIcon size={16} />}
								onClick={() => {
									if (!mailboxId) return;
									fetch(`/api/v1/mailboxes/${mailboxId}/mark-all-read?folder=${folder || "inbox"}`, { method: "POST" }).then(() => {
										handleRefresh();
									});
								}}
							>
								Mark All Read
							</Button>
						</Tooltip>
					)}
					{folder === Folders.TRASH && displayTotal > 0 && (
						<Tooltip content="Permanently delete all emails in trash" side="bottom" asChild>
							<Button
								variant="ghost"
								size="sm"
								icon={<TrashIcon size={16} />}
								onClick={() => {
									if (!mailboxId) return;
									fetch(`/api/v1/mailboxes/${mailboxId}/empty-trash`, { method: "POST" }).then(() => {
										handleRefresh();
										addToast("Trash emptied");
									});
								}}
							>
								Empty Trash
							</Button>
						</Tooltip>
					)}
					<Tooltip
						content={isRefreshing ? "Refreshing..." : "Refresh"}
						side="bottom"
						asChild
					>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={
								<ArrowsClockwiseIcon
									size={18}
									className={isRefreshing ? "animate-spin" : ""}
								/>
							}
							onClick={handleRefresh}
							disabled={isRefreshing}
							aria-label="Refresh"
						/>
					</Tooltip>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto" ref={scrollRef}>
				{/* Pull-to-refresh indicator */}
				<div
					ref={pullElRef}
					className="h-0 overflow-hidden transition-[height] duration-200 flex items-center justify-center bg-kumo-tint/50"
				>
					{pullRefreshing && (
						<Loader size="base" />
					)}
				</div>
				{smartMode && folder === Folders.INBOX ? (
					smartSections.length > 0 ? (
						<div className="flex flex-col">
							{smartSections.map((category) => {
								const emails = smartGroups[category] || [];
								const labels: Record<string, { icon: React.ReactNode; color: string }> = {
									"Important": { icon: <StarIcon size={14} weight="fill" className="text-kumo-warning" />, color: "border-l-kumo-warning bg-kumo-warning/5" },
									"Updates": { icon: <ClockIcon size={14} className="text-kumo-brand" />, color: "border-l-kumo-brand bg-kumo-brand/5" },
									"Promotions": { icon: <PaperPlaneTiltIcon size={14} className="text-kumo-subtle" />, color: "border-l-kumo-subtle bg-kumo-tint" },
									"No Reply": { icon: <EnvelopeSimpleIcon size={14} className="text-kumo-subtle" />, color: "border-l-kumo-subtle bg-kumo-tint" },
								};
								const label = labels[category] || { icon: null, color: "bg-kumo-tint" };
								return (
									<div key={category} className="border-b border-kumo-line last:border-b-0">
										<div className={`flex items-center gap-2 px-4 py-2 border-l-2 ${label.color}`}>
											{label.icon}
											<span className="text-xs font-semibold uppercase tracking-wider text-kumo-subtle">
												{category}
											</span>
											<span className="text-xs text-kumo-subtle ml-auto">
												{emails.length}
											</span>
										</div>
										{emails.map((email: Email) => {
											const isSelected = selectedEmailId === email.id;
											return (
												<div
													key={email.id}
													role="button"
													tabIndex={0}
													onClick={() => handleRowClick(email)}
													className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-kumo-line/30 last:border-b-0 ${
														isSelected ? "bg-kumo-tint" : "hover:bg-kumo-tint"
													}`}
												>
													{!email.read && <div className="w-2 h-2 rounded-full bg-kumo-brand shrink-0" />}
													<div className="flex-1 min-w-0">
														<span className={`text-sm truncate block font-bold text-kumo-default`}>
															{senderDisplayName(email.sender)} — {email.subject}
														</span>
														<span className="text-[11px] text-kumo-subtle truncate block">
															{parseSender(email.sender).email}
														</span>
													</div>
													<span className="text-xs text-kumo-subtle shrink-0">
														{formatListDate(email.date)}
													</span>
												</div>
											);
										})}
									</div>
								);
							})}
						</div>
					) : (
						<FolderEmptyState folder={folder} onCompose={() => startCompose()} />
					)
				) : isRefreshingAny && (effectiveThreaded ? threads.length : effectiveEmails.length) === 0 ? (
					<EmailListSkeleton />
				) : effectiveThreaded ? (
					threads.length > 0 ? (
						<>
							<ThreadList
								threads={threads}
								selectedThreadId={selectedEmailId}
								onSelectThread={handleThreadClick}
								onComposeReply={handleComposeReply}
								selectedIds={selectedIds}
								toggleSelect={toggleSelect}
							/>
							{threadTotalCount > PAGE_SIZE && (
								<div className="px-4 py-3 border-t border-kumo-line flex justify-center">
									<Pagination
										page={page}
										perPage={PAGE_SIZE}
										totalCount={threadTotalCount}
										setPage={setPage}
									/>
								</div>
							)}
						</>
					) : (
						<FolderEmptyState folder={folder} onCompose={() => startCompose()} />
					)
				) : effectiveEmails.length > 0 ? (
					<div ref={listRef}>
						{effectiveEmails.map((email, index) => {
							const isSelected = selectedEmailId === email.id;
							const snippet = getSnippetText(email.snippet);
							const staggerClass = animateRows && index < 20 ? `stagger-${index + 1}` : "";
							return (
							<div
								key={email.id}
								id={`email-row-${email.id}`}
								role="button"
								tabIndex={0}
								onClick={() => handleRowClick(email)}
								onMouseEnter={(e) => handleMouseEnter(e, email)}
								onMouseLeave={handleMouseLeave}
								onTouchStart={(e) => onTouchStart(e, email.id)}
								onTouchMove={onTouchMove}
								onTouchEnd={onTouchEnd}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleRowClick(email);
									}
								}}
								className={`group flex items-center gap-3 w-full text-left cursor-pointer transition-colors border-b border-kumo-line px-4 py-2.5 md:px-6 md:py-3 email-row-enter ${staggerClass} ${
									isPanelOpen ? "md:px-4 md:py-2.5" : ""
								} ${
									isSelected
										? "bg-kumo-tint border-l-2 border-l-kumo-brand"
										: "hover:bg-kumo-tint border-l-2 border-l-transparent"
								}`}
								style={!animateRows ? { animation: "none" } : undefined}
								>
									{/* Unread dot */}
									<div className="w-2.5 shrink-0 flex justify-center">
										{hasUnread(email) && (
											<div className="h-2 w-2 rounded-full bg-kumo-brand" />
										)}
									</div>

									{/* Star */}
									<button
										type="button"
										className="shrink-0 p-0.5 bg-transparent border-0 cursor-pointer"
										onClick={(e) => {
											e.stopPropagation();
											toggleStar(e, email);
										}}
									>
										<StarIcon
											size={16}
											weight={email.starred ? "fill" : "regular"}
											className={
												email.starred
													? "text-kumo-warning"
													: "text-kumo-subtle hover:text-kumo-warning"
											}
										/>
									</button>

									{/* Content */}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<div className="min-w-0">
												<span className="truncate text-sm block font-bold text-kumo-default">
													{senderDisplayName(email.sender)}
												</span>
												<span className="text-[11px] text-kumo-subtle truncate block">
													{parseSender(email.sender).email}
												</span>
											</div>
											{(email.thread_count ?? 1) > 1 && (
												<span className="shrink-0 text-xs text-kumo-subtle bg-kumo-fill rounded-full px-1.5 py-0.5 font-medium">
													{email.thread_count}
												</span>
											)}
											{email.has_draft && (
												<span className="shrink-0 text-xs text-kumo-destructive font-medium">
													Draft
												</span>
											)}
											{email.needs_reply && !email.has_draft && (
												<Tooltip content="Needs reply" asChild>
													<span className="shrink-0 text-kumo-warning">
														<ArrowBendUpLeftIcon size={14} weight="bold" />
													</span>
												</Tooltip>
											)}
											<span className="text-sm text-kumo-subtle shrink-0 ml-auto">
												{formatListDate(email.date)}
											</span>
										</div>
										<div className="truncate text-sm mt-0.5">
											<span
												className={hasUnread(email) ? "font-medium text-kumo-default" : "text-kumo-subtle"}
											>
												{email.subject}
											</span>
										{snippet && (
											<span className="text-kumo-subtle font-normal">
												{" "}&mdash; {snippet}
											</span>
										)}
									</div>
								</div>

									{/* Hover actions */}
									<div className="hidden group-hover:flex items-center shrink-0">
										{email.folder_id !== Folders.SNOOZED && (
											<Tooltip content="Snooze" asChild>
												<Button
													variant="ghost"
													shape="square"
													size="sm"
													icon={<ClockIcon size={14} />}
													onClick={(e) => { e.stopPropagation(); setSnoozePickerOpen(email.id); }}
													aria-label="Snooze"
												/>
											</Tooltip>
										)}
										{email.folder_id === Folders.SNOOZED && (
											<Tooltip content="Unsnooze" asChild>
												<Button
													variant="ghost"
													shape="square"
													size="sm"
													icon={<ClockIcon size={14} className="text-kumo-brand" />}
													onClick={(e) => { e.stopPropagation(); handleUnsnooze(email.id); }}
													aria-label="Unsnooze"
												/>
											</Tooltip>
										)}
										<Tooltip content={email.read ? "Mark unread" : "Mark read"} asChild>
											<Button
												variant="ghost"
												shape="square"
												size="sm"
												icon={email.read ? <EnvelopeSimpleIcon size={14} /> : <EnvelopeOpenIcon size={14} />}
												onClick={(e) => {
													e.stopPropagation();
													if (mailboxId)
														updateEmail.mutate({
															mailboxId,
															id: email.id,
															data: { read: !email.read },
														});
												}}
												aria-label={email.read ? "Mark unread" : "Mark read"}
											/>
										</Tooltip>
										<Tooltip content="Delete" asChild>
											<Button
												variant="ghost"
												shape="square"
												size="sm"
												icon={<TrashIcon size={14} />}
												onClick={(e) => handleDelete(e, email.id)}
												aria-label="Delete"
											/>
										</Tooltip>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="relative">
						<FolderEmptyState
							folder={folder}
							onCompose={() => startCompose()}
						/>
						{isShowingEmptyInbox && <SparkleParticles />}
					</div>
				)}
			</div>

			{/* Infinite scroll sentinel — loads more when visible */}
			{!threaded && (
				<>
					<div ref={loadMoreRef} className="h-1" />
					{isFetchingNextPage && (
						<div className="flex justify-center py-4">
							<Loader size="base" />
						</div>
					)}
					{!hasNextPage && effectiveEmails.length > 0 && (
						<div className="flex justify-center py-3 border-t border-kumo-line shrink-0">
							<span className="text-xs text-kumo-subtle">
								{effectiveEmails.length} email{effectiveEmails.length !== 1 ? "s" : ""}
							</span>
						</div>
					)}
				</>
			)}

			{/* Pagination (only shown in threaded mode or when infinite scroll is not active) */}
			{threaded && totalCount > PAGE_SIZE && (
				<div className="flex justify-center py-3 border-t border-kumo-line shrink-0">
					<Pagination
						page={page}
						setPage={setPage}
						perPage={PAGE_SIZE}
						totalCount={totalCount}
					/>
				</div>
			)}

			{/* Hover preview */}
			{hoverTarget && (
				<HoverPreviewCard
					email={hoverTarget.email}
					style={{
						top: Math.min(hoverTarget.rect.top, window.innerHeight - 250),
						left: Math.min(hoverTarget.rect.right + 12, window.innerWidth - 340),
					}}
				/>
			)}

			{/* Snooze picker */}
			{snoozePickerOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setSnoozePickerOpen(null)}>
					<div className="relative" onClick={(e) => e.stopPropagation()}>
						<SnoozePicker
							open={true}
							onClose={() => setSnoozePickerOpen(null)}
							onSnooze={(until) => {
								handleSnooze(snoozePickerOpen, until);
								setSnoozePickerOpen(null);
							}}
						/>
					</div>
				</div>
			)}

			{/* Undo send toast */}
			{undoSendId && (
				<div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 glass px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm text-kumo-default min-w-[280px] animate-slide-in-right">
					<span className="flex-1">Email sent</span>
					<button
						type="button"
						onClick={handleUndoSend}
						className="text-kumo-brand font-semibold hover:underline bg-transparent border-0 cursor-pointer text-sm"
					>
						Undo
					</button>
				</div>
			)}

			{/* Toasts */}
			{toasts.length > 0 && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
					{toasts.map((toast) => (
						<div
							key={toast.id}
							className="glass px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm text-kumo-default min-w-[280px] animate-slide-in-right"
						>
							<span className="flex-1">{toast.message}</span>
							{toast.type === "undo" && toast.onUndo && (
								<button
									type="button"
									onClick={() => {
										toast.onUndo?.();
										dismissToast(toast.id);
									}}
									className="text-kumo-brand font-semibold hover:underline bg-transparent border-0 cursor-pointer text-sm"
								>
									Undo
								</button>
							)}
							<button
								type="button"
								onClick={() => dismissToast(toast.id)}
								className="text-kumo-subtle hover:text-kumo-default bg-transparent border-0 cursor-pointer p-0.5"
								aria-label="Dismiss"
							>
								<XIcon size={14} />
							</button>
						</div>
					))}
				</div>
			)}
		</MailboxSplitView>
	);
}


