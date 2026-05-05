import { Button, Input, useKumoToastManager, Switch, Surface } from "@cloudflare/kumo";
import React, { useEffect, useState } from "react";
import { useBranding } from "~/contexts/BrandingContext";
import { Copy, RotateCcw, Palette, Code, Settings } from "lucide-react";

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
	const [activeTab, setActiveTab] = useState<"general" | "branding" | "developer">("general");

	useEffect(() => {
		setAppName(branding.appName);
		setPrimaryColor(branding.primaryColor);
		setDarkModeEnabled(branding.darkModeEnabled);
		setWebhookUrl(branding.webhookUrl);
		setApiKey(branding.apiKey);
	}, [branding]);

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
			const res = await fetch("/api/v1/branding", { method: "POST", body: formData });
			if (!res.ok) throw new Error();
			await refreshBranding();
			toastManager.add({ title: "Settings saved successfully" });
		} catch {
			toastManager.add({ title: "Error saving settings", variant: "error" });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col md:flex-row gap-8 min-h-[500px]">
			<div className="w-full md:w-64 flex flex-col gap-1">
				{[
					{ id: "general", label: "General", icon: <Settings size={18} /> },
					{ id: "branding", label: "Branding", icon: <Palette size={18} /> },
					{ id: "developer", label: "Developer", icon: <Code size={18} /> },
				].map((tab) => (
					<button
						key={tab.id}
						type="button"
						onClick={() => setActiveTab(tab.id as any)}
						className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
							activeTab === tab.id
								? "bg-kumo-brand text-white shadow-lg shadow-kumo-brand/25"
								: "text-kumo-subtle hover:bg-kumo-tint hover:text-kumo-default"
						}`}
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</div>

			<Surface className="flex-1 p-8 rounded-3xl border border-kumo-line bg-kumo-base shadow-sm">
				<form onSubmit={handleSubmit} className="space-y-8 max-w-xl">
					{activeTab === "general" && (
						<div className="space-y-6">
							<div>
								<h3 className="text-xl font-bold text-kumo-default mb-1">General Settings</h3>
								<p className="text-sm text-kumo-subtle">Core application configuration.</p>
							</div>
							<Input
								label="Application Name"
								value={appName}
								onChange={(e) => setAppName(e.target.value)}
								placeholder="Agentic Inbox"
							/>
							<div className="flex items-center justify-between p-5 rounded-2xl border border-kumo-line bg-kumo-recessed/50">
								<div className="space-y-1">
									<div className="font-semibold text-kumo-default">Global Dark Mode</div>
									<div className="text-xs text-kumo-subtle">Force dark mode for all visitors.</div>
								</div>
								<Switch checked={darkModeEnabled} onCheckedChange={setDarkModeEnabled} />
							</div>
						</div>
					)}

					{activeTab === "branding" && (
						<div className="space-y-6">
							<div>
								<h3 className="text-xl font-bold text-kumo-default mb-1">Visual Identity</h3>
								<p className="text-sm text-kumo-subtle">Customize your brand presence.</p>
							</div>
							<div className="space-y-2">
								<label className="text-sm font-semibold text-kumo-default">Primary Brand Color</label>
								<div className="flex gap-4">
									<input
										type="color"
										value={primaryColor}
										onChange={(e) => setPrimaryColor(e.target.value)}
										className="h-12 w-12 rounded-xl border border-kumo-line p-1 bg-white cursor-pointer"
									/>
									<Input
										value={primaryColor}
										onChange={(e) => setPrimaryColor(e.target.value)}
										className="flex-1 font-mono tracking-wider"
									/>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
								<div className="space-y-3">
									<label className="text-sm font-semibold text-kumo-default">Logo Image</label>
									<div className="flex flex-col gap-4">
										{branding.logoUrl && !logo && (
											<div className="h-16 w-32 rounded-lg border border-kumo-line bg-white flex items-center justify-center p-2">
												<img src={branding.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
											</div>
										)}
										<input
											type="file"
											accept="image/*"
											onChange={(e) => setLogo(e.target.files?.[0] || null)}
											className="text-xs text-kumo-subtle file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-kumo-tint file:text-kumo-default"
										/>
									</div>
								</div>
								<div className="space-y-3">
									<label className="text-sm font-semibold text-kumo-default">Favicon</label>
									<div className="flex flex-col gap-4">
										{branding.faviconUrl && !favicon && (
											<div className="h-12 w-12 rounded-lg border border-kumo-line bg-white flex items-center justify-center p-1">
												<img src={branding.faviconUrl} alt="Fav" className="h-full w-full object-contain" />
											</div>
										)}
										<input
											type="file"
											accept="image/x-icon,image/png"
											onChange={(e) => setFavicon(e.target.files?.[0] || null)}
											className="text-xs text-kumo-subtle file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-kumo-tint file:text-kumo-default"
										/>
									</div>
								</div>
							</div>
						</div>
					)}

					{activeTab === "developer" && (
						<div className="space-y-6">
							<div>
								<h3 className="text-xl font-bold text-kumo-default mb-1">Developer API</h3>
								<p className="text-sm text-kumo-subtle">Manage webhooks and API access.</p>
							</div>
							<Input
								label="Inbound Webhook URL"
								value={webhookUrl}
								onChange={(e) => setWebhookUrl(e.target.value)}
								placeholder="https://api.yoursite.com/webhook"
							/>
							<div className="space-y-3">
								<label className="text-sm font-semibold text-kumo-default">Secret API Key</label>
								<div className="flex gap-2">
									<Input value={apiKey} readOnly className="font-mono text-xs bg-kumo-recessed flex-1 h-11" />
									<Button
										variant="secondary"
										shape="square"
										icon={<Copy size={16} />}
										onClick={() => {
											navigator.clipboard.writeText(apiKey);
											toastManager.add({ title: "Copied" });
										}}
										aria-label="Copy Key"
									/>
									<Button
										variant="secondary"
										shape="square"
										icon={<RotateCcw size={16} />}
										onClick={() => setApiKey(crypto.randomUUID())}
										aria-label="Refresh Key"
									/>
								</div>
								<div className="text-[10px] text-kumo-subtle mt-1 px-1 uppercase tracking-tight">
									Bearer token for POST /api/v1/send
								</div>
							</div>
						</div>
					)}

					<div className="pt-10 flex justify-end">
						<Button type="submit" variant="primary" loading={isSaving} className="px-12 h-12 text-base shadow-lg shadow-kumo-brand/20">
							Save All Changes
						</Button>
					</div>
				</form>
			</Surface>
		</div>
	);
}
