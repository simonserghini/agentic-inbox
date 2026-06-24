// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

import type { Context } from "hono";
import type { Env } from "../types";

/** Maximum allowed upload size for branding assets (5 MB). */
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Allowed MIME types for branding image uploads. */
const ALLOWED_IMAGE_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/svg+xml",
	"image/x-icon",
	"image/vnd.microsoft.icon",
]);

/** Mask an API key for safe display — returns empty string or "re_****XXXX" */
function maskApiKey(key: string | undefined): string {
	if (!key) return "";
	if (key.length <= 8) return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
	return key.substring(0, 3) + "\u2022\u2022\u2022\u2022" + key.substring(key.length - 4);
}

/** Validate a webhook URL: must use HTTPS and not target private IPs. */
function validateWebhookUrl(url: string): string | null {
	if (!url) return null; // empty is ok
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "https:") {
			return "Webhook URL must use HTTPS";
		}
		// Reject localhost and private IP ranges at the hostname level
		const hostname = parsed.hostname.toLowerCase();
		if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
			return "Webhook URL must not target localhost";
		}
		if (
			hostname.startsWith("10.") ||
			hostname.startsWith("172.16.") ||
			hostname.startsWith("172.17.") ||
			hostname.startsWith("172.18.") ||
			hostname.startsWith("172.19.") ||
			hostname.startsWith("172.20.") ||
			hostname.startsWith("172.21.") ||
			hostname.startsWith("172.22.") ||
			hostname.startsWith("172.23.") ||
			hostname.startsWith("172.24.") ||
			hostname.startsWith("172.25.") ||
			hostname.startsWith("172.26.") ||
			hostname.startsWith("172.27.") ||
			hostname.startsWith("172.28.") ||
			hostname.startsWith("172.29.") ||
			hostname.startsWith("172.30.") ||
			hostname.startsWith("172.31.") ||
			hostname.startsWith("192.168.") ||
			hostname === "[fc00::]" ||
			hostname.startsWith("[fd") ||
			hostname === "0.0.0.0"
		) {
			return "Webhook URL must not target private or reserved IP ranges";
		}
		return null;
	} catch {
		return "Invalid webhook URL format";
	}
}

export async function getBranding(c: Context<{ Bindings: Env }>) {
	try {
		const obj = await c.env.BUCKET.get("_branding/config.json");
		if (!obj) {
			return c.json({});
		}
		const config = await obj.json() as any;
		// Never expose the full Resend API key to the frontend
		const maskedConfig = {
			...config,
			resendApiKey: maskApiKey(config.resendApiKey),
			resendApiKeyConfigured: Boolean(config.resendApiKey && config.resendApiKey.length > 0),
		};
		return c.json(maskedConfig);
	} catch (e) {
		return c.json({ error: "Failed to fetch branding" }, 500);
	}
}

export async function updateBranding(c: Context<{ Bindings: Env }>) {
	try {
		let config: any = {};
		const contentType = c.req.header("content-type") || "";
		
		if (contentType.includes("multipart/form-data")) {
			const formData = await c.req.parseBody();
			const obj = await c.env.BUCKET.get("_branding/config.json");
			config = obj ? await obj.json() : {};

			config.appName = (formData.appName as string) || config.appName || "Agentic Inbox";
			config.primaryColor = (formData.primaryColor as string) || config.primaryColor || "#f6821f";
			config.darkModeEnabled = formData.darkModeEnabled === "true";

			// Validate webhook URL before storing
			const submittedWebhookUrl = (formData.webhookUrl as string) || "";
			const webhookError = validateWebhookUrl(submittedWebhookUrl);
			if (webhookError) {
				return c.json({ error: webhookError }, 400);
			}
			config.webhookUrl = submittedWebhookUrl;

			config.apiKey = (formData.apiKey as string) || config.apiKey || "";
			config.logoUrl = (formData.logoUrl as string) || config.logoUrl || "";
			config.faviconUrl = (formData.faviconUrl as string) || config.faviconUrl || "";

			// Handle Resend API key — only update if the value differs from the masked placeholder
			const submittedResendKey = (formData.resendApiKey as string) ?? "";
			if (submittedResendKey === "" || submittedResendKey === "__CLEAR__") {
				// User explicitly cleared the key
				config.resendApiKey = "";
			} else if (!submittedResendKey.includes("\u2022\u2022\u2022\u2022")) {
				// A real, unmasked key was submitted — store it
				config.resendApiKey = submittedResendKey;
			}
			// If the submitted value contains masked chars, it's the masked version echoed back — keep existing key
			
			if (formData.logo instanceof File) {
				const logo = formData.logo;
				// Enforce file size limit
				if (logo.size > MAX_UPLOAD_SIZE) {
					return c.json({ error: "Logo file exceeds 5 MB size limit" }, 413);
				}
				// Validate MIME type
				if (!ALLOWED_IMAGE_TYPES.has(logo.type)) {
					return c.json({ error: `Unsupported logo file type: ${logo.type}. Allowed: PNG, JPEG, WebP, SVG, ICO` }, 415);
				}
				const logoPath = `_branding/logo-${Date.now()}-${logo.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
				await c.env.BUCKET.put(logoPath, await logo.arrayBuffer(), {
					httpMetadata: { contentType: logo.type }
				});
				config.logoUrl = `/api/v1/branding/files/${logoPath.replace("_branding/", "")}`; 
			}
			
			if (formData.favicon instanceof File) {
				const favicon = formData.favicon;
				// Enforce file size limit
				if (favicon.size > MAX_UPLOAD_SIZE) {
					return c.json({ error: "Favicon file exceeds 5 MB size limit" }, 413);
				}
				// Validate MIME type
				if (!ALLOWED_IMAGE_TYPES.has(favicon.type)) {
					return c.json({ error: `Unsupported favicon file type: ${favicon.type}. Allowed: PNG, JPEG, WebP, SVG, ICO` }, 415);
				}
				const favPath = `_branding/favicon-${Date.now()}-${favicon.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
				await c.env.BUCKET.put(favPath, await favicon.arrayBuffer(), {
					httpMetadata: { contentType: favicon.type }
				});
				config.faviconUrl = `/api/v1/branding/files/${favPath.replace("_branding/", "")}`;
			}
		} else {
			const jsonBody = await c.req.json() as any;
			// Validate webhook URL in JSON body too
			if (typeof jsonBody.webhookUrl === "string") {
				const webhookError = validateWebhookUrl(jsonBody.webhookUrl);
				if (webhookError) {
					return c.json({ error: webhookError }, 400);
				}
			}
			config = jsonBody;
		}

		await c.env.BUCKET.put("_branding/config.json", JSON.stringify(config));
		// Return masked version
		return c.json({
			...config,
			resendApiKey: maskApiKey(config.resendApiKey),
			resendApiKeyConfigured: Boolean(config.resendApiKey && config.resendApiKey.length > 0),
		});
	} catch (e) {
		return c.json({ error: "Failed to update branding" }, 500);
	}
}

export async function getBrandingFile(c: Context<{ Bindings: Env }>) {
	const filePath = c.req.param("path");
	if (!filePath) return c.json({ error: "Not found" }, 404);
	
	const obj = await c.env.BUCKET.get(`_branding/${filePath}`);
	if (!obj) return c.json({ error: "Not found" }, 404);
	
	const headers = new Headers();
	if (obj.httpMetadata?.contentType) {
		headers.set("Content-Type", obj.httpMetadata.contentType);
	}
	return new Response(obj.body, { headers });
}
