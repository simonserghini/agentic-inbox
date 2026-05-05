import type { Context } from "hono";
import type { Env } from "../types";

export async function getBranding(c: Context<{ Bindings: Env }>) {
	try {
		const obj = await c.env.BUCKET.get("_branding/config.json");
		if (!obj) {
			return c.json({});
		}
		return c.json(await obj.json());
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
			config.webhookUrl = (formData.webhookUrl as string) || config.webhookUrl || "";
			config.apiKey = (formData.apiKey as string) || config.apiKey || "";
			config.logoUrl = (formData.logoUrl as string) || config.logoUrl || "";
			config.faviconUrl = (formData.faviconUrl as string) || config.faviconUrl || "";
			
			if (formData.logo instanceof File) {
				const logo = formData.logo;
				const logoPath = `_branding/logo-${Date.now()}-${logo.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
				await c.env.BUCKET.put(logoPath, await logo.arrayBuffer(), {
					httpMetadata: { contentType: logo.type }
				});
				config.logoUrl = `/api/v1/branding/files/${logoPath.replace("_branding/", "")}`; 
			}
			
			if (formData.favicon instanceof File) {
				const favicon = formData.favicon;
				const favPath = `_branding/favicon-${Date.now()}-${favicon.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
				await c.env.BUCKET.put(favPath, await favicon.arrayBuffer(), {
					httpMetadata: { contentType: favicon.type }
				});
				config.faviconUrl = `/api/v1/branding/files/${favPath.replace("_branding/", "")}`;
			}
		} else {
			config = await c.req.json();
		}

		await c.env.BUCKET.put("_branding/config.json", JSON.stringify(config));
		return c.json(config);
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
