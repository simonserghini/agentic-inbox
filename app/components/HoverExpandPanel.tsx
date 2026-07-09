// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const COLLAPSED_WIDTH = 12;
const LEAVE_DELAY_MS = 150;

type HoverExpandPanelProps = {
	side: "left" | "right";
	expandedWidth: number;
	enabled: boolean;
	breakpoint?: "md" | "lg";
	children: ReactNode;
};

export default function HoverExpandPanel({
	side,
	expandedWidth,
	enabled,
	breakpoint = "md",
	children,
}: HoverExpandPanelProps) {
	const [expanded, setExpanded] = useState(false);
	const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => () => clearTimeout(leaveTimer.current), []);

	if (!enabled) return null;

	const visibility =
		breakpoint === "lg" ? "hidden lg:block" : "hidden md:block";
	const isLeft = side === "left";
	const edge = isLeft ? "left-0" : "right-0";
	const border = isLeft ? "border-r" : "border-l";
	const width = expanded ? expandedWidth : COLLAPSED_WIDTH;
	const HintIcon = isLeft ? CaretRightIcon : CaretLeftIcon;

	const handleEnter = () => {
		clearTimeout(leaveTimer.current);
		setExpanded(true);
	};

	const handleLeave = () => {
		leaveTimer.current = setTimeout(() => setExpanded(false), LEAVE_DELAY_MS);
	};

	return (
		<div
			className={`${visibility} fixed inset-y-0 ${edge} z-40`}
			style={{ width }}
			onMouseEnter={handleEnter}
			onMouseLeave={handleLeave}
		>
			<div
				className={`absolute inset-y-0 ${edge} h-full ${border} border-kumo-line bg-kumo-base overflow-hidden transition-[width,box-shadow] duration-200 ease-out ${
					expanded ? "shadow-2xl z-50" : "z-40"
				}`}
				style={{ width }}
			>
				<div
					className="h-full overflow-y-auto overflow-x-hidden transition-opacity duration-150"
					style={{
						width: expandedWidth,
						opacity: expanded ? 1 : 0,
						pointerEvents: expanded ? "auto" : "none",
					}}
				>
					{children}
				</div>

				{!expanded && (
					<div
						className={`absolute inset-y-0 ${edge} flex items-center justify-center pointer-events-none`}
						style={{ width: COLLAPSED_WIDTH }}
					>
						<HintIcon size={10} weight="bold" className="text-kumo-subtle opacity-60" />
					</div>
				)}
			</div>
		</div>
	);
}