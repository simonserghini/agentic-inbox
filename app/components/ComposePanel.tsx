// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Banner } from "@cloudflare/kumo/components/banner";
import { Button } from "@cloudflare/kumo/components/button";
import { Input } from "@cloudflare/kumo/components/input";
import { Tooltip } from "@cloudflare/kumo/components/tooltip";
import { CalendarBlankIcon, ClockIcon, FloppyDiskIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { useParams } from "react-router";
import { useComposeForm } from "~/hooks/useComposeForm";
import RichTextEditor from "./RichTextEditor";
import SchedulePicker from "./SchedulePicker";
import { useState } from "react";

export default function ComposePanel() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	const [showSchedulePicker, setShowSchedulePicker] = useState(false);

	const {
		to,
		setTo,
		cc,
		setCc,
		bcc,
		setBcc,
		showCcBcc,
		setShowCcBcc,
		subject,
		setSubject,
		body,
		setBody,
		error,
		isSavingDraft,
		isSending,
		scheduledFor,
		lastSentId,
		formTitle,
		handleSaveDraft,
		handleScheduleSend,
		handleSend,
		undoLastSend,
		closeCompose,
		closePanel,
	} = useComposeForm(mailboxId, folder);

	return (
		<div className="flex flex-col h-full bg-kumo-base">
			<div className="flex items-center justify-between px-4 py-3 border-b border-kumo-line shrink-0 md:px-6">
				<h2 className="text-base font-semibold text-kumo-default">
					{formTitle}
				</h2>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						shape="square"
						size="sm"
						icon={<XIcon size={18} />}
						onClick={closeCompose}
						disabled={isSending}
						aria-label="Close compose"
					/>
				</div>
			</div>

			<form
				onSubmit={(e) => handleSend(e, closePanel)}
				className="flex flex-col flex-1 min-h-0 overflow-y-auto"
			>
				<div className="p-4 md:p-6 space-y-4">
					{error && <Banner variant="error" text={error} />}

					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-kumo-subtle w-14 shrink-0">
								To
							</label>
							<div className="flex-1 flex items-center gap-2 min-w-0">
								<Input
									type="text"
									placeholder="recipient@example.com"
									size="sm"
									value={to}
									onChange={(e) => setTo(e.target.value)}
									required
								/>
								{!showCcBcc && (
									<button
										type="button"
										onClick={() => setShowCcBcc(true)}
										className="shrink-0 text-xs text-kumo-link hover:text-kumo-link-hover font-medium"
									>
										CC / BCC
									</button>
								)}
							</div>
						</div>

						{showCcBcc && (
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-kumo-subtle w-14 shrink-0">
									CC
								</label>
								<div className="flex-1">
									<Input
										type="text"
										size="sm"
										value={cc}
										onChange={(e) => setCc(e.target.value)}
										placeholder="Separate multiple addresses with commas"
									/>
								</div>
							</div>
						)}

						{showCcBcc && (
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium text-kumo-subtle w-14 shrink-0">
									BCC
								</label>
								<div className="flex-1">
									<Input
										type="text"
										size="sm"
										value={bcc}
										onChange={(e) => setBcc(e.target.value)}
										placeholder="Separate multiple addresses with commas"
									/>
								</div>
							</div>
						)}

						<div className="flex items-center gap-2">
							<label className="text-sm font-medium text-kumo-subtle w-14 shrink-0">
								Subject
							</label>
							<div className="flex-1">
								<Input
									type="text"
									placeholder="Email subject"
									size="sm"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									required
								/>
							</div>
						</div>
					</div>

					<div className="border border-kumo-line rounded-md overflow-hidden bg-kumo-base">
						<RichTextEditor
							value={body}
							onChange={setBody}
						/>
					</div>
				</div>

				{/* Footer actions */}
				<div className="mt-auto px-4 py-3 border-t border-kumo-line bg-kumo-fill/30 shrink-0 md:px-6">
					<div className="flex items-center justify-between">
						<Button type="button" variant="ghost" size="sm" onClick={closeCompose} disabled={isSending}>
							Discard
						</Button>
						<div className="flex items-center gap-2">
							{scheduledFor && (
								<div className="flex items-center gap-1.5 text-xs text-kumo-brand bg-kumo-brand/10 px-2 py-1 rounded-md">
									<ClockIcon size={14} />
									<span>Scheduled</span>
								</div>
							)}
							<Button
								type="button"
								variant="secondary"
								size="sm"
								loading={isSavingDraft}
								disabled={isSending}
								icon={<FloppyDiskIcon size={14} />}
								onClick={() => handleSaveDraft()}
							>
								{isSavingDraft ? "Saving..." : "Draft"}
							</Button>
							<div className="relative">
								<Tooltip content={scheduledFor ? "Scheduled send" : "Schedule send"} side="top" asChild>
									<Button
										type="button"
										variant={scheduledFor ? "secondary" : "ghost"}
										shape="square"
										size="sm"
										icon={<CalendarBlankIcon size={16} />}
										onClick={() => setShowSchedulePicker((o) => !o)}
										aria-label="Schedule send"
									/>
								</Tooltip>
								<SchedulePicker
									open={showSchedulePicker}
									onClose={() => setShowSchedulePicker(false)}
									onSchedule={(scheduledFor) => {
										handleScheduleSend(scheduledFor);
										setShowSchedulePicker(false);
									}}
								/>
							</div>
							<Button
								type="submit"
								variant="primary"
								size="sm"
								loading={isSending}
								disabled={isSavingDraft || isSending}
								icon={<PaperPlaneTiltIcon size={14} />}
							>
								{isSending ? "Sending..." : scheduledFor ? "Send Now" : "Send"}
							</Button>
						</div>
					</div>
				</div>
			</form>
		{lastSentId && (
				<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 glass px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm text-kumo-default min-w-[280px] animate-slide-in-right">
					<span className="flex-1">Email sent</span>
					<button
						type="button"
						onClick={undoLastSend}
						className="text-kumo-brand font-semibold hover:underline bg-transparent border-0 cursor-pointer text-sm"
					>
						Undo
					</button>
				</div>
			)}
		</div>
	);
}
