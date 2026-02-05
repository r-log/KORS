type Env = {
	TURNSTILE_SECRET_KEY?: string;
	RESEND_API_KEY?: string;
	CONTACT_EMAIL?: string;
	CONTACT_FROM?: string;
};

type TurnstileResponse = {
	success: boolean;
	"error-codes"?: string[];
};

type ContactPayload = {
	name: string;
	email: string;
	company: string;
	message: string;
	ip: string | null;
};

export async function onRequestPost({
	request,
	env,
}: {
	request: Request;
	env: Env;
}): Promise<Response> {
	const form = await request.formData();
	const payload: ContactPayload = {
		name: toText(form.get("name")),
		email: toText(form.get("email")),
		company: toText(form.get("company")),
		message: toText(form.get("message")),
		ip: request.headers.get("CF-Connecting-IP"),
	};
	const token = toText(form.get("cf-turnstile-response"));

	if (!payload.name || !payload.email || !payload.message) {
		return json({ error: "Please complete all required fields." }, 400);
	}

	if (!token) {
		return json({ error: "Turnstile verification failed. Please try again." }, 400);
	}

	if (!env.TURNSTILE_SECRET_KEY) {
		return json({ error: "Turnstile secret key is not configured." }, 500);
	}

	const verification = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, token, payload.ip);
	if (!verification.success) {
		return json(
			{
				error: "Turnstile verification failed.",
				details: verification["error-codes"] ?? [],
			},
			403
		);
	}

	const delivery = await sendEmailIfConfigured(env, payload);
	return json({ ok: true, delivery });
}

function toText(value: FormDataEntryValue | null): string {
	if (!value) return "";
	return typeof value === "string" ? value.trim() : "";
}

async function verifyTurnstile(secret: string, token: string, ip: string | null) {
	const body = new URLSearchParams({
		secret,
		response: token,
	});

	if (ip) {
		body.set("remoteip", ip);
	}

	const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
		method: "POST",
		body,
	});

	return (await response.json()) as TurnstileResponse;
}

async function sendEmailIfConfigured(env: Env, payload: ContactPayload) {
	if (!env.RESEND_API_KEY || !env.CONTACT_EMAIL) {
		return { status: "skipped", reason: "Email provider not configured." };
	}

	const from = env.CONTACT_FROM ?? "Kors Digital <onboarding@resend.dev>";
	const subject = `New project inquiry from ${payload.name}`;
	const text = [
		`Name: ${payload.name}`,
		`Email: ${payload.email}`,
		`Company: ${payload.company || "N/A"}`,
		`IP: ${payload.ip || "N/A"}`,
		"",
		payload.message,
	].join("\n");

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from,
			to: env.CONTACT_EMAIL,
			subject,
			text,
		}),
	});

	if (!response.ok) {
		return { status: "error", reason: "Email provider request failed." };
	}

	return { status: "sent" };
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
		},
	});
}
