import { Button, Input, useKumoToastManager } from "@cloudflare/kumo";
import React, { useEffect, useState } from "react";
import { useBranding } from "~/contexts/BrandingContext";

export default function SettingsBranding() {
	const { branding, refreshBranding } = useBranding();
	const toastManager = useKumoToastManager();
	
	const [appName, setAppName] = useState(branding.appName);
	const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
	const [logo, setLogo] = useState<File | null>(null);
	const [favicon, setFavicon] = useState<File | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setAppName(branding.appName);
		setPrimaryColor(branding.primaryColor);
	}, [branding]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		
		try {
			const formData = new FormData();
			formData.append("appName", appName);
			formData.append("primaryColor", primaryColor);
			formData.append("logoUrl", branding.logoUrl);
			formData.append("faviconUrl", branding.faviconUrl);
			
			if (logo) formData.append("logo", logo);
			if (favicon) formData.append("favicon", favicon);

			const res = await fetch("/api/v1/branding", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) throw new Error("Failed to save branding");

			await refreshBranding();
			toastManager.add({ title: "Branding updated successfully!" });
		} catch (error) {
			toastManager.add({ title: "Failed to update branding", variant: "error" });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="rounded-lg border border-kumo-line bg-kumo-base p-5">
				<div className="text-sm font-medium text-kumo-default mb-4">
					Global Branding
				</div>
				<div className="space-y-4">
					<Input
						label="Application Name"
						value={appName}
						onChange={(e) => setAppName(e.target.value)}
						placeholder="Agentic Inbox"
					/>

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
			</div>

			<div className="flex justify-end">
				<Button type="submit" variant="primary" loading={isSaving}>
					Save Branding
				</Button>
			</div>
		</form>
	);
}
