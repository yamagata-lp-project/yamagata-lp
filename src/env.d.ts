/// <reference types="astro/client" />

interface ImportMetaEnv {
	/** Resend API key used to send the estimate form's notification/auto-reply emails. */
	readonly RESEND_API_KEY: string;
	/** Verified "From" address for outgoing Resend emails (e.g. no-reply@yourdomain.jp). */
	readonly RESEND_FROM_EMAIL: string;
	/** Address(es) that receive the internal notification when a form is submitted. Comma-separated for multiple recipients. */
	readonly RESEND_TO_EMAIL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
