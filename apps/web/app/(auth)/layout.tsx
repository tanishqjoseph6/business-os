import Link from "next/link";
import type { Metadata } from "next";
import { VanderBaseLogo } from "../../components/branding/vanderbase-logo";
import { AuthToastProvider } from "../../components/auth/auth-toast";

export const metadata: Metadata = {
  title: {
    default: "Account",
    template: "%s | VanderBase",
  },
  description:
    "Secure VanderBase authentication — sign in, sign up, and manage your account.",
  applicationName: "VanderBase",
  robots: { index: false, follow: false },
  openGraph: {
    title: "VanderBase Account",
    description: "Sign in to the AI-native Business OS.",
    siteName: "VanderBase",
    images: [
      {
        url: "/branding/vanderbase-og.png",
        width: 1200,
        height: 630,
        alt: "VanderBase",
      },
    ],
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <AuthToastProvider>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0B0B] px-4 py-12 text-foreground">
      {/* Landing-matched atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-[8%] -top-[12%] h-[42vw] w-[42vw] rounded-full bg-[radial-gradient(circle,rgba(255,122,0,0.32),transparent_70%)] blur-3xl" />
        <div className="absolute -right-[10%] top-[18%] h-[36vw] w-[36vw] rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.2),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-20%] left-[30%] h-[48vw] w-[48vw] rounded-full bg-[radial-gradient(circle,rgba(234,88,12,0.14),transparent_70%)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center py-1 transition duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="VanderBase home"
          >
            <VanderBaseLogo size="lg" priority />
          </Link>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            The AI-native Business OS
          </p>
        </div>

        <div className="bos-glass-strong rounded-[22px] p-6 sm:p-8 pbos-animate-scale">
          {children}
        </div>

        <div className="mt-8 space-y-3 text-center text-xs text-muted">
          <p>
            <Link href="/terms" className="transition hover:text-foreground">
              Terms
            </Link>
            {" · "}
            <Link href="/privacy" className="transition hover:text-foreground">
              Privacy
            </Link>
            {" · "}
            <Link href="/contact" className="transition hover:text-foreground">
              Contact
            </Link>
            {" · "}
            <a
              href="mailto:hello@vanderbase.com"
              className="transition hover:text-foreground"
            >
              Support
            </a>
          </p>
          <p className="text-[11px] text-muted/80">
            © {year} VanderBase. All rights reserved.
          </p>
        </div>
      </div>
    </div>
    </AuthToastProvider>
  );
}
