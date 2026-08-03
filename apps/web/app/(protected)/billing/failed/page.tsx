import Link from "next/link";
import { ArrowRight, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

export default function BillingFailedPage() {
  return <BillingResult title="Payment failed" body="No changes were made to your plan. Check your payment method and try again." icon={<XCircle className="h-8 w-8" />} action="Try again" href="/billing/payment-methods" />;
}

function BillingResult({ icon, title, body, action, href }: { icon: React.ReactNode; title: string; body: string; action: string; href: string }) {
  return <div className="mx-auto flex min-h-[55vh] max-w-lg items-center justify-center"><Card elevated className="w-full p-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-error/15 text-error">{icon}</div><h1 className="mt-6 text-2xl font-semibold">{title}</h1><p className="mt-3 text-sm leading-6 text-secondary">{body}</p><Link href={href}><Button className="mt-7 gap-2"><RotateCcw className="h-4 w-4" />{action}<ArrowRight className="h-4 w-4" /></Button></Link></Card></div>;
}

