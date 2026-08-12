"use client";

import { useMounted } from "../../lib/use-mounted";

type ClientTimeProps = {
  iso: string;
  className?: string;
};

/** Renders locale-aware time only after mount to avoid SSR/client mismatches. */
export function ClientTime({ iso, className }: ClientTimeProps) {
  const mounted = useMounted();

  return (
    <time
      dateTime={iso}
      className={className}
      title={mounted ? new Date(iso).toLocaleString() : undefined}
    >
      {mounted
        ? new Date(iso).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })
        : "\u00a0"}
    </time>
  );
}
