import { Button, Input, useKumoToastManager, Switch, Surface, InputArea } from "@cloudflare/kumo";
import React, { useEffect, useState } from "react";
import { useBranding } from "~/contexts/BrandingContext";
import { Copy, RotateCcw, Palette, Code, Settings, Mail, Eye, EyeOff, CheckCircle, XCircle, Zap, Bot, PenTool, Sparkles, Terminal } from "lucide-react";
import { useParams } from "react-router";

export default function SettingsUnified() {
	const { branding, refreshBranding } = useBranding();
	const { mailboxId } = useParams<{ mailboxId: string }>();
	const toastManager = useKumoToastManager();
	
	const [appName, setAppName] = useState(branding.appName);
	const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
	const [darkModeEnabled, setDarkModeEnabled] = useState(branding.darkModeEnabled);
	const [webhookUrl, setWebhookUrl] = useState(branding.webhookUrl);
	const [apiKey, setApiKey] = useState(branding.apiKey);
	const [resendApiKey, setResendApiKey] = useState(branding.resendApiKey);
	const [showResendKey, setShowResendKey] = useState(false);
	const [logo, setLogo] = useState<File | null>(null);
	const [favicon, setFavicon] = useState<File | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [activeTab, setActiveTab] = useState<"general" | "branding" | "developer" | "agent">("general");

	// Mailbox-specific settings
	const [agentTone, setAgentTone] = useState("");
	const [agentSignature, setAgentSignature] = useState("");
	const [promptCategorization, setPromptCategorization] = useState("");
	const [promptVision, setPromptVision] = useState("");
	const [promptAutoDraft, setPromptAutoDraft] = useState("");
	const [autoDraftEnabled, setAutoDraftEnabled] = useState(true);
	const [mailboxSettings, setMailboxSettings] = useState<any>(null);

	// Track whether a Resend key is configured on the backend (from the masked response)
	const resendConfigured = branding.resendApiKeyConfigured ?? false;

	useEffect(() => {
		setAppName(branding.appName);
		setPrimaryColor(branding.primaryColor);
		setDarkModeEnabled(branding.darkModeEnabled);
		setWebhookUrl(branding.webhookUrl);
		setApiKey(branding.apiKey);
		setResendApiKey(branding.resendApiKey);
	}, [branding]);

	useEffect(() => {
		if (mailboxId) {
			fetch(`/api/v1/mailboxes/${mailboxId}`)
				.then(res => res.json())
				.then((data: any) => {
					setMailboxSettings(data.settings);
					setAgentTone(data.settings.agentTone || "");
					setAgentSignature(data.settings.agentSignature || "");
					setPromptCategorization(data.settings.promptCategorization || "");
					setPromptVision(data.settings.promptVision || "");
				setPromptAutoDraft(data.settings.promptAutoDraft || "");
					setAutoDraftEnabled(data.settings.autoDraftEnabled !== false);
					});
		}
	}, [mailboxId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			if (activeTab === "agent" && mailboxId) {
				const updatedSettings = {
					...mailboxSettings,
					agentTone,
					agentSignature,
					promptCategorization,
					promptVision,
					promptAutoDraft,
					autoDraftEnabled,
				};
				const res = await fetch(`/api/v1/mailboxes/${mailboxId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ settings: updatedSettings }),
				});
				if (!res.ok) throw new Error();
				setMailboxSettings(updatedSettings);
				toastManager.add({ title: "Agent settings saved" });
			} else {
				const formData = new FormData();
				formData.append("appName", appName);
				formData.append("primaryColor", primaryColor);
				formData.append("darkModeEnabled", String(darkModeEnabled));
				formData.append("webhookUrl", webhookUrl);
				formData.append("apiKey", apiKey);
				formData.append("resendApiKey", resendApiKey);
				formData.append("logoUrl", branding.logoUrl);
				formData.append("faviconUrl", branding.faviconUrl);
				if (logo) formData.append("logo", logo);
				if (favicon) formData.append("favicon", favicon);
				const res = await fetch("/api/v1/branding", { method: "POST", body: formData });
				if (!res.ok) throw new Error();
				await refreshBranding();
				setShowResendKey(false);
				toastManager.add({ title: "Global settings saved" });
			}
		} catch {
			toastManager.add({ title: "Error saving settings", variant: "error" });
		} finally {
			setIsSaving(false);
		}
	};

	const handleClearResendKey = () => {
		setResendApiKey("__CLEAR__");
		toastManager.add({ title: "Resend key marked for removal — click Save to apply" });
	};

	return (
		<div className="flex flex-col md:flex-row gap-8 min-h-[500px]">
			<div className="w-full md:w-64 flex flex-col gap-1">
				{[
					{ id: "general", label: "General", icon: <Settings size={18} /> },
					{ id: "branding", label: "Branding", icon: <Palette size={18} /> },
					{ id: "developer", label: "Developer & Email", icon: <Code size={18} /> },
					...(mailboxId ? [{ id: "agent", label: "Agent & Prompts", icon: <Bot size={18} /> }] : []),
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
						<div className="space-y-8">
							<div>
								<h3 className="text-xl font-bold text-kumo-default mb-1">Developer & Email Integrations</h3>
								<p className="text-sm text-kumo-subtle">Manage external connections and email delivery.</p>
							</div>

							<div className="space-y-6">
								<div className="text-sm font-bold text-kumo-default uppercase tracking-wider flex items-center gap-2">
									<Mail size={16} className="text-kumo-brand" />
									Email Delivery (Resend)
								</div>
								
								{/* Provider Status Card */}
								<div className="p-5 rounded-2xl border border-kumo-line bg-kumo-recessed/50">
									<div className="flex items-center justify-between mb-4">
										<div className="text-sm font-semibold text-kumo-default">Active Provider</div>
										<div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
											resendConfigured
												? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
												: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
										}`}>
											{resendConfigured ? (
												<>
													<Zap size={13} />
													Resend API
												</>
											) : (
												<>
													<Mail size={13} />
													Cloudflare Email
												</>
											)}
										</div>
									</div>
									<div className="text-xs text-kumo-subtle leading-relaxed">
										{resendConfigured
											? "Outbound emails are routed through the Resend API using your BYOK key. Remove the key below to fall back to Cloudflare Email."
											: "Outbound emails use the built-in Cloudflare Email Service binding. Add a Resend API key below to switch to Resend."}
									</div>
								</div>

								{/* Resend BYOK Section */}
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<Zap size={18} className="text-kumo-subtle" />
										<div>
											<div className="text-sm font-semibold text-kumo-default">Resend API Key (BYOK)</div>
											<div className="text-xs text-kumo-subtle">Bring your own Resend key for enhanced deliverability and analytics.</div>
										</div>
									</div>

									<div className="flex gap-2">
										<div className="relative flex-1">
											<Input
												value={resendApiKey === "__CLEAR__" ? "" : resendApiKey}
												onChange={(e) => setResendApiKey(e.target.value)}
												type={showResendKey ? "text" : "password"}
												placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxx"
												className="font-mono text-xs h-11 pr-10"
											/>
											<button
												type="button"
												onClick={() => setShowResendKey(!showResendKey)}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-kumo-subtle hover:text-kumo-default transition-colors"
											>
												{showResendKey ? <EyeOff size={16} /> : <Eye size={16} />}
											</button>
										</div>
										{resendConfigured && (
											<Button
												type="button"
												variant="secondary"
												onClick={handleClearResendKey}
												className="text-xs h-11 px-4 text-red-500 hover:text-red-600"
											>
												<XCircle size={14} />
												Remove
											</Button>
										)}
									</div>

									{resendConfigured && resendApiKey !== "__CLEAR__" && (
										<div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 px-1">
											<CheckCircle size={14} />
											Key is configured and active.
										</div>
									)}
									{resendApiKey === "__CLEAR__" && (
										<div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 px-1">
											<XCircle size={14} />
											Key will be removed on save — Cloudflare Email will become the active provider.
										</div>
									)}

									<div className="text-[10px] text-kumo-subtle px-1 uppercase tracking-tight">
										Get your API key from{" "}
										<a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-kumo-default transition-colors">
											resend.com/api-keys
										</a>
									</div>
								</div>

								{/* How it works */}
								<div className="p-5 rounded-2xl border border-dashed border-kumo-line bg-kumo-recessed/30">
									<div className="text-xs font-semibold text-kumo-default mb-3">How Hybrid Sending Works</div>
									<div className="space-y-2 text-xs text-kumo-subtle leading-relaxed">
										<div className="flex items-start gap-2">
											<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-kumo-tint text-kumo-default text-[10px] font-bold shrink-0 mt-0.5">1</span>
											<span>When you send an email, the worker checks if a <span className="font-mono text-kumo-default">RESEND_API_KEY</span> is configured.</span>
										</div>
										<div className="flex items-start gap-2">
											<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-kumo-tint text-kumo-default text-[10px] font-bold shrink-0 mt-0.5">2</span>
											<span>If present, the email is sent via <span className="font-mono text-kumo-default">POST https://api.resend.com/emails</span>.</span>
										</div>
										<div className="flex items-start gap-2">
											<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-kumo-tint text-kumo-default text-[10px] font-bold shrink-0 mt-0.5">3</span>
											<span>If not, the built-in <span className="font-mono text-kumo-default">env.EMAIL.send()</span> Cloudflare binding is used as fallback.</span>
										</div>
									</div>
								</div>
							</div>

							<div className="border-t border-kumo-line pt-8 space-y-6">
								<div className="text-sm font-bold text-kumo-default uppercase tracking-wider flex items-center gap-2">
									<Code size={16} className="text-kumo-brand" />
									Developer API
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
										<Input value={apiKey} readOnly className="font-mono text-xs bg-recessed flex-1 h-11" />
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
						</div>
					)}

					{activeTab === "agent" && mailboxId && (
						<div className="space-y-8">
							<div className="space-y-6">
								<div>
									<h3 className="text-xl font-bold text-kumo-default mb-1 flex items-center gap-2">
										<Sparkles size={20} className="text-kumo-brand" />
										Persona & Style
									</h3>
									<p className="text-sm text-kumo-subtle">Define how your AI agent should behave for this mailbox.</p>
								</div>

								<InputArea
									label="Tone of Voice"
									value={agentTone}
									onChange={(e) => setAgentTone(e.target.value)}
									placeholder="e.g. Professional yet friendly, short and direct, or formal and detailed."
									className="min-h-[80px]"
								/>

								<InputArea
									label="Email Signature"
									value={agentSignature}
									onChange={(e) => setAgentSignature(e.target.value)}
									placeholder="The signature the agent should include at the end of every draft."
									className="min-h-[80px]"
								/>
							</div>

							<div className="border-t border-kumo-line pt-8 space-y-6">
								<div>
									<h3 className="text-xl font-bold text-kumo-default mb-1 flex items-center gap-2">
										<Terminal size={20} className="text-kumo-brand" />
										Advanced Prompt Engineering
									</h3>
									<p className="text-sm text-kumo-subtle">Fully customize the core logic guiding the AI.</p>
								</div>

								<InputArea
									label="Auto-Categorization Logic"
									value={promptCategorization}
									onChange={(e) => setPromptCategorization(e.target.value)}
									placeholder="Instructions for how to sort incoming emails into folders."
									className="min-h-[120px] font-mono text-xs"
								/>

								<InputArea
									label="Vision AI (OCR) Instructions"
									value={promptVision}
									onChange={(e) => setPromptVision(e.target.value)}
									placeholder="How the AI should interpret and extract data from attachments."
									className="min-h-[120px] font-mono text-xs"
								/>

								<div className="flex items-center justify-between p-3 rounded-lg bg-kumo-tint">
									<div>
										<span className="text-sm font-medium text-kumo-default">Auto-Draft Replies</span>
										<p className="text-xs text-kumo-subtle mt-0.5">Let the agent generate replies when new emails arrive</p>
									</div>
									<Switch checked={autoDraftEnabled} onChange={(checked: boolean) => setAutoDraftEnabled(checked)} />
								</div>

								{autoDraftEnabled && (
									<InputArea
										label="Auto-Draft Orchestration"
										value={promptAutoDraft}
										onChange={(e) => setPromptAutoDraft(e.target.value)}
										placeholder="The specialized prompt used when a new email arrives."
										className="min-h-[120px] font-mono text-xs"
									/>
								)}
							</div>
							
							<div className="p-4 rounded-2xl border border-kumo-line bg-kumo-recessed/50 flex gap-3">
								<PenTool className="text-kumo-brand shrink-0" size={20} />
								<p className="text-xs text-kumo-subtle leading-relaxed">
									Your agent will use these preferences to craft drafts. Changes here apply immediately to all future AI actions for this mailbox.
								</p>
							</div>
						</div>
					)}

					<div className="pt-10 flex justify-end">
						<Button type="submit" variant="primary" loading={isSaving} className="px-12 h-12 text-base shadow-lg shadow-kumo-brand/20">
							Save Changes
						</Button>
					</div>
				</form>
			</Surface>
		</div>
	);
}
