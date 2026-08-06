import type { Metadata } from "next";
import { LegalProse, LegalSection, MarketingShell } from "../../components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How VanderBase collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <MarketingShell
      title="Privacy Policy"
      subtitle="Last updated: July 29, 2026. We designed VanderBase to keep your business data private and under your control."
    >
      <LegalProse>
        <LegalSection title="1. Who we are">
          <p>
            VanderBase (“we”, “us”) operates the VanderBase web application and related services. For
            privacy inquiries contact{" "}
            <a href="mailto:hello@vanderbase.com" className="text-primary hover:underline">
              hello@vanderbase.com
            </a>
            .
          </p>
        </LegalSection>
        <LegalSection title="2. Information we collect">
          <p>
            Account data (name, email, authentication identifiers), workspace content you create,
            usage and device data needed to operate and secure the Service, and information you
            submit via waitlist or contact forms.
          </p>
        </LegalSection>
        <LegalSection title="3. How we use information">
          <p>
            We use data to provide and improve the Service, authenticate users, send transactional
            emails (verification, password reset, product updates you opted into), prevent abuse, and
            comply with law. We do not sell your personal information.
          </p>
        </LegalSection>
        <LegalSection title="4. AI processing">
          <p>
            When you use AI features, relevant workspace context may be sent to model providers to
            generate responses. We configure providers to avoid training on your workspace data where
            contractually available. Do not submit secrets you are not authorized to process.
          </p>
        </LegalSection>
        <LegalSection title="5. Sharing">
          <p>
            We share data with trusted infrastructure partners solely to operate authentication,
            hosting, and related Service features, or when required by law. Partners are bound by
            appropriate data protection terms. Sign in with Google is provided via Google OAuth.
          </p>
        </LegalSection>
        <LegalSection title="6. Retention">
          <p>
            We retain account and workspace data while your account is active and for a reasonable
            period afterward for backups, legal obligations, and dispute resolution. You may request
            deletion subject to those obligations.
          </p>
        </LegalSection>
        <LegalSection title="7. Your rights">
          <p>
            Depending on your location, you may have rights to access, correct, export, or delete
            personal data. Contact us to exercise these rights. Waitlist and marketing emails can be
            opted out via the consent mechanisms provided at signup.
          </p>
        </LegalSection>
        <LegalSection title="8. Cookies">
          <p>
            We use essential cookies for authentication and security. See our{" "}
            <a href="/cookies" className="text-primary hover:underline">
              Cookie Policy
            </a>{" "}
            for details.
          </p>
        </LegalSection>
        <LegalSection title="9. Changes">
          <p>
            We may update this policy. Material changes will be reflected by updating the date above
            and, where appropriate, additional notice in-product.
          </p>
        </LegalSection>
      </LegalProse>
    </MarketingShell>
  );
}
