import React, { createContext, useContext, useEffect, useState } from "react";
import { type BrandingConfig, defaultBranding } from "~/types/branding";

interface BrandingContextType {
	branding: BrandingConfig;
	setBranding: (branding: BrandingConfig) => void;
	refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
	const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);

	const refreshBranding = async () => {
		try {
			const res = await fetch("/api/v1/branding");
			if (res.ok) {
				const data = (await res.json()) as Partial<BrandingConfig>;
				const newBranding = { ...defaultBranding, ...data };
				setBranding(newBranding);
				
				if (typeof document !== "undefined") {
					document.documentElement.style.setProperty("--color-kumo-brand", newBranding.primaryColor);
					document.documentElement.style.setProperty("--text-color-kumo-brand", newBranding.primaryColor);
					document.title = newBranding.appName;
					
					const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
					if (link) link.href = newBranding.faviconUrl;
				}
			}
		} catch (error) {
			console.error("Failed to load branding", error);
		}
	};

	useEffect(() => {
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
	if (!context) {
		throw new Error("useBranding must be used within a BrandingProvider");
	}
	return context;
}
