import type { Metadata } from "next";
import { LegalProse, LegalSection, MarketingShell } from "../../components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for VanderBase — the AI-native Business OS.",
};

export default function TermsPage() {
  return (
    <MarketingShell
      title="Terms of Service"
      subtitle="Last updated: July 29, 2026. These terms govern your use of VanderBase."
    >
      <LegalProse>
        <LegalSection title="1. Agreement">
          <p>
            By accessing or using VanderBase (“Service”), you agree to these Terms of Service and our
            Privacy Policy. If you are using the Service on behalf of an organization, you represent
            that you have authority to bind that organization.
          </p>
        </LegalSection>
        <LegalSection title="2. The Service">
          <p>
            VanderBase provides an AI-native business operating system including CRM, inbox, content,
            analytics, and related workspace tools. Features may change as we improve the product.
            Pre-launch or waitlist access does not guarantee availability of any specific feature on
            a specific date.
          </p>
        </LegalSection>
        <LegalSection title="3. Accounts">
          <p>
            You are responsible for maintaining the security of your account credentials and for all
            activity under your account. Provide accurate information and keep it up to date. You must
            be at least 16 years old to use the Service.
          </p>
        </LegalSection>
        <LegalSection title="4. Acceptable use">
          <p>
            You agree not to misuse the Service, including attempting unauthorized access, disrupting
            infrastructure, uploading unlawful content, or using the Service to violate others’
            rights. We may suspend access for violations or to protect the platform.
          </p>
        </LegalSection>
        <LegalSection title="5. AI features">
          <p>
            AI outputs are probabilistic and may be incomplete or incorrect. You remain responsible for
            reviewing AI-generated content before acting on it in your business. Do not rely on AI
            outputs as sole legal, financial, or medical advice.
          </p>
        </LegalSection>
        <LegalSection title="6. Billing">
          <p>
            Paid products use one-time purchases (Pro, team seats, and AI credit packs)—not recurring
            monthly or yearly subscriptions. Prices and taxes are shown at checkout. See our Refund
            Policy for refund terms.
          </p>
        </LegalSection>
        <LegalSection title="7. Intellectual property">
          <p>
            VanderBase and its branding, software, and documentation remain our property. You retain
            ownership of content you submit. You grant us a limited license to host and process that
            content solely to provide the Service.
          </p>
        </LegalSection>
        <LegalSection title="8. Disclaimers & limitation">
          <p>
            The Service is provided “as is” to the fullest extent permitted by law. VanderBase is not
            liable for indirect, incidental, or consequential damages arising from your use of the
            Service.
          </p>
        </LegalSection>
        <LegalSection title="9. Contact">
          <p>
            Questions about these terms:{" "}
            <a href="mailto:hello@vanderbase.com" className="text-primary hover:underline">
              hello@vanderbase.com
            </a>{" "}
            or visit our{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact
            </a>{" "}
            page.
          </p>
        </LegalSection>
      </LegalProse>
    </MarketingShell>
  );
}
