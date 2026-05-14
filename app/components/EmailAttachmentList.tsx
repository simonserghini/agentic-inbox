// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { PaperclipIcon, FileIcon, ImageIcon, RobotIcon } from "@phosphor-icons/react";
import { formatBytes, getAttachmentUrl, getNonInlineAttachments } from "~/lib/utils";
import type { Attachment } from "~/types";
import { useUIStore } from "~/hooks/useUIStore";

interface EmailAttachmentListProps {
	mailboxId?: string;
	emailId: string;
	attachments?: Attachment[];
	onPreviewImage?: (url: string, filename: string) => void;
	className?: string;
	showHeading?: boolean;
}

export default function EmailAttachmentList({
	mailboxId,
	emailId,
	attachments,
	onPreviewImage,
	className,
	showHeading = false,
}: EmailAttachmentListProps) {
	const { setAgentCommand } = useUIStore();
	if (!mailboxId) return null;

	const files = getNonInlineAttachments(attachments);
	if (files.length === 0) return null;

	return (
		<div className={className}>
			{showHeading && (
				<div className="flex items-center gap-2 mb-2">
					<PaperclipIcon size={14} className="text-kumo-subtle" />
					<span className="text-sm font-medium text-kumo-default">
						{files.length} attachment{files.length !== 1 ? "s" : ""}
					</span>
				</div>
			)}
			<div className="flex flex-wrap gap-2">
				{files.map((attachment) => {
					const url = getAttachmentUrl(mailboxId, emailId, attachment.id);
					const isImage = attachment.mimetype?.startsWith("image/");

					if (isImage && onPreviewImage) {
						return (
							<div key={attachment.id} className="flex flex-col gap-1">
								<button
									key={attachment.id}
									type="button"
									onClick={() => onPreviewImage(url, attachment.filename)}
									className="flex items-center gap-2 rounded-md border border-kumo-line px-3 py-2 transition-colors hover:bg-kumo-tint text-sm text-left"
								>
									<ImageIcon size={16} className="text-kumo-subtle shrink-0" />
									<span className="text-kumo-strong font-medium truncate max-w-[140px]">
										{attachment.filename}
									</span>
									<span className="text-kumo-subtle">{formatBytes(attachment.size)}</span>
								</button>
								<button
									type="button"
									onClick={() => setAgentCommand(`Please read and analyze this attachment: ${attachment.filename} (ID: ${attachment.id}) in email ${emailId}`)}
									className="flex items-center justify-center gap-1.5 py-1 px-2 rounded bg-kumo-brand/10 text-[11px] font-bold text-kumo-brand hover:bg-kumo-brand/20 transition-all border border-kumo-brand/20"
								>
									<RobotIcon size={12} weight="bold" />
									Read with AI
								</button>
							</div>
						);
					}

					return (
						<a
							key={attachment.id}
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 rounded-md border border-kumo-line px-3 py-2 no-underline transition-colors hover:bg-kumo-tint text-sm"
						>
							<FileIcon size={16} className="text-kumo-subtle shrink-0" />
							<span className="text-kumo-default font-medium truncate max-w-[140px]">
								{attachment.filename}
							</span>
							<span className="text-kumo-subtle">{formatBytes(attachment.size)}</span>
						</a>
					);
				})}
			</div>
		</div>
	);
}
