import { IntegrationLogo } from "../landing/integration-logos";

export function IntegrationProviderLogo({
  provider,
  name,
}: {
  provider: string;
  name: string;
}) {
  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-soft ring-1 ring-white/5 transition duration-300 group-hover:scale-105 group-hover:bg-white/[0.08]"
      title={`${name} official logo`}
    >
      <IntegrationLogo id={provider} className="h-7 w-7" />
    </div>
  );
}
