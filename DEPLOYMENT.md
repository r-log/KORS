# Cloudflare Pages deployment (detailed)

This project uses Astro with a Pages Function at `/contact` and Cloudflare Turnstile for spam protection.

## 1) Create Cloudflare Turnstile keys
1. Go to Cloudflare Dashboard → **Turnstile** → **Add site**.
2. Site name: `Kors Digital`.
3. Domain: your production domain (and a separate dev domain if needed).
4. Copy:
   - **Site key** (public)
   - **Secret key** (private)

## 2) Create a Cloudflare Pages project
1. Go to Cloudflare Dashboard → **Pages** → **Create a project**.
2. Choose **Connect to Git** (GitHub/GitLab) and select this repo.
3. Framework preset: **Astro** (or “None” if Astro isn’t listed).
4. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Functions directory: `functions`
5. Click **Save and Deploy**.

## 3) Add environment variables
Cloudflare Dashboard → Pages → Your project → **Settings** → **Environment variables**.

Required:
- `PUBLIC_TURNSTILE_SITE_KEY` = your Turnstile site key
- `TURNSTILE_SECRET_KEY` = your Turnstile secret key

Optional (email delivery using Resend):
- `RESEND_API_KEY` = your Resend API key
- `CONTACT_EMAIL` = destination inbox
- `CONTACT_FROM` = verified sender (e.g. `Kors Digital <hello@korsdigital.com>`)

Add them for both **Production** and **Preview** environments if needed.

## 4) Connect your domain
1. Cloudflare Dashboard → **Pages** → project → **Custom domains**.
2. Add your domain (e.g. `korsdigital.com`).
3. Follow Cloudflare’s DNS prompts (A/CNAME records will be suggested).
4. Wait for SSL to provision (usually a few minutes).

## 5) Verify Turnstile on the site
1. Visit your deployed site.
2. Scroll to the contact section.
3. The Turnstile widget should render.
4. Submit the form to confirm `/contact` responds with success.

## 6) Optional: Test Resend email delivery
1. Ensure your Resend sender is verified.
2. Submit the contact form.
3. Check the destination inbox.

## 7) Local development
```bash
npm install
npm run dev
```

## 8) Common issues
- **Turnstile not showing**: ensure `PUBLIC_TURNSTILE_SITE_KEY` is set in the environment.
- **Form fails with 403**: Turnstile secret is incorrect or the domain is not added in Turnstile.
- **Form succeeds but no email**: set `RESEND_API_KEY`, `CONTACT_EMAIL`, `CONTACT_FROM`.

The contact form posts to `/contact` and is protected by Turnstile.
