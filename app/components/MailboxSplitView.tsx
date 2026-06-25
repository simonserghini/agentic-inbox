import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import ComposePanel from "~/components/ComposePanel";
import EmailPanel from "~/components/EmailPanel";

const DEFAULT_HEIGHT = 50; // percentage
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
	const [splitPct, setSplitPct] = useState(DEFAULT_HEIGHT);
	const [isDragging, setIsDragging] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);
		document.body.style.cursor = "row-resize";
		document.body.style.userSelect = "none";
	}, []);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const newPct = ((e.clientY - rect.top) / rect.height) * 100;
			setSplitPct(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newPct)));
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		};
	}, [isDragging]);

	const handleDoubleClick = useCallback(() => {
		setSplitPct(DEFAULT_HEIGHT);
	}, []);

	return (
		<div className="flex flex-col h-full" ref={containerRef}>
			{/* Email list — top portion */}
			<div
				className="flex flex-col min-h-0 overflow-hidden relative"
				style={{ flex: isPanelOpen ? `0 0 ${splitPct}%` : "1 1 auto" }}
			>
				<div className="flex flex-col h-full">
					{children}
				</div>
			</div>

			{/* Divider handle */}
			{isPanelOpen && (
				<div
					onMouseDown={handleMouseDown}
					onDoubleClick={handleDoubleClick}
					className="h-3 cursor-row-resize z-20 group flex items-center justify-center shrink-0 bg-kumo-base border-t border-b border-kumo-line"
				>
					<div className="w-10 h-1 rounded-full bg-kumo-line group-hover:bg-kumo-brand/40 group-active:bg-kumo-brand/60 transition-colors" />
				</div>
			)}

			{/* Detail panel — bottom portion, slides up */}
			{isPanelOpen && (
				<div
					key="detail-panel"
					className="flex flex-col min-h-0 overflow-hidden animate-slide-in-right"
					style={{ flex: "1 1 auto" }}
				>
					{isComposing && !selectedEmailId ? (
						<ComposePanel />
					) : isComposing && selectedEmailId ? (
						<ComposePanel />
					) : selectedEmailId ? (
						<EmailPanel emailId={selectedEmailId} onNavigate={onNavigate} />
					) : null}
				</div>
			)}
		</div>
	);
}
