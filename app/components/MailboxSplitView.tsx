import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import ComposePanel from "~/components/ComposePanel";
import EmailPanel from "~/components/EmailPanel";

const DEFAULT_WIDTH = 380;
const MIN_WIDTH = 280;
const MAX_WIDTH = 600;

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
	const [leftWidth, setLeftWidth] = useState(DEFAULT_WIDTH);
	const [isDragging, setIsDragging] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsDragging(true);
		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
	}, []);

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			if (!containerRef.current) return;
			const containerRect = containerRef.current.getBoundingClientRect();
			let newWidth = e.clientX - containerRect.left;
			newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
			setLeftWidth(newWidth);
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
		setLeftWidth(DEFAULT_WIDTH);
	}, []);

	return (
		<div className="flex h-full" ref={containerRef}>
			<div
				className="flex flex-col min-w-0 shrink-0 overflow-hidden relative transition-[width] duration-200 ease-out"
				style={{ width: isPanelOpen ? leftWidth : "100%" }}
			>
				<div className="flex flex-col h-full">
					{children}
				</div>

				{isPanelOpen && (
					<div
						onMouseDown={handleMouseDown}
						onDoubleClick={handleDoubleClick}
						className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize z-20 group hidden md:block -mr-2"
					>
						<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 group-hover:bg-kumo-brand/20 group-active:bg-kumo-brand/30 transition-colors rounded-full" />
						<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px group-hover:w-0.5 group-hover:bg-kumo-brand/50 transition-all rounded-full" />
					</div>
				)}
			</div>

			{isPanelOpen && (
				<div
					key="detail-panel"
					className="flex-1 flex flex-col min-w-0 overflow-hidden w-full md:w-auto animate-slide-in-right"
				>
					{isComposing && !selectedEmailId ? (
						<ComposePanel />
					) : isComposing && selectedEmailId ? (
						<div className="flex flex-col h-full overflow-y-auto">
							<ComposePanel />
							<div className="border-t border-kumo-line">
								<EmailPanel emailId={selectedEmailId} onNavigate={onNavigate} />
							</div>
						</div>
					) : selectedEmailId ? (
						<EmailPanel emailId={selectedEmailId} onNavigate={onNavigate} />
					) : null}
				</div>
			)}
		</div>
	);
}
