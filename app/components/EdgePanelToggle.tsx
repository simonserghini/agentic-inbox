// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Tooltip } from "@cloudflare/kumo/components/tooltip";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

type EdgePanelToggleProps = {
	side: "left" | "right";
	isOpen: boolean;
	onToggle: () => void;
	openLabel: string;
	closeLabel: string;
	className?: string;
};

export default function EdgePanelToggle({
	side,
	isOpen,
	onToggle,
	openLabel,
	closeLabel,
	className = "",
}: EdgePanelToggleProps) {
	const label = isOpen ? closeLabel : openLabel;
	const Icon =
		side === "left"
			? isOpen
				? CaretLeftIcon
				: CaretRightIcon
			: isOpen
				? CaretRightIcon
				: CaretLeftIcon;

	const position = side === "left" ? "left-0" : "right-0";
	const rounded = side === "left" ? "rounded-r-lg" : "rounded-l-lg";

	return (
		<div
			className={`absolute ${position} top-0 bottom-0 w-4 z-30 group ${className}`}
			aria-hidden={false}
		>
			<Tooltip content={label} side={side === "left" ? "right" : "left"} asChild>
				<button
					type="button"
					onClick={onToggle}
					aria-label={label}
					className={`absolute top-1/2 -translate-y-1/2 ${position} flex items-center justify-center w-7 h-14 glass border border-kumo-line shadow-md transition-all duration-200 ${rounded} ${
						isOpen
							? "opacity-0 group-hover:opacity-100"
							: "opacity-40 group-hover:opacity-100"
					} hover:bg-kumo-elevated text-kumo-subtle`}
				>
					<Icon size={14} weight="bold" />
				</button>
			</Tooltip>
		</div>
	);
}