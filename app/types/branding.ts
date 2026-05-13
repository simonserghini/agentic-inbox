export interface BrandingConfig {
	appName: string;
	primaryColor: string;
	logoUrl: string;
	faviconUrl: string;
	darkModeEnabled: boolean;
	webhookUrl: string;
	apiKey: string;
	resendApiKey: string;
	resendApiKeyConfigured?: boolean;
}

export const defaultBranding: BrandingConfig = {
	appName: "Agentic Inbox",
	primaryColor: "#f6821f",
	logoUrl: "/favicon.svg",
	faviconUrl: "/favicon.ico",
	darkModeEnabled: false,
	webhookUrl: "",
	apiKey: "",
	resendApiKey: "",
	resendApiKeyConfigured: false,
};
