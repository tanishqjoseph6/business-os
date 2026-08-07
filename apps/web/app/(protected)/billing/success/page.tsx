import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

export default function BillingSuccessPage() {
  return <BillingResult icon={<CheckCircle2 className="h-8 w-8" />} title="Payment successful" body="Your payment was received. Your subscription and invoice will appear in Billing after confirmation." tone="success" action="Back to billing" href="/billing" />;
}

function BillingResult({ icon, title, body, tone, action, href }: { icon: React.ReactNode; title: string; body: string; tone: "success" | "danger"; action: string; href: string }) {
  return <div className="mx-auto flex min-h-[55vh] max-w-lg items-center justify-center"><Card elevated className="w-full p-8 text-center"><div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${tone === "success" ? "bg-success/15 text-success" : "bg-error/15 text-error"}`}>{icon}</div><h1 className="mt-6 text-2xl font-semibold">{title}</h1><p className="mt-3 text-sm leading-6 text-secondary">{body}</p><Link href={href}><Button className="mt-7 gap-2">{action}<ArrowRight className="h-4 w-4" /></Button></Link></Card></div>;
}

