// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import { Button } from "@cloudflare/kumo/components/button";
import { DownloadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		const handler = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		};
		window.addEventListener("beforeinstallprompt", handler);
		return () => window.removeEventListener("beforeinstallprompt", handler);
	}, []);

	const handleInstall = async () => {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const result = await deferredPrompt.userChoice;
		if (result.outcome === "accepted") {
			setDeferredPrompt(null);
		}
	};

	if (!deferredPrompt || dismissed) return null;

	return (
		<div className="fixed bottom-4 left-4 right-4 z-50 md:hidden animate-slide-in-right">
			<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-kumo-base border border-kumo-line shadow-lg">
				<DownloadSimpleIcon size={20} className="text-kumo-brand shrink-0" />
				<div className="flex-1 min-w-0">
					<div className="text-sm font-semibold text-kumo-default">
						Install App
					</div>
					<div className="text-xs text-kumo-subtle">
						Add to home screen for quick access
					</div>
				</div>
				<Button variant="primary" size="sm" onClick={handleInstall}>
					Install
				</Button>
				<button
					type="button"
					onClick={() => setDismissed(true)}
					className="p-1 text-kumo-subtle hover:text-kumo-default"
					aria-label="Dismiss"
				>
					<XIcon size={14} />
				</button>
			</div>
		</div>
	);
}
