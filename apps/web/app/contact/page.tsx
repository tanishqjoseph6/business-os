import type { Metadata } from "next";
import { InstagramSocialLink } from "../../components/branding/instagram-social-link";
import { MarketingShell } from "../../components/marketing/marketing-shell";
import { ContactForm } from "../../components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the VanderBase team for sales, support, or partnership inquiries.",
};

export default function ContactPage() {
  return (
    <MarketingShell
      title="Contact VanderBase"
      subtitle="Sales, support, and partnerships — we typically reply within one business day."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <ContactForm />
        <aside className="space-y-4 rounded-2xl border border-border bg-elevated/40 p-6 text-sm text-secondary">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Email</p>
            <a href="mailto:hello@vanderbase.com" className="mt-2 block text-foreground hover:text-primary">
              hello@vanderbase.com
            </a>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Social</p>
            <InstagramSocialLink
              showHandle
              className="mt-2 inline-flex items-center gap-2 text-foreground hover:text-primary"
            />
          </div>
          <p className="pt-2 text-xs leading-5 text-muted">
            Prefer joining early access? Visit the homepage and join the VanderBase waitlist.
          </p>
        </aside>
      </div>
    </MarketingShell>
  );
}
