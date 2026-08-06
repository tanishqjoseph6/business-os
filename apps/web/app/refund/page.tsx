import type { Metadata } from "next";
import { LegalProse, LegalSection, MarketingShell } from "../../components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "VanderBase refund and cancellation policy.",
};

export default function RefundPage() {
  return (
    <MarketingShell
      title="Refund Policy"
      subtitle="Last updated: July 29, 2026. Placeholder policy for pre-launch billing."
    >
      <LegalProse>
        <LegalSection title="1. Pre-launch access">
          <p>
            During waitlist and early access periods, VanderBase may be offered without charge. No
            payment is required to join the waitlist.
          </p>
        </LegalSection>
        <LegalSection title="2. One-time purchases">
          <p>
            VanderBase uses a one-time purchase model—not monthly or yearly subscriptions. Pro,
            additional team seats, and AI credit packs are charged once at checkout. Charges and
            product details are disclosed before payment via Stripe or Razorpay.
          </p>
        </LegalSection>
        <LegalSection title="3. Credits and seats">
          <p>
            AI credit packs and additional team member seats are also one-time purchases. Unused
            credits remain available in your workspace unless otherwise stated at purchase. There is
            no auto-renewal for credit packs or seats.
          </p>
        </LegalSection>
        <LegalSection title="4. Refunds">
          <p>
            Refund eligibility follows the terms shown at purchase. As a general guideline, we aim to
            resolve billing issues fairly within 14 days of a paid one-time charge when a material
            service defect is reported. This section is a placeholder and will be finalized before
            public paid launch.
          </p>
        </LegalSection>
        <LegalSection title="5. Contact">
          <p>
            Billing questions:{" "}
            <a href="mailto:hello@vanderbase.com" className="text-primary hover:underline">
              hello@vanderbase.com
            </a>{" "}
            or{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact
            </a>
            .
          </p>
        </LegalSection>
      </LegalProse>
    </MarketingShell>
  );
}
