import React, { createContext, useContext, useEffect, useState } from "react";
import { type BrandingConfig, defaultBranding } from "~/types/branding";

interface BrandingContextType {
	branding: BrandingConfig;
	setBranding: (branding: BrandingConfig) => void;
	refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
	const [branding, setBranding] = useState<BrandingConfig>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("branding_cache");
			if (saved) return { ...defaultBranding, ...JSON.parse(saved) };
		}
		return defaultBranding;
	});

	const applyBranding = (cfg: BrandingConfig) => {
		if (typeof document === "undefined") return;
		document.documentElement.style.setProperty("--color-kumo-brand", cfg.primaryColor);
		document.documentElement.style.setProperty("--text-color-kumo-brand", cfg.primaryColor);
		document.title = cfg.appName;
		const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
		if (link) link.href = cfg.faviconUrl;

		if (cfg.darkModeEnabled) {
			document.documentElement.classList.add("dark");
			document.documentElement.setAttribute("data-mode", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			document.documentElement.setAttribute("data-mode", "light");
		}
	};

	const refreshBranding = async () => {
		try {
			const res = await fetch("/api/v1/branding");
			if (res.ok) {
				const data = (await res.json()) as Partial<BrandingConfig>;
				const newBranding = { ...defaultBranding, ...data };
				setBranding(newBranding);
				localStorage.setItem("branding_cache", JSON.stringify(newBranding));
				applyBranding(newBranding);
			}
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		applyBranding(branding);
		refreshBranding();
	}, []);

	return (
		<BrandingContext.Provider value={{ branding, setBranding, refreshBranding }}>
			{children}
		</BrandingContext.Provider>
	);
}

export function useBranding() {
	const context = useContext(BrandingContext);
	if (!context) throw new Error();
	return context;
}
