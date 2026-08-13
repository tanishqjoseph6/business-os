"use client";

import { useMounted } from "../../lib/use-mounted";
import { formatRelative } from "./format";

export function ClientRelativeTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const mounted = useMounted();
  return (
    <time dateTime={iso} className={className}>
      {mounted ? formatRelative(iso, Date.now()) : formatDateTimeSafe(iso)}
    </time>
  );
}

function formatDateTimeSafe(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
