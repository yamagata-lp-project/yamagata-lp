import type { APIRoute } from "astro";
import { Resend } from "resend";

// This route sends real email via Resend, so it must run on-demand rather
// than be baked into the static build.
export const prerender = false;

const TEL = "0120-442-999";
const SITE_NAME = "山形不用品回収サービス";
const SITE_DOMAIN = "yamagata-huyouhin.com";

// Matches --color-primary in src/styles/global.css (the LP's form CTA button color).
const BRAND_COLOR = "#0381dc";
// Matches --color-accent-red in src/styles/global.css.
const ACCENT_RED = "#ff0211";

// The auto-reply's From address isn't a monitored inbox yet, so customer
// replies are routed here for now. Switch to info@yamagata-huyouhin.com once
// that inbox is set up.
const AUTO_REPLY_REPLY_TO = "8step.yamagata@gmail.com";

interface EstimatePayload {
	name: string;
	contactMethod: string;
	phone: string;
	email: string;
	residence: string;
	residenceCity: string;
	floor: string;
	elevator: string;
	volume: string;
	desiredItems: string[];
	items: string;
	date1: string;
	time1: string;
	date2: string;
	time2: string;
	note: string;
	privacy: boolean;
}

const REQUIRED_STRING_FIELDS: (keyof EstimatePayload)[] = [
	"name",
	"contactMethod",
	"phone",
	"email",
	"residence",
	"floor",
	"elevator",
	"volume",
	"date1",
	"time1",
];

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function parsePayload(body: unknown): EstimatePayload | null {
	if (typeof body !== "object" || body === null) return null;
	const b = body as Record<string, unknown>;

	const asString = (v: unknown) => (typeof v === "string" ? v.trim() : "");
	const asStringArray = (v: unknown) =>
		Array.isArray(v) ? v.filter((item): item is string => typeof item === "string") : [];

	const payload: EstimatePayload = {
		name: asString(b.name),
		contactMethod: asString(b.contactMethod),
		phone: asString(b.phone),
		email: asString(b.email),
		residence: asString(b.residence),
		residenceCity: asString(b.residenceCity),
		floor: asString(b.floor),
		elevator: asString(b.elevator),
		volume: asString(b.volume),
		desiredItems: asStringArray(b.desiredItems),
		items: asString(b.items),
		date1: asString(b.date1),
		time1: asString(b.time1),
		date2: asString(b.date2),
		time2: asString(b.time2),
		note: asString(b.note),
		privacy: b.privacy === true,
	};

	for (const field of REQUIRED_STRING_FIELDS) {
		if (!payload[field]) return null;
	}
	if (payload.residence === "山形市外" && !payload.residenceCity) return null;
	if (!payload.privacy) return null;
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return null;

	return payload;
}

function buildSummaryRows(p: EstimatePayload): [string, string][] {
	const rows: [string, string][] = [
		["お名前", p.name],
		["ご希望の連絡方法", p.contactMethod],
		["電話番号", p.phone],
		["メールアドレス", p.email],
		["お住まい", p.residence === "山形市外" ? `山形市外(${p.residenceCity})` : p.residence],
		["お部屋の階数", p.floor],
		["エレベーター", p.elevator],
		["物量の目安", p.volume],
		["回収希望の荷物", p.desiredItems.length ? p.desiredItems.join("、") : "(選択なし)"],
		["回収希望の荷物(その他)", p.items || "(なし)"],
		["第一希望日時", `${p.date1} ${p.time1}`],
		["第二希望日時", p.date2 ? `${p.date2} ${p.time2 || ""}`.trim() : "(なし)"],
		["備考", p.note || "(なし)"],
	];
	return rows;
}

function buildPhoneNoticeHtml(p: EstimatePayload) {
	if (p.contactMethod !== "電話") return "";
	return `
		<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;">
			<tr>
				<td style="border:2px solid ${ACCENT_RED};background:#fff5f5;color:${ACCENT_RED};font-weight:bold;padding:14px 16px;border-radius:4px;">
					お客様は電話希望です。${escapeHtml(p.phone)}へお電話ください（このメールへの返信は届きません）。
				</td>
			</tr>
		</table>`;
}

function buildSummaryTableHtml(p: EstimatePayload) {
	return `
		<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;">
			${buildSummaryRows(p)
				.map(
					([label, value]) => `
			<tr>
				<th style="text-align:left;background:#eaf4ff;border:1px solid #bac9d9;white-space:nowrap;padding:10px 12px;font-weight:bold;">${escapeHtml(label)}</th>
				<td style="border:1px solid #bac9d9;white-space:pre-wrap;padding:10px 12px;">${escapeHtml(value)}</td>
			</tr>`,
				)
				.join("")}
		</table>`;
}

