import { useCallback, useRef, useState } from "react";

interface SchedulePickerProps {
	open: boolean;
	onClose: () => void;
	onSchedule: (scheduledFor: string) => void;
}

function getScheduleOptions() {
	const now = new Date();
	const options: { label: string; value: () => string }[] = [];

	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(9, 0, 0, 0);
	options.push({ label: "Tomorrow 9am", value: () => tomorrow.toISOString() });

	const tomorrowAfternoon = new Date(now);
	tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
	tomorrowAfternoon.setHours(14, 0, 0, 0);
	options.push({ label: "Tomorrow afternoon", value: () => tomorrowAfternoon.toISOString() });

	const nextMonday = new Date(now);
	const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
	nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
	nextMonday.setHours(9, 0, 0, 0);
	options.push({ label: "Monday 9am", value: () => nextMonday.toISOString() });

	return options;
}

export default function SchedulePicker({ open, onClose, onSchedule }: SchedulePickerProps) {
	const [customDate, setCustomDate] = useState("");
	const [customTime, setCustomTime] = useState("");
	const ref = useRef<HTMLDivElement>(null);

	const handleCustom = useCallback(() => {
		if (!customDate || !customTime) return;
		const dt = new Date(`${customDate}T${customTime}`);
		if (isNaN(dt.getTime())) return;
		onSchedule(dt.toISOString());
		onClose();
	}, [customDate, customTime, onSchedule, onClose]);

	if (!open) return null;

	return (
		<div
			ref={ref}
			className="absolute top-full right-0 z-50 mt-1 min-w-[200px] rounded-lg border border-kumo-line bg-kumo-elevated shadow-lg py-1 animate-fade-in"
		>
			<div className="px-3 py-1.5 text-xs font-medium text-kumo-subtle">Schedule send</div>
			<div className="h-px bg-kumo-line my-1" />
			{getScheduleOptions().map((opt) => (
				<button
					key={opt.label}
					type="button"
					className="w-full text-left px-3 py-1.5 text-sm text-kumo-default hover:bg-kumo-overlay transition-colors"
					onClick={() => { onSchedule(opt.value()); onClose(); }}
				>
					{opt.label}
				</button>
			))}
			<div className="h-px bg-kumo-line my-1" />
			<div className="px-3 py-2 space-y-1.5">
				<input
					type="date"
					value={customDate}
					onChange={(e) => setCustomDate(e.target.value)}
					className="w-full text-sm px-2 py-1 rounded border border-kumo-line bg-kumo-base text-kumo-default"
				/>
				<input
					type="time"
					value={customTime}
					onChange={(e) => setCustomTime(e.target.value)}
					className="w-full text-sm px-2 py-1 rounded border border-kumo-line bg-kumo-base text-kumo-default"
				/>
				<button
					type="button"
					disabled={!customDate || !customTime}
					className="w-full text-sm px-2 py-1 rounded bg-kumo-brand text-white font-medium disabled:opacity-50"
					onClick={handleCustom}
				>
					Schedule
				</button>
			</div>
		</div>
	);
}
