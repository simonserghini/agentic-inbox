// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Banner } from "@cloudflare/kumo/components/banner";
import { Button } from "@cloudflare/kumo/components/button";
import { Dialog } from "@cloudflare/kumo/components/dialog";
import { Input } from "@cloudflare/kumo/components/input";
import { Text } from "@cloudflare/kumo/components/text";
import { Tooltip } from "@cloudflare/kumo/components/tooltip";
import { ArchiveIcon, CalendarBlankIcon, ClockIcon, FloppyDiskIcon, PaperPlaneTiltIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useParams } from "react-router";
import { useComposeForm } from "~/hooks/useComposeForm";
import RichTextEditor from "./RichTextEditor";
import SchedulePicker from "./SchedulePicker";
import { useUIStore } from "~/hooks/useUIStore";

export default function ComposeEmail() {
	const { mailboxId, folder } = useParams<{
		mailboxId: string;
		folder: string;
	}>();
	const [showSchedulePicker, setShowSchedulePicker] = useState(false);
	
	const { isComposeModalOpen, closeComposeModal } = useUIStore();

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
		composeOptions,
		handleSaveDraft,
		handleScheduleSend,
		handleSend,
			handleSendAndArchive,
				undoLastSend,
				attachments,
				removeAttachment,
			} = useComposeForm(mailboxId, folder);

	return (
		<Dialog.Root
			open={isComposeModalOpen}
			onOpenChange={(open) => !open && !isSending && closeComposeModal()}
		>
			<Dialog size="lg" className="p-6 max-h-[85vh] overflow-y-auto">
				<Dialog.Title className="text-lg font-semibold mb-5">
					{formTitle}
				</Dialog.Title>
				<form onSubmit={(e) => handleSend(e, closeComposeModal)} className="space-y-4">
					{error && <Banner variant="error" text={error} />}
					<div className="flex items-center gap-2">
						<div className="flex-1">
							<Input
								label="To"
								type="text"
								placeholder="recipient@example.com, another@example.com"
								size="sm"
								value={to}
								onChange={(e) => setTo(e.target.value)}
								required
							/>
						</div>
						{!showCcBcc && (
							<button
								type="button"
								onClick={() => setShowCcBcc(true)}
								className="shrink-0 text-xs text-kumo-link hover:text-kumo-link-hover font-medium mt-5"
							>
								CC / BCC
							</button>
						)}
					</div>
					{showCcBcc && (
						<Input
							label="CC"
							type="text"
							size="sm"
							value={cc}
							onChange={(e) => setCc(e.target.value)}
							placeholder="Separate multiple addresses with commas"
						/>
					)}
					{showCcBcc && (
						<Input
							label="BCC"
							type="text"
							size="sm"
							value={bcc}
							onChange={(e) => setBcc(e.target.value)}
							placeholder="Separate multiple addresses with commas"
						/>
					)}
					<Input
						label="Subject"
						type="text"
						placeholder="Email subject"
						size="sm"
						value={subject}
						onChange={(e) => setSubject(e.target.value)}
						required
					/>
					<div>
						<Text size="sm" DANGEROUS_className="font-medium mb-1.5 block">
							Message
						</Text>
						<RichTextEditor value={body} onChange={setBody} />
						{attachments.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-2">
								{attachments.map((att, i) => (
									<div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-kumo-tint border border-kumo-line text-xs">
										<span className="max-w-[160px] truncate font-medium">{att.name}</span>
										<span className="text-kumo-subtle">{(att.size / 1024).toFixed(0)} KB</span>
										<button
											type="button"
											onClick={() => removeAttachment(i)}
											className="p-0.5 rounded hover:bg-kumo-fill text-kumo-subtle hover:text-kumo-default"
											aria-label={`Remove ${att.name}`}
										>
											<XIcon size={12} />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
					<div className="flex justify-between items-center pt-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={closeComposeModal}
							disabled={isSending}
						>
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
							{composeOptions.mode === "reply" && (
								<Tooltip content="Send and archive this thread" side="top" asChild>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										disabled={isSavingDraft || isSending}
										icon={<ArchiveIcon size={14} />}
										onClick={(e) => handleSendAndArchive(e, closeComposeModal)}
									>
										Send & Archive
									</Button>
								</Tooltip>
							)}
						</div>
					</div>
				</form>
			</Dialog>
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
		</Dialog.Root>
	);
}