function wrapEmailHtml(headerTitle: string, bodyHtml: string) {
	return `
		<table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;font-family:'Hiragino Sans','Yu Gothic',sans-serif;color:#222222;">
			<tr>
				<td style="background:${BRAND_COLOR};color:#ffffff;padding:24px 20px;text-align:center;border-radius:4px 4px 0 0;">
					<div style="font-size:13px;letter-spacing:0.05em;opacity:0.9;">${SITE_NAME}</div>
					<div style="font-size:20px;font-weight:bold;margin-top:4px;">${escapeHtml(headerTitle)}</div>
				</td>
			</tr>
			<tr>
				<td style="border:1px solid #eeeeee;border-top:none;padding:24px 20px;">
					${bodyHtml}
				</td>
			</tr>
			<tr>
				<td style="padding:16px 20px;text-align:center;color:#7d7d7d;font-size:12px;">
					このメールは${SITE_DOMAIN}の見積もりフォームから自動送信されています。
				</td>
			</tr>
		</table>
	`;
}

function buildNotificationEmail(p: EstimatePayload) {
	const rows = buildSummaryRows(p);
	const text = rows.map(([label, value]) => `${label}：${value}`).join("\n");

	const html = wrapEmailHtml(
		"お見積りフォームの送信がありました",
		`
		<p style="margin:0 0 20px;">お見積り・ご相談フォームの送信がありました。以下の内容をご確認のうえ、対応をお願いします。</p>
		${buildPhoneNoticeHtml(p)}
		${buildSummaryTableHtml(p)}
		`,
	);

	return {
		subject: `【${SITE_NAME}】お見積りフォーム送信：${p.name}様`,
		text,
		html,
	};
}

function buildAutoReplyEmail(p: EstimatePayload) {
	const text = `${p.name} 様

この度は${SITE_NAME}のお見積り・ご相談フォームにご入力いただき、誠にありがとうございます。
以下の内容で承りました。担当者が内容を確認のうえ、ご希望のご連絡方法にて折り返しご連絡いたします。

――――――――――――――
${buildSummaryRows(p)
	.map(([label, value]) => `${label}：${value}`)
	.join("\n")}
――――――――――――――

${SITE_NAME}
TEL：${TEL}`;

	const html = wrapEmailHtml(
		"お見積り・ご相談を受け付けました",
		`
		<p style="margin:0 0 16px;">${escapeHtml(p.name)} 様</p>
		<p style="margin:0 0 20px;">この度は${SITE_NAME}のお見積り・ご相談フォームにご入力いただき、誠にありがとうございます。<br />
		以下の内容で承りました。担当者が内容を確認のうえ、ご希望のご連絡方法にて折り返しご連絡いたします。</p>
		${buildSummaryTableHtml(p)}
		<p style="margin:0;">${SITE_NAME}<br />
		TEL：${TEL}</p>
		`,
	);

	return {
		subject: `【${SITE_NAME}】お見積り・ご相談を受け付けました`,
		text,
		html,
	};
}

export const POST: APIRoute = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: "invalid_json" }, 400);
	}

	const payload = parsePayload(body);
	if (!payload) {
		return json({ ok: false, error: "invalid_payload" }, 400);
	}

	const apiKey = import.meta.env.RESEND_API_KEY;
	const fromEmail = import.meta.env.RESEND_FROM_EMAIL;
	const toEmail = import.meta.env.RESEND_TO_EMAIL;

	if (!apiKey || !fromEmail || !toEmail) {
		console.error(
			"[api/estimate] Missing Resend configuration. Ensure RESEND_API_KEY, RESEND_FROM_EMAIL, and RESEND_TO_EMAIL are set.",
		);
		return json({ ok: false, error: "server_misconfigured" }, 500);
	}

	const resend = new Resend(apiKey);
	const notification = buildNotificationEmail(payload);
	const autoReply = buildAutoReplyEmail(payload);

	const results = await Promise.allSettled([
		resend.emails.send({
			from: fromEmail,
			to: toEmail.split(",").map((addr) => addr.trim()).filter(Boolean),
			replyTo: payload.email,
			subject: notification.subject,
			text: notification.text,
			html: notification.html,
		}),
		resend.emails.send({
			from: fromEmail,
			to: payload.email,
			replyTo: AUTO_REPLY_REPLY_TO,
			subject: autoReply.subject,
			text: autoReply.text,
			html: autoReply.html,
		}),
	]);

	const [notificationResult, autoReplyResult] = results;

	if (notificationResult.status === "rejected") {
		console.error("[api/estimate] Failed to send notification email:", notificationResult.reason);
	} else if (notificationResult.value.error) {
		console.error("[api/estimate] Resend error (notification):", notificationResult.value.error);
	}
	if (autoReplyResult.status === "rejected") {
		console.error("[api/estimate] Failed to send auto-reply email:", autoReplyResult.reason);
	} else if (autoReplyResult.value.error) {
		console.error("[api/estimate] Resend error (auto-reply):", autoReplyResult.value.error);
	}

	// The notification to staff is the important half of this submission;
	// fail the request only if that one couldn't be sent. A failed auto-reply
	// alone shouldn't block the customer from seeing the thanks page.
	const notificationFailed =
		notificationResult.status === "rejected" || Boolean(notificationResult.value.error);

	if (notificationFailed) {
		return json({ ok: false, error: "send_failed" }, 502);
	}

	return json({ ok: true });
};
