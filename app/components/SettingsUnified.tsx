import { Button, Input, useKumoToastManager, Tabs, Switch, Text } from "@cloudflare/kumo";
import React, { useEffect, useState } from "react";
import { useBranding } from "~/contexts/BrandingContext";
import { CopyIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";

export default function SettingsUnified() {
	const { branding, refreshBranding } = useBranding();
	const toastManager = useKumoToastManager();
	
	const [appName, setAppName] = useState(branding.appName);
	const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
	const [darkModeEnabled, setDarkModeEnabled] = useState(branding.darkModeEnabled);
	const [webhookUrl, setWebhookUrl] = useState(branding.webhookUrl);
	const [apiKey, setApiKey] = useState(branding.apiKey);
	const [logo, setLogo] = useState<File | null>(null);
	const [favicon, setFavicon] = useState<File | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("general");

	useEffect(() => {
		setAppName(branding.appName);
		setPrimaryColor(branding.primaryColor);
		setDarkModeEnabled(branding.darkModeEnabled);
		setWebhookUrl(branding.webhookUrl);
		setApiKey(branding.apiKey);
	}, [branding]);

	const handleGenerateKey = () => {
		setApiKey(crypto.randomUUID());
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		
		try {
			const formData = new FormData();
			formData.append("appName", appName);
			formData.append("primaryColor", primaryColor);
			formData.append("darkModeEnabled", String(darkModeEnabled));
			formData.append("webhookUrl", webhookUrl);
			formData.append("apiKey", apiKey);
			formData.append("logoUrl", branding.logoUrl);
			formData.append("faviconUrl", branding.faviconUrl);
			
			if (logo) formData.append("logo", logo);
			if (favicon) formData.append("favicon", favicon);

			const res = await fetch("/api/v1/branding", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) throw new Error("Failed to save settings");

			await refreshBranding();
			toastManager.add({ title: "Settings updated successfully!" });
		} catch (error) {
			toastManager.add({ title: "Failed to update settings", variant: "error" });
		} finally {
			setIsSaving(false);
		}
	};

	const tabs = [
		{
			value: "general",
			label: "General",
			render: () => (
				<div className="space-y-6 pt-4">
					<Input
						label="Application Name"
						value={appName}
						onChange={(e) => setAppName(e.target.value)}
						placeholder="Agentic Inbox"
					/>
					<div className="flex items-center justify-between rounded-lg border border-kumo-line bg-kumo-base p-4">
						<div className="space-y-0.5">
							<div className="font-medium text-kumo-default">Global Dark Mode</div>
							<div className="text-sm text-kumo-subtle">Forces the UI into dark mode for all users.</div>
						</div>
						<Switch
							checked={darkModeEnabled}
							onCheckedChange={setDarkModeEnabled}
						/>
					</div>
				</div>
			)
		},
		{
			value: "branding",
			label: "Branding",
			render: () => (
				<div className="space-y-6 pt-4">
					<div>
						<label className="block text-sm font-medium text-kumo-default mb-1">
							Primary Color
						</label>
						<div className="flex items-center gap-3">
							<input
								type="color"
								value={primaryColor}
								onChange={(e) => setPrimaryColor(e.target.value)}
								className="h-10 w-10 cursor-pointer rounded border border-kumo-line bg-kumo-base p-1"
							/>
							<Input
								value={primaryColor}
								onChange={(e) => setPrimaryColor(e.target.value)}
								placeholder="#f6821f"
								className="flex-1"
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-kumo-default mb-1">
							Logo Image
						</label>
						<input
							type="file"
							accept="image/*"
							onChange={(e) => setLogo(e.target.files?.[0] || null)}
							className="block w-full text-sm text-kumo-default file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-kumo-tint file:text-kumo-default hover:file:bg-kumo-line transition-colors"
						/>
						{branding.logoUrl && !logo && (
							<img src={branding.logoUrl} alt="Current Logo" className="mt-2 h-10 object-contain" />
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-kumo-default mb-1">
							Favicon
						</label>
						<input
							type="file"
							accept="image/x-icon,image/png,image/svg+xml"
							onChange={(e) => setFavicon(e.target.files?.[0] || null)}
							className="block w-full text-sm text-kumo-default file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-kumo-tint file:text-kumo-default hover:file:bg-kumo-line transition-colors"
						/>
					</div>
				</div>
			)
		},
		{
			value: "developer",
			label: "Developer",
			render: () => (
				<div className="space-y-6 pt-4">
					<Input
						label="Webhook URL"
						value={webhookUrl}
						onChange={(e) => setWebhookUrl(e.target.value)}
						placeholder="https://your-api.com/webhooks/emails"
						description="Incoming emails will be POSTed to this URL as JSON."
					/>
					<div className="space-y-2">
						<label className="block text-sm font-medium text-kumo-default">
							API Key
						</label>
						<div className="flex gap-2">
							<Input
								value={apiKey}
								readOnly
								placeholder="Generate a key to use the Developer API"
								className="flex-1 font-mono text-xs"
							/>
							<Button
								variant="secondary"
								shape="square"
								icon={<CopyIcon size={16} />}
								onClick={() => {
									if (apiKey) {
										navigator.clipboard.writeText(apiKey);
										toastManager.add({ title: "Copied to clipboard" });
									}
								}}
								disabled={!apiKey}
								aria-label="Copy API Key"
							/>
							<Button
								variant="secondary"
								shape="square"
								icon={<ArrowCounterClockwiseIcon size={16} />}
								onClick={handleGenerateKey}
								aria-label="Generate API Key"
							/>
						</div>
						<div className="text-sm text-kumo-subtle">
							Use this key in the <code>Authorization: Bearer</code> header to send emails via <code>POST /api/v1/send</code>.
						</div>
					</div>
				</div>
			)
		}
	];

	return (
		<form onSubmit={handleSubmit} className="space-y-8">
			<Tabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
			<div className="flex justify-end pt-4 border-t border-kumo-line">
				<Button type="submit" variant="primary" loading={isSaving}>
					Save All Changes
				</Button>
			</div>
		</form>
	);
}
