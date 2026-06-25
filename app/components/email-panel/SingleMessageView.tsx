// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import EmailAttachmentList from "~/components/EmailAttachmentList";
import EmailIframe from "~/components/EmailIframe";
import { formatDetailDate, rewriteInlineImages, senderDisplayName, parseSender } from "~/lib/utils";
import type { Email } from "~/types";

interface SingleMessageViewProps {
	email: Email;
	mailboxId?: string;
	onPreviewImage: (url: string, filename: string) => void;
}

export default function SingleMessageView({
	email,
	mailboxId,
	onPreviewImage,
}: SingleMessageViewProps) {
	const sender = parseSender(email.sender);
	const name = senderDisplayName(email.sender);

	return (
		<div className="flex flex-col h-full">
			<div className="px-4 py-4 border-b border-kumo-line md:px-6 bg-kumo-recessed/30">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-start gap-3 min-w-0">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kumo-brand/10 text-sm font-bold text-kumo-brand">
							{name.charAt(0).toUpperCase()}
						</div>
						<div className="min-w-0">
							<div className="text-base font-bold text-kumo-default truncate">
								{name}
							</div>
							<div className="text-xs text-kumo-subtle mt-0.5">{sender.email}</div>
							<div className="text-xs text-kumo-subtle mt-0.5">To: {email.recipient?.includes("<") ? email.recipient.match(/<([^>]+)>/)?.[1] || email.recipient : email.recipient}</div>
						</div>
					</div>
					<span className="text-xs text-kumo-subtle shrink-0 whitespace-nowrap mt-1">
						{formatDetailDate(email.date)}
					</span>
				</div>
			</div>

			<div className="flex-1 min-h-0">
				<EmailIframe
					body={rewriteInlineImages(
						email.body || "",
						mailboxId || "",
						email.id,
						email.attachments,
					)}
				/>
			</div>

			<EmailAttachmentList
				mailboxId={mailboxId}
				emailId={email.id}
				attachments={email.attachments}
				onPreviewImage={onPreviewImage}
				className="px-4 py-3 border-t border-kumo-line shrink-0 md:px-6"
				showHeading
			/>
		</div>
	);
}
