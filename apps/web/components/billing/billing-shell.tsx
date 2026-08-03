"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  HardDrive,
  Layers3,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Receipt,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import {
  billingPlans,
  addPaymentMethod,
  buyAddon,
  changeBillingPlan,
  manageSubscription,
  mockBillingSnapshot,
  updateBillingSettings,
  type BillingInterval,
  type BillingPlanId,
  type BillingSnapshot,
  type PaymentMethod,
  type SubscriptionStatus,
} from "../../lib/billing/mock-api";
import { STORAGE_ADDONS } from "../../lib/pricing";

export type BillingSection =
  | "overview"
  | "plans"
  | "usage"
  | "invoices"
  | "payment-methods"
  | "addons"
  | "settings"
  | "subscription";

const nav: Array<{ id: BillingSection; label: string; icon: typeof CreditCard }> = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "plans", label: "Plans", icon: Layers3 },
  { id: "usage", label: "Usage", icon: Activity },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "payment-methods", label: "Payment methods", icon: CreditCard },
  { id: "addons", label: "Credits & add-ons", icon: Zap },
  { id: "settings", label: "Billing settings", icon: Settings2 },
];

export function BillingShell({ section = "overview" }: { section?: BillingSection }) {
  const [snapshot, setSnapshot] = useState<BillingSnapshot>(() => structuredClone(mockBillingSnapshot));
  const [interval, setInterval] = useState<BillingInterval>(snapshot.interval);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>, message: string) {
    await action();
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3500);
  }

  const plan = billingPlans.find((item) => item.id === snapshot.plan) ?? billingPlans[1]!;

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success" role="status">
          <BadgeCheck className="h-4 w-4" /> {notice}
        </div>
      ) : null}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <aside className="w-full shrink-0 xl:w-56">
          <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-surface/70 p-1.5 xl:block xl:space-y-1 xl:overflow-visible">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.id === "overview" ? "/billing" : `/billing/${item.id}`}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                    section === item.id ? "bg-primary text-white shadow-soft" : "text-secondary hover:bg-elevated hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
            <div className="hidden border-t border-border px-3 py-3 xl:block">
              <Link href="/billing/subscription" className="flex items-center justify-between text-xs text-secondary hover:text-foreground">
                Subscription <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          {section === "overview" ? <Overview snapshot={snapshot} plan={plan} onUpgrade={() => window.location.assign("/billing/plans")} /> : null}
          {section === "plans" ? (
            <Plans currentPlan={snapshot.plan} interval={interval} setInterval={setInterval} onChange={(next) => run(async () => { await changeBillingPlan(next, interval); setSnapshot((old) => ({ ...old, plan: next, interval })); }, "Plan selection saved — Stripe checkout will be connected here.")} />
          ) : null}
          {section === "usage" ? <Usage snapshot={snapshot} /> : null}
          {section === "invoices" ? <Invoices invoices={snapshot.invoices} /> : null}
          {section === "payment-methods" ? <Payments methods={snapshot.paymentMethods} onAdd={() => run(addPaymentMethod, "Payment method setup is ready for Stripe Elements.")} /> : null}
          {section === "addons" ? <Addons onBuy={(name) => run(() => buyAddon(name), `${name} added to your checkout.`)} /> : null}
          {section === "settings" ? <Settings snapshot={snapshot} onSave={(values) => run(() => updateBillingSettings(values), "Billing settings saved.")} /> : null}
          {section === "subscription" ? <Subscription status={snapshot.status} onAction={(action) => run(() => manageSubscription(action), `${action[0]!.toUpperCase()}${action.slice(1)} request saved.`)} /> : null}
        </main>
      </div>
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border/70 bg-surface/45 px-6 py-5 text-center shadow-soft backdrop-blur-xl">
        <div className="mx-auto flex w-fit items-center gap-2 text-sm font-medium text-muted">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-elevated text-[11px] font-bold italic text-secondary"
            aria-hidden
          >
            S
          </span>
          <span>Stripe Checkout — Coming Soon</span>
        </div>
        <p className="mt-2 text-xs text-muted">
          Secure online payments will be available soon through Stripe Checkout.
        </p>
      </section>
    </div>
  );
}

