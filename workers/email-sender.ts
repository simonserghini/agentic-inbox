// Copyright (c) 2026 Cloudflare, Inc.
// Licensed under the Apache 2.0 license found in the LICENSE file or at:
//     https://opensource.org/licenses/Apache-2.0

/**
 * Hybrid Email Dispatch — Cloudflare Email Service + Resend BYOK
 *
 * Priority order:
 *   1. If a Resend API key is configured → Resend HTTP API
 *   2. Fallback → Cloudflare `env.EMAIL.send()` binding
 */

export interface SendEmailParams {
	to: string | string[];
	from: string | { email: string; name: string };
	subject: string;
	html?: string;
	text?: string;
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string | { email: string; name: string };
	attachments?: {
		content: string; // base64 encoded
		filename: string;
		type: string;
		disposition: "attachment" | "inline";
		contentId?: string;
	}[];
	headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Cloudflare Email Service binding
// ---------------------------------------------------------------------------

/**
 * Send an email using the Cloudflare Email Service binding.
 *
 * @param binding  - The `EMAIL` SendEmail binding from env
 * @param params   - Email parameters (to, from, subject, body, etc.)
 * @returns The send result with messageId
 * @throws On validation or delivery errors (error has `.code` property)
 */
export async function sendEmail(
	binding: SendEmail,
	params: SendEmailParams,
): Promise<{ messageId: string }> {
	const message: Record<string, unknown> = {
		to: params.to,
		from: params.from,
		subject: params.subject,
	};

	if (params.html) message.html = params.html;
	if (params.text) message.text = params.text;
	// Sanitize subject to prevent header injection
	message.subject = sanitizeHeaderValue(params.subject);
	if (params.cc) message.cc = params.cc;
	if (params.bcc) message.bcc = params.bcc;
	if (params.replyTo) message.replyTo = params.replyTo;

	if (params.headers && Object.keys(params.headers).length > 0) {
		message.headers = params.headers;
	}

	if (params.attachments && params.attachments.length > 0) {
		message.attachments = params.attachments.map((att) => ({
			content: att.content,
			filename: att.filename,
			type: att.type,
			disposition: att.disposition,
			...(att.contentId ? { contentId: att.contentId } : {}),
		}));
	}

	const result = await binding.send(message as any);
	return { messageId: result.messageId };
}

// ---------------------------------------------------------------------------
// Resend HTTP API
// ---------------------------------------------------------------------------

const RESEND_API_URL = "https://api.resend.com/emails";

/** Strip CRLF characters to prevent email header injection. */
function sanitizeHeaderValue(value: string): string {
	return value.replace(/[\r\n]/g, "");
}

function normalizeAddress(addr: string | { email: string; name: string }): string {
	if (typeof addr === "string") return sanitizeHeaderValue(addr);
	const safeName = addr.name ? sanitizeHeaderValue(addr.name) : "";
	return safeName ? `${safeName} <${addr.email}>` : addr.email;
}

function normalizeAddressList(val: string | string[]): string[] {
	return Array.isArray(val) ? val : [val];
}

/**
 * Send an email via the Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 */
export async function sendEmailViaResend(
	apiKey: string,
	params: SendEmailParams,
): Promise<{ messageId: string }> {
	const body: Record<string, unknown> = {
		from: normalizeAddress(params.from),
		to: normalizeAddressList(typeof params.to === "string" ? params.to : params.to),
		subject: params.subject,
	};

	if (params.html) body.html = params.html;
	if (params.text) body.text = params.text;
	// Sanitize subject to prevent header injection
	body.subject = sanitizeHeaderValue(params.subject);
	if (params.cc) body.cc = normalizeAddressList(params.cc);
	if (params.bcc) body.bcc = normalizeAddressList(params.bcc);
	if (params.replyTo) body.reply_to = normalizeAddress(params.replyTo);

	if (params.headers && Object.keys(params.headers).length > 0) {
		body.headers = params.headers;
	}

	if (params.attachments && params.attachments.length > 0) {
		body.attachments = params.attachments.map((att) => ({
			content: att.content,
			filename: att.filename,
			content_type: att.type,
		}));
	}

	const res = await fetch(RESEND_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const errorBody = await res.text();
		throw new Error(`Resend API error (${res.status}): ${errorBody}`);
	}

	const data = (await res.json()) as { id: string };
	return { messageId: data.id };
}

// ---------------------------------------------------------------------------
// Unified dispatcher — checks config and routes to the right provider
// ---------------------------------------------------------------------------

export interface DispatchContext {
	/** Cloudflare Email binding (always available) */
	emailBinding: SendEmail;
	/** R2 bucket to read _branding/config.json from */
	bucket: R2Bucket;
}

/**
 * Dispatch an email through the configured provider.
 *
 * Reads `_branding/config.json` from R2 to check for `resendApiKey`.
 * If present and non-empty → uses Resend API.
 * Otherwise → falls back to the Cloudflare Email Service binding.
 */
export async function dispatchEmail(
	ctx: DispatchContext,
	params: SendEmailParams,
): Promise<{ messageId: string; provider: "resend" | "cloudflare" }> {
	// Read config to check for Resend BYOK key
	let resendApiKey: string | undefined;
	try {
		const cfgObj = await ctx.bucket.get("_branding/config.json");
		if (cfgObj) {
			const cfg = (await cfgObj.json()) as Record<string, unknown>;
			if (typeof cfg.resendApiKey === "string" && cfg.resendApiKey.length > 0) {
				resendApiKey = cfg.resendApiKey;
			}
		}
	} catch (e) {
		console.error("Failed to read dispatch config, falling back to Cloudflare:", e);
	}

	if (resendApiKey) {
		const result = await sendEmailViaResend(resendApiKey, params);
		return { ...result, provider: "resend" };
	}

	const result = await sendEmail(ctx.emailBinding, params);
	return { ...result, provider: "cloudflare" };
}
