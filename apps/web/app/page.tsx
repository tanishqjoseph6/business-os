import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@repo/auth/server";
import { LandingPage } from "../components/landing/landing-page";
import { AuthSessionBootstrap } from "../components/auth/auth-session-bootstrap";
import "./landing.css";

export const metadata: Metadata = {
  title: "VanderBase Public Beta — The AI-Native Business OS",
  description:
    "Join VanderBase public beta: CRM, Finance, Projects, Documents, Calendar, Analytics, Notifications, Integrations, Security, PWA, and Kairos AI in one premium Business OS.",
  keywords: [
    "VanderBase",
    "public beta",
    "AI Business OS",
    "CRM",
    "project management",
    "finance dashboard",
    "Kairos AI",
  ],
  openGraph: {
    title: "VanderBase Public Beta — The AI-Native Business OS",
    description:
      "Run CRM, Finance, Projects, Documents, Calendar, Analytics, Notifications, Security, and Kairos AI from one premium workspace.",
    url: "/",
    siteName: "VanderBase",
    type: "website",
    images: [
      {
        url: "/branding/vanderbase-og.png",
        width: 1200,
        height: 630,
        alt: "VanderBase — The AI-Native Business OS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VanderBase Public Beta — The AI-Native Business OS",
    description:
      "Join the public beta for the AI-native Business OS for modern teams.",
    images: ["/branding/vanderbase-og.png"],
  },
  alternates: { canonical: "/" },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;
  const nextParam = typeof params.next === "string" ? params.next : "/dashboard";
  const safeNext =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  // If Supabase falls back to Site URL (/) with a PKCE code, recover here even
  // when middleware forwarding is skipped/misordered.
  if (code) {
    const callback = new URLSearchParams({
      code,
      next: safeNext,
    });
    redirect(`/auth/callback?${callback.toString()}`);
  }

  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <AuthSessionBootstrap />
      <LandingPage />
    </>
  );
}
