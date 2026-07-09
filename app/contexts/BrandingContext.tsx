import React, { createContext, useContext, useEffect, useState } from "react";
import { applyDarkMode, resolveIsDark } from "~/lib/theme";
import { type BrandingConfig, defaultBranding } from "~/types/branding";

interface BrandingContextType {
	branding: BrandingConfig;
	setBranding: (branding: BrandingConfig) => void;
	refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

function loadCachedBranding(): BrandingConfig {
	if (typeof window === "undefined") return defaultBranding;
	const saved = localStorage.getItem("branding_cache");
	if (!saved) return defaultBranding;
	try {
		return { ...defaultBranding, ...JSON.parse(saved) };
	} catch {
		localStorage.removeItem("branding_cache");
		localStorage.removeItem("branding_cached_at");
		return defaultBranding;
	}
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
	const [branding, setBranding] = useState<BrandingConfig>(loadCachedBranding);

	const applyBranding = (cfg: BrandingConfig) => {
		if (typeof document === "undefined") return;
		document.documentElement.style.setProperty("--color-kumo-brand", cfg.primaryColor);
		document.documentElement.style.setProperty("--text-color-kumo-brand", cfg.primaryColor);
		document.title = cfg.appName;
		const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
		if (link) link.href = cfg.faviconUrl;
		applyDarkMode(resolveIsDark(cfg.darkModeEnabled));
	};

	const refreshBranding = async () => {
		try {
			const res = await fetch("/api/v1/branding");
			if (res.ok) {
				const data = (await res.json()) as Partial<BrandingConfig>;
				const newBranding = { ...defaultBranding, ...data };
				setBranding(newBranding);
				localStorage.setItem("branding_cache", JSON.stringify(newBranding));
				localStorage.setItem("branding_cached_at", String(Date.now()));
				applyBranding(newBranding);
			}
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		applyBranding(branding);
		const cachedAt = localStorage.getItem("branding_cached_at");
		const shouldFetch = !cachedAt || Date.now() - Number(cachedAt) > 3_600_000;
		if (shouldFetch) refreshBranding();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<BrandingContext.Provider value={{ branding, setBranding, refreshBranding }}>
			{children}
		</BrandingContext.Provider>
	);
}

export function useBranding() {
	const context = useContext(BrandingContext);
	if (!context) throw new Error("useBranding must be used within BrandingProvider");
	return context;
}