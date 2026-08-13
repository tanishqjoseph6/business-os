export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMetric(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "No time set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

/** Pure relative formatter — pass `nowMs` for deterministic SSR. */
export function formatRelative(value: string, nowMs = 0) {
  const date = new Date(value);
  const base = nowMs || date.getTime();
  const diffMs = base - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(value);
}

export function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function displayNameFromEmail(email: string | null | undefined) {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "there";
  const token = local.split(/[._-]/)[0] ?? local;
  if (!token) return "there";
  return token.charAt(0).toUpperCase() + token.slice(1);
}