function Overview({ snapshot, plan, onUpgrade }: { snapshot: BillingSnapshot; plan: (typeof billingPlans)[number]; onUpgrade: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Billing overview</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Your workspace plan</h2><p className="mt-1 text-sm text-secondary">A clear view of your subscription, spend, and limits.</p></div>
        <Button onClick={onUpgrade} className="gap-2"><ArrowUpRight className="h-4 w-4" /> Upgrade plan</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card elevated className="overflow-hidden border-primary/30">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" aria-hidden />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row">
            <div><Badge variant="accent">Current plan</Badge><h3 className="mt-5 text-3xl font-semibold">{plan.name}<span className="ml-2 text-base font-normal text-secondary">/ month</span></h3><p className="mt-2 max-w-md text-sm text-secondary">{plan.description}</p></div>
            <div className="text-left sm:text-right"><p className="text-4xl font-semibold">${plan.monthlyPrice}<span className="text-sm font-normal text-secondary"> / mo</span></p><p className="mt-2 flex items-center gap-1.5 text-xs text-success sm:justify-end"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Active subscription</p></div>
          </div>
          <div className="relative mt-7 flex flex-wrap gap-5 border-t border-border pt-5 text-xs text-secondary"><span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-primary" />Renews {formatDate(snapshot.renewalDate)}</span><span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Secure billing</span></div>
        </Card>
        <Card className="flex flex-col justify-between"><div><p className="text-sm font-semibold">Need more capacity?</p><p className="mt-2 text-sm leading-6 text-secondary">Scale agents, events, storage, and seats without changing your workflow.</p></div><Link href="/billing/addons" className="mt-5 flex items-center gap-1 text-sm font-medium text-primary">Browse add-ons <ChevronRight className="h-4 w-4" /></Link></Card>
      </div>
      <section><SectionHeading title="Usage this month" action={<Link href="/billing/usage" className="text-xs font-medium text-primary">View details</Link>} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{snapshot.usage.map((metric) => <MetricCard key={metric.id} metric={metric} />)}</div></section>
      <div className="grid gap-4 lg:grid-cols-2"><Card><SectionHeading title="Recent invoices" action={<Link href="/billing/invoices" className="text-xs font-medium text-primary">View all</Link>} /><div className="space-y-1">{snapshot.invoices.slice(0, 3).map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)}</div></Card><Card><SectionHeading title="Payment method" action={<Link href="/billing/payment-methods" className="text-xs font-medium text-primary">Manage</Link>} />{snapshot.paymentMethods[0] ? <PaymentRow method={snapshot.paymentMethods[0]} /> : <Empty icon={CreditCard} title="No payment method" body="Add a card before your next renewal." action="Add payment method" />}</Card></div>
    </div>
  );
}

function Plans({ currentPlan, interval, setInterval, onChange }: { currentPlan: BillingPlanId; interval: BillingInterval; setInterval: (value: BillingInterval) => void; onChange: (plan: BillingPlanId) => void }) {
  return <div className="space-y-5"><SectionIntro eyebrow="Plans" title="Choose the right runway" body="Upgrade, downgrade, or switch billing intervals at any time. Changes are mocked until Stripe is connected." /><div className="inline-flex rounded-xl border border-border bg-surface p-1"><button className={`rounded-lg px-4 py-2 text-xs font-medium ${interval === "monthly" ? "bg-elevated text-foreground" : "text-secondary"}`} onClick={() => setInterval("monthly")}>Monthly</button><button className={`rounded-lg px-4 py-2 text-xs font-medium ${interval === "yearly" ? "bg-elevated text-foreground" : "text-secondary"}`} onClick={() => setInterval("yearly")}>Yearly <span className="ml-1 text-success">🎁 1 Month Free</span></button></div><div className="grid items-stretch gap-4 lg:grid-cols-3">{billingPlans.map((plan) => <Card key={plan.id} elevated={plan.popular} className={`flex h-full flex-col ${plan.popular ? "border-primary/50" : ""}`}>{plan.popular ? <Badge variant="accent" className="mb-4 w-fit">⭐ Most Popular</Badge> : null}<h3 className="text-xl font-semibold">{plan.name}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-secondary">{plan.description}</p><p className="mt-6 text-3xl font-semibold">${interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}<span className="text-xs font-normal text-secondary"> / {interval === "monthly" ? "month" : "year"}</span></p>{interval === "yearly" && plan.id !== "free" ? <p className="mt-1 text-xs text-success">🎁 1 Month Free</p> : null}<ul className="mt-6 flex-1 space-y-3 border-t border-border pt-5">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-secondary"><Check className="h-4 w-4 shrink-0 text-success" />{feature}</li>)}</ul><Button className="mt-6 w-full" variant={currentPlan === plan.id ? "secondary" : plan.popular ? "primary" : "secondary"} disabled={currentPlan === plan.id} onClick={() => onChange(plan.id)}>{currentPlan === plan.id ? "Current plan" : plan.monthlyPrice > (billingPlans.find((item) => item.id === currentPlan)?.monthlyPrice ?? 0) ? "Upgrade" : "Downgrade"}</Button></Card>)}</div><Card><SectionHeading title="Feature comparison" /><Comparison /></Card></div>;
}

