import Link from "next/link";
import type { ReactNode } from "react";
import { InstagramSocialLink } from "../branding/instagram-social-link";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

export function MarketingShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="bos-atmosphere min-h-screen">
      <header className="relative z-10 border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-5 py-4 sm:gap-8 sm:px-8 sm:py-5">
          <Link href="/" className="inline-flex shrink-0 items-center" aria-label="VanderBase">
            <VanderBaseLogo size="nav" priority />
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-secondary">
            <Link href="/contact" className="transition hover:text-foreground">
              Contact
            </Link>
            <Link href="/signin" className="transition hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-sm leading-6 text-secondary sm:text-base">{subtitle}</p> : null}
        </div>
        {children}
      </main>
      <footer className="relative z-10 border-t border-border/60 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <VanderBaseLogo size="sm" />
            <p>© {new Date().getFullYear()} VanderBase. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <InstagramSocialLink className="inline-flex items-center transition hover:text-foreground" />
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/cookies" className="hover:text-foreground">
              Cookies
            </Link>
            <Link href="/refund" className="hover:text-foreground">
              Refunds
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LegalProse({ children }: { children: ReactNode }) {
  return (
    <article className="space-y-8 rounded-2xl border border-border bg-surface/80 p-6 text-sm leading-7 text-secondary shadow-soft sm:p-10">
      {children}
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
