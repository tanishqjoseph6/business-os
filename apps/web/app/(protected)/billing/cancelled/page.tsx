import Link from "next/link";
import { ArrowRight, Ban } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

export default function BillingCancelledPage() {
  return <div className="mx-auto flex min-h-[55vh] max-w-lg items-center justify-center"><Card className="w-full p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-elevated text-secondary"><Ban className="h-8 w-8" /></div><h1 className="mt-6 text-2xl font-semibold">Subscription cancelled</h1><p className="mt-3 text-sm leading-6 text-secondary">Your subscription cancellation is scheduled. You will keep access through the current billing period.</p><Link href="/billing"><Button variant="secondary" className="mt-7 gap-2">Return to billing <ArrowRight className="h-4 w-4" /></Button></Link></Card></div>;
}