function Usage({ snapshot }: { snapshot: BillingSnapshot }) {
  return <div className="space-y-5"><SectionIntro eyebrow="Usage dashboard" title="Know what is powering your workspace" body="Usage resets at the start of each billing period. These charts are representative mock data." /><div className="grid gap-4 lg:grid-cols-2">{snapshot.usage.map((metric) => <UsageCard key={metric.id} metric={metric} />)}</div><Card><SectionHeading title="Monthly activity" action={<Badge variant="default">Last 6 months</Badge>} /><div className="flex h-48 items-end gap-3 border-b border-border px-2 pt-5">{[34, 48, 42, 67, 58, 82, 74, 91, 76, 88, 68, 84].map((height, index) => <div key={index} className="group flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-primary/70 transition group-hover:bg-primary" style={{ height: `${height}%` }} /><span className="text-[10px] text-muted">{index % 2 === 0 ? `W${index / 2 + 1}` : ""}</span></div>)}</div></Card></div>;
}

function Invoices({ invoices }: { invoices: BillingSnapshot["invoices"] }) {
  return <div className="space-y-5"><SectionIntro eyebrow="Invoices" title="Your billing history" body="Download receipts and keep your finance team in sync." /><Card className="overflow-x-auto p-0">{invoices.length ? <table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-border text-xs text-muted"><tr><th className="px-6 py-4 font-medium">Invoice</th><th className="px-6 py-4 font-medium">Date</th><th className="px-6 py-4 font-medium">Amount</th><th className="px-6 py-4 font-medium">Status</th><th className="px-6 py-4" /></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b border-border last:border-0"><td className="px-6 py-4 font-medium">{invoice.id}</td><td className="px-6 py-4 text-secondary">{formatDate(invoice.date)}</td><td className="px-6 py-4">${invoice.amount.toFixed(2)}</td><td className="px-6 py-4"><Badge variant="success">{invoice.status}</Badge></td><td className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => window.alert("Mock PDF download") }><Download className="h-3.5 w-3.5" /> PDF</Button></td></tr>)}</tbody></table> : <Empty icon={FileText} title="No invoices yet" body="Invoices will appear here after your first payment." action="View plans" />}</Card></div>;
}

