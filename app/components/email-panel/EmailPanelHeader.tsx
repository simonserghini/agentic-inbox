// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button } from "@cloudflare/kumo/components/button";
import { Tooltip } from "@cloudflare/kumo/components/tooltip";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";

interface EmailPanelHeaderProps {
	subject: string;
	messageCount: number;
	showThreadCount: boolean;
	onPrev?: () => void;
	onNext?: () => void;
}

export default function EmailPanelHeader({
	subject,
	messageCount,
	showThreadCount,
	onPrev,
	onNext,
}: EmailPanelHeaderProps) {
	return (
		<div className="px-4 py-3 border-b border-kumo-line shrink-0 md:px-6 flex items-center justify-between">
			<div className="min-w-0">
				<h2 className="text-base font-semibold text-kumo-default truncate">{subject}</h2>
				{showThreadCount && (
					<span className="text-xs text-kumo-subtle mt-0.5 block">
						{messageCount} messages in this thread
					</span>
				)}
			</div>
			{(onPrev || onNext) && (
				<div className="flex items-center gap-0.5 shrink-0 ml-2">
					<Tooltip content="Previous email" side="bottom" asChild>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={<CaretUpIcon size={16} />}
							onClick={onPrev}
							disabled={!onPrev}
							aria-label="Previous email"
						/>
					</Tooltip>
					<Tooltip content="Next email" side="bottom" asChild>
						<Button
							variant="ghost"
							shape="square"
							size="sm"
							icon={<CaretDownIcon size={16} />}
							onClick={onNext}
							disabled={!onNext}
							aria-label="Next email"
						/>
					</Tooltip>
				</div>
			)}
		</div>
	);
}
