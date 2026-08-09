"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildAuthCallbackUrl,
  getAuthSession,
  getAuthUser,
  isEmailVerified,
  onPasswordRecovery,
  requestPasswordReset,
  resendVerificationEmail,
  signInWithGoogle,
  signInWithPassword,
  signOutClient,
  signUpWithPassword,
  updatePassword,
} from "@repo/auth/client";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@repo/types/auth";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { FormField } from "@repo/ui/form-field";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";
import { cn } from "@repo/ui/utils";
import { CheckCircle2, Mail } from "lucide-react";
import { useAuthToast } from "./auth-toast";
import { useResendCountdown } from "./use-resend-countdown";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}

function AuthLegalNote() {
  return (
    <p className="text-center text-xs leading-5 text-muted">
      By continuing, you agree to VanderBase{" "}
      <Link href="/terms" className="text-secondary underline-offset-2 hover:text-foreground hover:underline">
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="text-secondary underline-offset-2 hover:text-foreground hover:underline">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const authError = searchParams.get("error");
  const oauthStatus = searchParams.get("oauth");
  const oauthEmail = searchParams.get("email");
  const [error, setError] = useState<string | null>(
    authError === "auth_callback"
      ? "Authentication failed. Please try again."
      : authError === "session_expired"
        ? "Your session expired. Please sign in again."
        : null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        await signInWithPassword(parsed.data);
        const user = await getAuthUser();
        if (!isEmailVerified(user)) {
          const verifyUrl = new URL("/verify-email", window.location.origin);
          verifyUrl.searchParams.set("email", parsed.data.email);
          verifyUrl.searchParams.set("from", "signin");
          verifyUrl.searchParams.set("next", nextPath);
          router.replace(`${verifyUrl.pathname}${verifyUrl.search}`);
          router.refresh();
          return;
        }
        const target =
          oauthStatus && nextPath.startsWith("/")
            ? `${nextPath}${nextPath.includes("?") ? "&" : "?"}oauth=${encodeURIComponent(oauthStatus)}${
                oauthEmail ? `&email=${encodeURIComponent(oauthEmail)}` : ""
              }`
            : nextPath;
        // Use a full navigation after auth so middleware reads the freshly
        // persisted Supabase cookies before rendering the protected route.
        window.location.assign(target);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to sign in");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {oauthStatus === "connected" ? (
        <Alert variant="success">
          Gmail connected{oauthEmail ? ` (${oauthEmail})` : ""}. Sign in again to
          return to your inbox — your workspace session was refreshed.
        </Alert>
      ) : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" required invalid={Boolean(errors.password)} />
      </FormField>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-secondary transition duration-200 hover:text-foreground"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={pending} className="w-full">
        Sign in
      </Button>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-surface px-2 text-muted">Or</span>
        </div>
      </div>
      <GoogleButton label="Continue with Google" nextPath={nextPath} />
      <AuthLegalNote />
      <p className="text-center text-sm text-secondary">
        No account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground transition duration-200 hover:text-secondary"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const { showToast } = useAuthToast();
  const { secondsLeft, canResend, startCountdown } = useResendCountdown();
  const [error, setError] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [resendPending, startResendTransition] = useTransition();
  const redirectTo = useMemo(
    () => buildAuthCallbackUrl("/verify-email"),
    [],
  );

  function onSubmit(formData: FormData) {
    setError(null);
    const parsed = signUpSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    if (formData.get("terms") !== "on") {
      setErrors({ terms: "Please accept the Terms and Privacy Policy." });
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        const result = await signUpWithPassword(parsed.data, redirectTo);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("vb_verify_email", parsed.data.email);
        }
        if (result.session && isEmailVerified(result.user)) {
          window.location.assign("/dashboard");
          return;
        }
        setSignupEmail(parsed.data.email);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to sign up");
      }
    });
  }

  function onResendVerification() {
    if (!signupEmail || !canResend) return;

    startResendTransition(async () => {
      try {
        await resendVerificationEmail(signupEmail, redirectTo);
        startCountdown();
        showToast("Verification email sent. Check your inbox and spam folder.", "success");
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Unable to send verification email.",
          "error",
        );
      }
    });
  }

  if (signupEmail) {
    return (
      <div className="grid gap-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center rounded-2xl border border-primary/25 bg-primary-muted/20 px-5 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_32px_rgba(255,122,0,0.25)]">
            <Mail className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">
            We&apos;ve sent a verification link to your email address. Please
            verify your account to continue.
          </p>
          <p className="mt-3 break-all text-xs font-medium text-primary">{signupEmail}</p>
          <p className="mt-4 text-xs leading-5 text-muted">
            Didn&apos;t receive it? Check spam or resend below. Links expire for
            your security.
          </p>
        </div>
        <Button
          type="button"
          loading={resendPending}
          disabled={!canResend}
          className="w-full"
          onClick={onResendVerification}
        >
          {canResend ? "Resend email" : `Resend in ${secondsLeft}s`}
        </Button>
        <Link href={`/verify-email?email=${encodeURIComponent(signupEmail)}`}>
          <Button variant="secondary" className="w-full">
            Open verification page
          </Button>
        </Link>
        <p className="text-center text-sm text-secondary">
          <Link
            href="/signin"
            className="font-medium text-foreground transition duration-200 hover:text-secondary"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="Full name" htmlFor="fullName" error={errors.fullName}>
        <Input id="fullName" name="fullName" autoComplete="name" required invalid={Boolean(errors.fullName)} />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required invalid={Boolean(errors.password)} />
      </FormField>
      <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required invalid={Boolean(errors.confirmPassword)} />
      </FormField>
      <label className="flex items-start gap-3 rounded-xl border border-border bg-elevated/40 px-3 py-3 text-sm text-secondary">
        <input
          type="checkbox"
          name="terms"
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          required
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-foreground underline-offset-2 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-foreground underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {errors.terms ? <p className="text-xs text-red-400">{errors.terms}</p> : null}
      <Button type="submit" loading={pending} className="w-full">
        Create account
      </Button>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-surface px-2 text-muted">Or</span>
        </div>
      </div>
      <GoogleButton label="Sign up with Google" nextPath="/dashboard" />
      <AuthLegalNote />
      <p className="text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-foreground transition duration-200 hover:text-secondary"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const redirectTo = useMemo(
    () => buildAuthCallbackUrl("/reset-password"),
    [],
  );

  function onSubmit(formData: FormData) {
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        await requestPasswordReset(parsed.data, redirectTo);
        setSentTo(parsed.data.email);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unable to send reset email";
        if (/network|fetch|failed to fetch/i.test(msg)) {
          setError("Network error. Check your connection and try again.");
        } else if (/rate|too many/i.test(msg)) {
          setError("Too many requests. Wait a moment and try again.");
        } else {
          // Always show the same success-style outcome for unknown emails /
          // provider errors that would leak account existence — except clear network issues.
          setSentTo(parsed.data.email);
        }
      }
    });
  }

  if (sentTo) {
    return (
      <div className="grid gap-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center rounded-2xl border border-primary/25 bg-primary-muted/20 px-5 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_32px_rgba(255,122,0,0.25)]">
            <Mail className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">
            If an account exists for this email, we&apos;ve sent a password reset
            link.
          </p>
          <p className="mt-3 break-all text-xs font-medium text-primary">{sentTo}</p>
          <p className="mt-4 text-xs leading-5 text-muted">
            The link expires shortly. Check spam if you don&apos;t see it within a
            few minutes.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setSentTo(null)}
        >
          Try a different email
        </Button>
        <p className="text-center text-sm text-secondary">
          <Link
            href="/signin"
            className="font-medium text-foreground transition duration-200 hover:text-secondary"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField
        label="Email"
        htmlFor="email"
        error={errors.email}
        description="We'll email a secure VanderBase reset link to this address."
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          invalid={Boolean(errors.email)}
        />
      </FormField>
      <Button type="submit" loading={pending} className="w-full">
        Send reset link
      </Button>
      <p className="text-center text-sm text-secondary">
        <Link
          href="/signin"
          className="font-medium text-foreground transition duration-200 hover:text-secondary"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

function passwordStrength(password: string): {
  score: number;
  label: string;
  tone: string;
} {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) return { score: 0, label: "", tone: "bg-border" };
  if (score <= 2) return { score, label: "Weak", tone: "bg-error" };
  if (score === 3) return { score, label: "Fair", tone: "bg-warning" };
  if (score === 4) return { score, label: "Strong", tone: "bg-primary" };
  return { score, label: "Excellent", tone: "bg-success" };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, tone } = passwordStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              index < score ? tone : "bg-border",
            )}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted">
        Strength: <span className="text-secondary">{label}</span>
        {" · "}12+ chars with upper, lower, number, and symbol
      </p>
    </div>
  );
}

function resetLinkErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "expired":
      return "This reset link has expired. Request a new one to continue.";
    case "used":
      return "This reset link has already been used. Request a new one if you still need to change your password.";
    case "invalid":
      return "This reset link is invalid. Request a new one from Forgot password.";
    default:
      return "This reset link is no longer valid. Request a new one.";
  }
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    resetLinkErrorMessage(linkError),
  );
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onPasswordRecovery((ready) => {
      if (cancelled) return;
      if (ready) {
        setSessionReady(true);
        setChecking(false);
        setError(null);
      }
    });

    void (async () => {
      try {
        const session = await getAuthSession();
        if (cancelled) return;
        setSessionReady(Boolean(session));
        if (!session && !linkError) {
          setError(
            "Open the reset link from your email to continue. Links expire after a short time.",
          );
        }
      } catch {
        if (!cancelled) {
          setError("Unable to validate this reset session. Request a new link.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [linkError]);

  function onSubmit(formData: FormData) {
    setError(null);
    const parsed = resetPasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        await updatePassword(parsed.data);
        try {
          await signOutClient();
        } catch {
          // Session may already be cleared after recovery; ignore.
        }
        setDone(true);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unable to reset password";
        if (/network|fetch/i.test(msg)) {
          setError("Network error. Check your connection and try again.");
        } else {
          setError(msg);
        }
      }
    });
  }

  if (checking) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center animate-in fade-in duration-300">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="text-sm text-secondary">Validating your reset link…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="grid gap-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center rounded-2xl border border-primary/25 bg-primary-muted/20 px-5 py-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-[0_0_32px_rgba(255,122,0,0.25)]">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            Password updated successfully.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">
            Your VanderBase account is secured with the new password. Sign in to
            continue.
          </p>
        </div>
        <Link href="/signin">
          <Button className="w-full">Continue to Sign In</Button>
        </Link>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="grid gap-4 animate-in fade-in duration-300">
        <Alert variant="error">
          {error ?? "This reset link is no longer valid."}
        </Alert>
        <Link href="/forgot-password">
          <Button className="w-full">Request a new reset link</Button>
        </Link>
        <p className="text-center text-sm text-secondary">
          <Link
            href="/signin"
            className="font-medium text-foreground hover:text-secondary"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid gap-4 animate-in fade-in duration-300">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="New password" htmlFor="password" error={errors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          invalid={Boolean(errors.password)}
        />
        <PasswordStrengthMeter password={password} />
      </FormField>
      <FormField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={
          errors.confirmPassword ||
          (confirmPassword &&
          password &&
          confirmPassword !== password
            ? "Passwords do not match"
            : undefined)
        }
      >
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          invalid={
            Boolean(errors.confirmPassword) ||
            Boolean(confirmPassword && password && confirmPassword !== password)
          }
        />
      </FormField>
      <Button
        type="submit"
        loading={pending}
        className="w-full"
        disabled={Boolean(confirmPassword && password !== confirmPassword)}
      >
        Update password
      </Button>
    </form>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function GoogleButton({
  label,
  nextPath = "/dashboard",
}: {
  label: string;
  nextPath?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Button
        type="button"
        variant="secondary"
        loading={pending}
        className="w-full gap-2.5 border-border bg-[#16161d] text-foreground hover:border-primary/40 hover:bg-[#1c1c26]"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const data = await signInWithGoogle(undefined, nextPath);
              if (data.url) {
                window.location.assign(data.url);
              }
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Google sign-in failed",
              );
            }
          });
        }}
      >
        {!pending ? <GoogleMark /> : null}
        {label}
      </Button>
    </div>
  );
}
