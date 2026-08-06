import type { Metadata } from "next";
import { LegalProse, LegalSection, MarketingShell } from "../../components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How VanderBase uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <MarketingShell
      title="Cookie Policy"
      subtitle="Last updated: July 29, 2026. This policy explains how VanderBase uses cookies."
    >
      <LegalProse>
        <LegalSection title="1. What are cookies">
          <p>
            Cookies are small text files stored on your device. We also use similar technologies such
            as local storage for session and preference data.
          </p>
        </LegalSection>
        <LegalSection title="2. Essential cookies">
          <p>
            Required for sign-in, session security, CSRF protection, and core workspace functionality.
            These cannot be disabled while using authenticated features.
          </p>
        </LegalSection>
        <LegalSection title="3. Preference & analytics">
          <p>
            We may store UI preferences locally. If we add optional analytics cookies, we will update
            this policy and, where required, request consent.
          </p>
        </LegalSection>
        <LegalSection title="4. Managing cookies">
          <p>
            You can clear cookies and site data in your browser settings. Doing so may sign you out of
            VanderBase.
          </p>
        </LegalSection>
        <LegalSection title="5. Contact">
          <p>
            Questions:{" "}
            <a href="mailto:hello@vanderbase.com" className="text-primary hover:underline">
              hello@vanderbase.com
            </a>
            .
          </p>
        </LegalSection>
      </LegalProse>
    </MarketingShell>
  );
}
