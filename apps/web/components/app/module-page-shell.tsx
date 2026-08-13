import type { ReactNode } from "react";
import { Badge } from "@repo/ui/badge";
import { ModuleNav, type ModuleNavItem } from "./module-nav";

export function ModulePageShell({
  badge,
  title,
  description,
  actions,
  navItems,
  children,
  maxWidth = "max-w-6xl",
}: {
  badge: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  navItems?: ModuleNavItem[];
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className={`mx-auto flex w-full ${maxWidth} flex-col gap-5 sm:gap-6`}>
      <div className="relative overflow-hidden rounded-[24px] border border-border/70 bg-[#0f0f15]/90 p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.1),transparent_50%)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2.5">
            <Badge variant="accent">{badge}</Badge>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      </div>
      {navItems ? <ModuleNav items={navItems} /> : null}
      {children}
    </div>
  );
}