function Payments({ methods, onAdd }: { methods: PaymentMethod[]; onAdd: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [savedMethods, setSavedMethods] = useState(methods);
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><SectionIntro eyebrow="Payment methods" title="Payment details" body="Manage cards used for renewals and add-ons." /><Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Add card</Button></div><Card>{savedMethods.length ? <div className="space-y-3">{savedMethods.map((method) => <div key={method.id}><PaymentRow method={method} /><div className="mt-2 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setSavedMethods((current) => current.map((item) => ({ ...item, isDefault: item.id === method.id })))}>{method.isDefault ? "Default payment method" : "Make default"}</Button><Button size="sm" variant="ghost" onClick={() => setSavedMethods((current) => current.filter((item) => item.id !== method.id))}>Remove</Button></div></div>)}</div> : <Empty icon={CreditCard} title="No payment methods saved" body="Add a card to make future renewals and upgrades seamless." action="Add a payment method" onAction={() => setShowForm(true)} />}</Card>{showForm ? <Modal title="Add payment method" onClose={() => setShowForm(false)}><p className="text-sm leading-6 text-secondary">Stripe Elements will render your secure card form here once Stripe is approved.</p><Input className="mt-4" placeholder="Cardholder name" /><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={() => { onAdd(); setSavedMethods((current) => [...current, { id: `pm_mock_${Date.now()}`, brand: "Visa", last4: "4242", expiry: "12/29", isDefault: current.length === 0 }]); setShowForm(false); }}>Save card</Button></div></Modal> : null}</div>;
}

function Addons({ onBuy }: { onBuy: (name: string) => void }) {
  const storage = STORAGE_ADDONS.map((item) => ({ name: `Storage · ${item.label}`, detail: "Additional storage", price: item.monthlyPrice }));
  const addons = [...storage.map((item) => ({ ...item, icon: HardDrive })), { name: "Additional Workspace", detail: "$15 / month per Workspace", price: 15, icon: Layers3 }, { name: "Additional AI Agent", detail: "$5 / month per AI Agent", price: 5, icon: Sparkles }, { name: "Additional Audit Events", detail: "10,000 Audit Events", price: 19, icon: Activity }, { name: "Additional API Calls", detail: "100,000 API Calls", price: 29, icon: Zap }];
  return <div className="space-y-5"><SectionIntro eyebrow="Add-ons" title="Add capacity when you need it" body="Flexible monthly add-ons keep your plan predictable while your workspace grows." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{addons.map(({ name, detail, price, icon: Icon }) => <Card key={name} className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold">{name}</h3><p className="mt-1 text-sm text-secondary">{detail}</p><p className="mt-4 text-lg font-semibold">${price}<span className="ml-1 text-xs font-normal text-muted">/ month</span></p><Button size="sm" className="mt-4 w-full" onClick={() => onBuy(name)}>Add to checkout</Button></div></Card>)}</div></div>;
}

function Settings({ snapshot, onSave }: { snapshot: BillingSnapshot; onSave: (values: Record<string, string>) => void }) {
  const [values, setValues] = useState({ email: snapshot.billingEmail, company: "KorClaw Labs", taxId: "", country: "India", address: "" });
  return <div className="space-y-5"><SectionIntro eyebrow="Billing settings" title="Keep your records accurate" body="These details appear on invoices and receipts." /><Card><CardHeader><CardTitle>Billing information</CardTitle><CardDescription>Update your billing contact and company details.</CardDescription></CardHeader><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-secondary">Billing email<Input value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} className="mt-2" /></label><label className="text-sm text-secondary">Company name<Input value={values.company} onChange={(event) => setValues((current) => ({ ...current, company: event.target.value }))} className="mt-2" /></label><label className="text-sm text-secondary">Tax ID / GST<Input value={values.taxId} onChange={(event) => setValues((current) => ({ ...current, taxId: event.target.value }))} placeholder="Optional" className="mt-2" /></label><label className="text-sm text-secondary">Country<Input value={values.country} onChange={(event) => setValues((current) => ({ ...current, country: event.target.value }))} className="mt-2" /></label><label className="text-sm text-secondary sm:col-span-2">Billing address<Input value={values.address} onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))} placeholder="Street, city, state, postal code" className="mt-2" /></label></div><Button className="mt-5" onClick={() => onSave(values)}>Save changes</Button></Card></div>;
}

function Subscription({ status, onAction }: { status: SubscriptionStatus; onAction: (action: "upgrade" | "downgrade" | "cancel" | "pause" | "reactivate") => void }) {
  return <div className="space-y-5"><SectionIntro eyebrow="Subscription" title="Manage your plan" body="Your subscription controls are ready for Stripe Customer Portal integration." /><Card elevated><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><Badge variant="success">{status}</Badge><h3 className="mt-4 text-xl font-semibold">Pro plan</h3><p className="mt-1 text-sm text-secondary">Renews September 1, 2026 · $59 / month</p></div><Link href="/billing/plans"><Button variant="secondary">Change plan</Button></Link></div><div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-2"><Button variant="secondary" className="justify-start gap-2" onClick={() => onAction("pause")}><Pause className="h-4 w-4" /> Pause subscription</Button><Button variant="secondary" className="justify-start gap-2" onClick={() => onAction("reactivate")}><Play className="h-4 w-4" /> Reactivate subscription</Button><Button variant="danger" className="justify-start gap-2" onClick={() => onAction("cancel")}><X className="h-4 w-4" /> Cancel subscription</Button></div></Card></div>;
}

function MetricCard({ metric }: { metric: BillingSnapshot["usage"][number] }) { const percent = Math.round((metric.used / metric.limit) * 100); return <Card className="p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs text-secondary">{metric.label}</span><span className="text-xs font-semibold">{percent}%</span></div><p className="mt-3 text-xl font-semibold">{metric.used.toLocaleString()}<span className="ml-1 text-[10px] font-normal text-muted">/ {metric.limit.toLocaleString()}</span></p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated"><div className={`h-full rounded-full ${metric.color}`} style={{ width: `${percent}%` }} /></div></Card>; }
function UsageCard({ metric }: { metric: BillingSnapshot["usage"][number] }) { return <Card><div className="flex items-start justify-between"><div><p className="text-sm font-semibold">{metric.label}</p><p className="mt-1 text-xs text-secondary">Current billing period</p></div><div className="rounded-xl bg-elevated p-2"><Activity className="h-4 w-4 text-primary" /></div></div><div className="mt-7 flex items-end justify-between"><p className="text-3xl font-semibold">{metric.used.toLocaleString()}</p><p className="text-xs text-secondary">of {metric.limit.toLocaleString()} {metric.unit}</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-elevated"><div className={`h-full rounded-full ${metric.color}`} style={{ width: `${Math.round((metric.used / metric.limit) * 100)}%` }} /></div></Card>; }
function InvoiceRow({ invoice }: { invoice: BillingSnapshot["invoices"][number] }) { return <div className="flex items-center justify-between rounded-xl px-2 py-3 hover:bg-elevated"><div><p className="text-sm font-medium">{invoice.id}</p><p className="mt-1 text-xs text-muted">{formatDate(invoice.date)}</p></div><div className="text-right"><p className="text-sm font-medium">${invoice.amount.toFixed(2)}</p><Badge variant="success" className="mt-1">{invoice.status}</Badge></div></div>; }
function PaymentRow({ method }: { method: PaymentMethod }) { return <div className="flex items-center gap-3 rounded-xl border border-border p-4"><div className="flex h-10 w-14 items-center justify-center rounded-lg bg-elevated text-xs font-bold">{method.brand}</div><div className="flex-1"><p className="text-sm font-medium">{method.brand} ending in {method.last4}</p><p className="mt-1 text-xs text-secondary">Expires {method.expiry}</p></div>{method.isDefault ? <Badge variant="accent">Default</Badge> : null}<MoreHorizontal className="h-4 w-4 text-muted" /></div>; }
function Empty({ icon: Icon, title, body, action, onAction }: { icon: typeof CreditCard; title: string; body: string; action: string; onAction?: () => void }) { return <div className="flex flex-col items-center justify-center py-12 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-elevated text-muted"><Icon className="h-5 w-5" /></div><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-secondary">{body}</p><Button variant="secondary" size="sm" className="mt-5" onClick={onAction}>{action}</Button></div>; }
function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) { return <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">{body}</p></div>; }
function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) { return <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{title}</h3>{action}</div>; }
function Comparison() { const rows = [["Workspaces", "1", "5", "20"], ["AI agents", "2", "10", "50"], ["Audit events", "250 / mo", "5K / mo", "15K / mo"], ["API calls", "—", "50K / mo", "250K / mo"], ["Storage", "5 GB", "50 GB", "250 GB"], ["Admin controls", "—", "—", "Advanced"]]; return <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted"><th className="p-3">Capability</th><th className="p-3">Free</th><th className="p-3 text-primary">Pro</th><th className="p-3">Business</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]} className="border-b border-border last:border-0"><th className="p-3 font-medium">{row[0]}</th>{row.slice(1).map((value) => <td className="p-3 text-secondary" key={value}>{value}</td>)}</tr>)}</tbody></table></div>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-elevated"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-foreground" aria-label="Close"><X className="h-4 w-4" /></button></div>{children}</div></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }

