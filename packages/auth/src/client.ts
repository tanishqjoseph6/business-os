"use client";

import { createBrowserClient } from "@repo/database/browser";
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
} from "@repo/types/auth";
import { buildAuthCallbackUrl, getSiteUrl } from "./site-url";

export { buildAuthCallbackUrl, getSiteUrl };

export async function signInWithPassword(input: SignInInput) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signUpWithPassword(
  input: SignUpInput,
  emailRedirectTo: string,
) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo,
      data: {
        full_name: input.fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function signInWithGoogle(
  redirectTo?: string,
  nextPath = "/dashboard",
) {
  const supabase = createBrowserClient();
  const callbackUrl =
    redirectTo ?? buildAuthCallbackUrl(nextPath, getSiteUrl());
  console.info("[auth.google] starting OAuth", {
    redirectTo: callbackUrl,
    nextPath,
    siteOrigin: getSiteUrl(),
  });
  // Stock Supabase Google login only. Do NOT pass Gmail-style queryParams
  // (access_type=offline, prompt=consent) here — those belong on the separate
  // Gmail OAuth client. Extra provider params have caused GoTrue
  // "Unable to exchange external code" / unexpected_failure after consent.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    console.warn("[auth.google] signInWithOAuth failed", {
      message: error.message,
      redirectTo: callbackUrl,
    });
    throw new Error(error.message);
  }

  return data;
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
  redirectTo: string,
) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updatePassword(input: ResetPasswordInput) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    throw new Error(mapPasswordUpdateError(error.message));
  }

  return data;
}

function mapPasswordUpdateError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("expired") ||
    lower.includes("session missing") ||
    lower.includes("not authenticated") ||
    lower.includes("jwt")
  ) {
    return "This reset link has expired. Request a new one and try again.";
  }
  if (
    lower.includes("already been used") ||
    lower.includes("reuse") ||
    lower.includes("invalid") ||
    lower.includes("flow state")
  ) {
    return "This reset link is no longer valid. Request a new one and try again.";
  }
  if (
    lower.includes("weak") ||
    lower.includes("at least") ||
    lower.includes("password should") ||
    lower.includes("too short")
  ) {
    return "Choose a stronger password (12+ characters with upper, lower, number, and symbol).";
  }
  if (lower.includes("same") || lower.includes("different from the old")) {
    return "Choose a password that is different from your current one.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }
  return message || "Unable to update password. Please try again.";
}

export async function signOutClient() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function resendVerificationEmail(email: string, emailRedirectTo: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    throw new Error(mapResendVerificationError(error.message));
  }

  return data;
}

export async function getAuthSession() {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

export async function getAuthUser() {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(error.message);
  }
  return data.user;
}

export function isEmailVerified(
  user: { email_confirmed_at?: string | null } | null | undefined,
): boolean {
  return Boolean(user?.email_confirmed_at);
}

export async function refreshAuthSession() {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

function mapResendVerificationError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate") || lower.includes("too many")) {
    return "Too many requests. Wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error. Check your connection and try again.";
  }
  if (
    lower.includes("already") &&
    (lower.includes("confirmed") || lower.includes("verified"))
  ) {
    return "This email is already verified. You can sign in.";
  }
  if (lower.includes("invalid") || lower.includes("not found")) {
    return "We couldn't send a verification email to this address. Check the email or sign up again.";
  }
  return message || "Unable to send verification email. Please try again.";
}

/** Listen for password-recovery session establishment (email link). */
export function onPasswordRecovery(
  callback: (ready: boolean) => void,
): () => void {
  const supabase = createBrowserClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
      callback(Boolean(session));
    }
  });
  return () => subscription.unsubscribe();
}

/** Listen for email verification completion (link click or session refresh). */
export function onEmailVerification(
  callback: (verified: boolean) => void,
): () => void {
  const supabase = createBrowserClient();

  async function checkVerified() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      callback(false);
      return;
    }
    callback(isEmailVerified(data.user));
  }

  void checkVerified();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (
      event === "SIGNED_IN" ||
      event === "USER_UPDATED" ||
      event === "TOKEN_REFRESHED"
    ) {
      void checkVerified();
    }
  });

  return () => subscription.unsubscribe();
}
