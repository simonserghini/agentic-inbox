import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import ComposePanel from "~/components/ComposePanel";
import EmailPanel from "~/components/EmailPanel";
import { useIsMobile } from "~/hooks/useIsMobile";

const DEFAULT_HEIGHT = 50;
const MIN_HEIGHT = 30;
const MAX_HEIGHT = 70;

interface MailboxSplitViewProps {
	selectedEmailId: string | null;
	isComposing: boolean;
	children: ReactNode;
	onNavigate?: (direction: "next" | "prev") => void;
}

export default function MailboxSplitView({
	selectedEmailId,
	isComposing,
	children,
	onNavigate,
}: MailboxSplitViewProps) {
	const isPanelOpen = selectedEmailId !== null || isComposing;
	const isMobile = useIsMobile();
	const [splitPct, setSplitPct] = useState(DEFAULT_HEIGHT);
	const [isDragging, setIsDragging] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleDragStart = useCallback(() => {
		setIsDragging(true);
		document.body.style.cursor = "row-resize";
		document.body.style.userSelect = "none";
	}, []);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		handleDragStart();
	}, [handleDragStart]);

	const handleTouchStart = useCallback(() => {
		handleDragStart();
	}, [handleDragStart]);

	useEffect(() => {
		if (!isDragging || isMobile) return;

		const update = (clientY: number) => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const pct = ((clientY - rect.top) / rect.height) * 100;
			setSplitPct(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, pct)));
		};

		const handleMouseMove = (e: MouseEvent) => update(e.clientY);
		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length > 0) update(e.touches[0].clientY);
		};

		const finish = () => {
			setIsDragging(false);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", finish);
		document.addEventListener("touchmove", handleTouchMove, { passive: true });
		document.addEventListener("touchend", finish);

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", finish);
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", finish);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};
	}, [isDragging, isMobile]);

	const handleDoubleClick = useCallback(() => {
		setSplitPct(DEFAULT_HEIGHT);
	}, []);

	const detailPanel = isComposing && !selectedEmailId ? (
		<ComposePanel />
	) : isComposing && selectedEmailId ? (
		<ComposePanel />
	) : selectedEmailId ? (
		<EmailPanel emailId={selectedEmailId} onNavigate={onNavigate} />
	) : null;

	return (
		<div className="flex flex-col h-full" ref={containerRef}>
			{/* List — full screen on mobile when no selection */}
			<div
				className={`flex flex-col min-h-0 overflow-hidden relative ${
					isPanelOpen ? "hidden md:flex" : "flex flex-1"
				}`}
				style={isPanelOpen && !isMobile ? { flex: `0 0 ${splitPct}%` } : undefined}
			>
				<div className="flex flex-col h-full">{children}</div>
			</div>

			{isPanelOpen && (
				<>
					{/* Resize handle — desktop only */}
					<div
						onMouseDown={handleMouseDown}
						onTouchStart={handleTouchStart}
						onDoubleClick={handleDoubleClick}
						className="hidden md:flex h-4 cursor-row-resize z-20 group items-center justify-center shrink-0 bg-kumo-base border-t border-b border-kumo-line touch-none select-none"
						role="separator"
						aria-label="Resize panels"
						aria-valuenow={Math.round(splitPct)}
						aria-valuemin={MIN_HEIGHT}
						aria-valuemax={MAX_HEIGHT}
						tabIndex={0}
					>
						<div className="w-10 h-1 rounded-full bg-kumo-line group-hover:bg-kumo-brand/40 group-active:bg-kumo-brand/60 transition-colors" />
					</div>

					{/* Detail — full screen on mobile */}
					<div
						key="detail-panel"
						className="flex flex-col flex-1 min-h-0 overflow-hidden animate-slide-up md:animate-slide-in-right bg-kumo-base"
					>
						{detailPanel}
					</div>
				</>
			)}
		</div>
	);
}