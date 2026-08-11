# VanderBase authentication branding

First-party VanderBase auth requires **in-app UI** (this repo) plus **Google Cloud** and **Supabase Auth** dashboard settings (outside the repo). Users should never see third-party product names on consent screens or transactional emails.

## Brand constants

| Field | Value |
| --- | --- |
| App name | `VanderBase` |
| Tagline | The AI-native Business OS |
| Primary | `#FF7A00` |
| Background | `#0B0B0B` |
| Homepage | `https://vanderbase.com` |
| Privacy | `https://vanderbase.com/privacy` |
| Terms | `https://vanderbase.com/terms` |
| Support | `hello@vanderbase.com` |
| Logo (wordmark) | `apps/web/public/branding/vanderbase-wordmark.png` |
| Logo (icon / consent) | `apps/web/public/branding/vanderbase-icon-512.png` |
| OG image | `apps/web/public/branding/vanderbase-og.png` (1200×630) |

## 1. Google Cloud — OAuth consent screen (Sign in with Google)

This controls the **Google account picker / consent UI**. It must say **VanderBase**, not a Supabase project name or localhost.

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **OAuth consent screen**.
2. **App name:** `VanderBase`
3. **User support email:** `hello@vanderbase.com` (or your verified workspace inbox)
4. **App logo:** upload `vanderbase-icon-512.png` (square PNG, under 1 MB)
5. **Application home page:** `https://vanderbase.com`
6. **Authorized domains:** `vanderbase.com` (and your auth callback host if shown)
7. **Developer contact:** `hello@vanderbase.com`
8. **Privacy policy:** `https://vanderbase.com/privacy`
9. **Terms of service:** `https://vanderbase.com/terms`
10. Save. Publish / submit for verification if the app is in production / external users.

### OAuth client used by VanderBase login

Supabase Auth exchanges the Google code **before** our app’s `/auth/callback` PKCE step. The **Authorized redirect URI** on the Google OAuth client used in **Supabase → Authentication → Providers → Google** must be exactly:

```text
https://pmfnjrszrnelymswwzwo.supabase.co/auth/v1/callback
```

If Google consent succeeds but the browser lands with:

`error=server_error&error_code=unexpected_failure&error_description=Unable+to+exchange+external+code:...`

that failure is **Supabase ↔ Google** (wrong Client Secret, wrong client, or missing Supabase callback URI) — not our PKCE `code_verifier` / `exchangeCodeForSession`.

Do **not** put `http://localhost:3000/...` on the consent screen as the app name or home page. Localhost belongs only in Supabase **Redirect URLs** for local development.

> Keep the **Gmail Inbox** OAuth client (`GOOGLE_CLIENT_ID` for `/api/inbox/oauth/callback`) **separate** from the **Sign in with Google** client pasted into Supabase Auth. Sharing one client is a common source of “Unable to exchange external code” after consent.

## 2. Supabase Auth — URLs & company

1. **Project Settings → General → Company name:** `VanderBase`
2. **Authentication → URL Configuration**
   - **Site URL:** `https://www.vanderbase.com` (production — Vercel canonical host)
   - **Redirect URLs** (examples):
     - `https://www.vanderbase.com/auth/callback`
     - `https://www.vanderbase.com/auth/callback?next=/dashboard`
     - `https://www.vanderbase.com/auth/callback?next=/verify-email`
     - `https://www.vanderbase.com/auth/callback?next=/reset-password`
     - `https://vanderbase.com/auth/callback` (optional; apex 308s to www)
     - `http://localhost:3000/auth/callback` (local only)
3. **Authentication → Providers → Google** — enable; paste the Google Client ID/Secret from the consent-screen project above.

## 3. Supabase Auth — Email templates

Copy HTML from `docs/auth/email-templates/` into the Auth dashboard:

| Template | File | Suggested subject |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | `Verify your VanderBase email` |
| Reset password | `reset-password.html` | `Reset your VanderBase password` |
| Magic link | `magic-link.html` | `Sign in to VanderBase` |

Also set:

- **Sender name:** `VanderBase`
- Prefer custom SMTP so messages are not labeled as a generic auth provider.

Logo URLs in the templates point at `https://www.vanderbase.com/branding/...` — ensure those assets are deployed publicly.

## 4. App environment

```bash
NEXT_PUBLIC_SITE_URL=https://www.vanderbase.com
```

Avoid shipping production builds with `localhost` as the public site URL (metadata / OAuth redirects).
Apex `https://vanderbase.com` redirects to www at the Vercel edge — Site URL and OAuth redirects must use **www**.

## 5. Verify checklist

- [ ] Sign up (email) → branded verification email → session
- [ ] Sign in (email/password)
- [ ] Continue with Google → consent shows **VanderBase** + logo
- [ ] Logout → `/signin`
- [ ] Refresh / reopen → session restore via cookies
- [ ] Forgot password → branded reset email
- [ ] Browser tab: VanderBase title + favicon
- [ ] Share link: OG image shows VanderBase (not a generic icon)
