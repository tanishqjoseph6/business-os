import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPage } from "../../components/pricing/checkout-page";

export const metadata: Metadata = {
  title: "Checkout | VanderBase",
  description: "Complete a secure VanderBase purchase or subscription checkout.",
};

export default function CheckoutRoute() {
  return (
    <Suspense
      fallback={
        <div className="bos-atmosphere flex min-h-screen items-center justify-center text-sm text-secondary">
          Preparing checkout…
        </div>
      }
    >
      <CheckoutPage />
    </Suspense>
  );
}
