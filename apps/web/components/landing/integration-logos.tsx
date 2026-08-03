import type { ReactNode } from "react";
import type { SimpleIcon } from "simple-icons";
import {
  siAirtable,
  siAnthropic,
  siAsana,
  siBrevo,
  siCalendly,
  siClickup,
  siCloudflare,
  siDiscord,
  siDropbox,
  siFacebook,
  siFigma,
  siGithub,
  siGitlab,
  siGmail,
  siGoogle,
  siGooglecalendar,
  siGoogledrive,
  siGooglegemini,
  siHubspot,
  siInstagram,
  siIntercom,
  siJira,
  siLinear,
  siMailchimp,
  siMeta,
  siMongodb,
  siN8n,
  siNotion,
  siPostgresql,
  siRazorpay,
  siRedis,
  siResend,
  siShopify,
  siStripe,
  siSupabase,
  siTiktok,
  siTrello,
  siVercel,
  siWoocommerce,
  siX,
  siYoutube,
  siZapier,
  siZoom,
} from "simple-icons";

const ICON_MAP: Record<string, SimpleIcon> = {
  google: siGoogle,
  gmail: siGmail,
  googlecalendar: siGooglecalendar,
  "google-calendar": siGooglecalendar,
  googledrive: siGoogledrive,
  "google-drive": siGoogledrive,
  discord: siDiscord,
  notion: siNotion,
  github: siGithub,
  gitlab: siGitlab,
  stripe: siStripe,
  razorpay: siRazorpay,
  meta: siMeta,
  instagram: siInstagram,
  facebook: siFacebook,
  x: siX,
  youtube: siYoutube,
  tiktok: siTiktok,
  anthropic: siAnthropic,
  googlegemini: siGooglegemini,
  dropbox: siDropbox,
  zoom: siZoom,
  cloudflare: siCloudflare,
  vercel: siVercel,
  supabase: siSupabase,
  postgresql: siPostgresql,
  mongodb: siMongodb,
  redis: siRedis,
  hubspot: siHubspot,
  zapier: siZapier,
  n8n: siN8n,
  figma: siFigma,
  linear: siLinear,
  clickup: siClickup,
  trello: siTrello,
  asana: siAsana,
  jira: siJira,
  calendly: siCalendly,
  resend: siResend,
  mailchimp: siMailchimp,
  brevo: siBrevo,
  intercom: siIntercom,
  airtable: siAirtable,
  shopify: siShopify,
  woocommerce: siWoocommerce,
};

/** Brand-accurate fallbacks for icons removed from the simple-icons package. */
const CUSTOM_SVGS: Record<string, { viewBox: string; content: ReactNode }> = {
  slack: {
    viewBox: "0 0 24 24",
    content: (
      <>
        <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" />
        <path fill="#E01E5A" d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
        <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" />
        <path fill="#36C5F0" d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
        <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" />
        <path fill="#2EB67D" d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
        <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" />
        <path fill="#ECB22E" d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </>
    ),
  },
  linkedin: {
    viewBox: "0 0 24 24",
    content: <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
  },
  openai: {
    viewBox: "0 0 24 24",
    content: <path fill="currentColor" d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.938 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .742 7.097 5.98 5.98 0 0 0 .511 4.936 6.051 6.051 0 0 0 6.515 2.902A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />,
  },
  microsoft: {
    viewBox: "0 0 24 24",
    content: (
      <>
        <path fill="#F25022" d="M1 1h10v10H1z" />
        <path fill="#7FBA00" d="M13 1h10v10H13z" />
        <path fill="#00A4EF" d="M1 13h10v10H1z" />
        <path fill="#FFB900" d="M13 13h10v10H13z" />
      </>
    ),
  },
  microsoftoutlook: {
    viewBox: "0 0 24 24",
    content: (
      <>
        <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.154-.352.23-.58.23h-8.547v-6.959l1.6 1.229c.098.074.2.111.308.111.107 0 .21-.037.307-.111l6.15-4.554z" />
        <path fill="#0078D4" d="M23.762 7.733 15.588 13.78l-1.6-1.229V7.387h9.774c.228 0 .422.077.58.23.158.153.238.347.238.577z" />
        <path fill="#28A8EA" d="M14.988 14.551 8.547 18.67H.58c-.228 0-.422-.076-.58-.23-.158-.152-.238-.346-.238-.576V7.387c0-.23.08-.424.238-.577.158-.153.352-.23.58-.23h7.967l6.441 4.119z" />
        <path fill="#0078D4" d="M8.547 7.387v6.959l6.441-4.119V7.387z" />
        <path fill="#50D9FF" d="M8.547 7.387H.58c-.228 0-.422.077-.58.23C.08 7.77 0 7.964 0 8.194v8.9l8.547-6.559V7.387z" />
        <path fill="#0364B8" d="M8.547 18.67H.58c-.228 0-.422-.076-.58-.23-.158-.152-.238-.346-.238-.576V7.387h8.785v11.283z" />
        <path fill="#0078D4" d="M14.988 14.551v4.119H8.547V7.387h6.441v7.164z" />
        <ellipse fill="#0078D4" cx="5.5" cy="12" rx="3.5" ry="4" />
      </>
    ),
  },
  onedrive: {
    viewBox: "0 0 24 24",
    content: <path fill="#0078D4" d="M10.5 4.5c1.657 0 3.146.736 4.157 1.902A4.978 4.978 0 0 1 19.5 6c2.761 0 5 2.239 5 5 0 .414-.05.817-.145 1.203.595.45.945 1.146.945 1.897 0 1.381-1.119 2.5-2.5 2.5H4.5c-1.933 0-3.5-1.567-3.5-3.5 0-1.657 1.157-3.043 2.707-3.403A4.496 4.496 0 0 1 10.5 4.5z" />,
  },
  amazonaws: {
    viewBox: "0 0 24 24",
    content: (
      <>
        <path fill="#FF9900" d="M6.763 17.664c-.346 0-.623-.28-.623-.623 0-.346.28-.623.623-.623.346 0 .623.28.623.623 0 .346-.28.623-.623.623zm5.314 0c-.346 0-.623-.28-.623-.623 0-.346.28-.623.623-.623.346 0 .623.28.623.623 0 .346-.28.623-.623.623z" />
        <path fill="#252F3E" d="M17.634 16.078c-4.734 2.203-9.768 3.305-15.102 3.305-.604 0-1.205-.028-1.8-.083-.12-.01-.24.07-.25.19-.01.12.07.24.19.25 6.64.62 13.2-.52 18.2-3.4.11-.06.15-.19.09-.3-.06-.11-.19-.15-.3-.09-.01 0-.01.01-.028.127zm.75-1.35c-.15-.19-.42-.22-.61-.07-4.84 3.75-11.02 4.57-17.28 2.51-.24-.08-.49.05-.57.29-.08.24.05.49.29.57 6.77 2.2 13.35 1.34 18.55-2.67.19-.15.22-.42.07-.61l-.45-.62z" />
        <path fill="#252F3E" d="M18.884 13.478c-.19-.15-.47-.12-.62.07-4.4 5.4-11.2 6.57-17.5 3.6-.23-.11-.5 0-.61.23-.11.23 0 .5.23.61 6.8 3.2 14.1 1.95 18.9-3.75.15-.19.12-.47-.07-.62l-.33-.14z" />
      </>
    ),
  },
  salesforce: {
    viewBox: "0 0 24 24",
    content: <path fill="#00A1E0" d="M10.006 5.415a4.195 4.195 0 0 1 3.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.97 0 5.4 2.43 5.4 5.402 0 2.97-2.43 5.4-5.4 5.4a4.64 4.64 0 0 1-.84-.075 3.293 3.293 0 0 1-3.045 2.055 4.37 4.37 0 0 1-.855-.082 3.702 3.702 0 0 1-3.495 2.48 3.702 3.702 0 0 1-3.6-2.85 2.953 2.953 0 0 1-.54.052c-1.635 0-2.97-1.335-2.97-2.97 0-.45.105-.885.285-1.275a4.086 4.086 0 0 1-1.05-2.745c0-2.25 1.83-4.08 4.08-4.08.675 0 1.305.165 1.875.45a4.196 4.196 0 0 1 3.33-1.68z" />,
  },
  twilio: {
    viewBox: "0 0 24 24",
    content: <path fill="#F22F46" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18.75c-3.728 0-6.75-3.022-6.75-6.75S8.272 5.25 12 5.25s6.75 3.022 6.75 6.75-3.022 6.75-6.75 6.75zm0-10.5a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5z" />,
  },
};

export function IntegrationLogo({ id, className = "h-9 w-9" }: { id: string; className?: string }) {
  const icon = ICON_MAP[id];
  if (icon) {
    return (
      <svg role="img" viewBox="0 0 24 24" className={className} aria-hidden>
        <path d={icon.path} fill={`#${icon.hex}`} />
      </svg>
    );
  }

  const custom = CUSTOM_SVGS[id === "outlook" ? "microsoftoutlook" : id];
  if (custom) {
    return (
      <svg role="img" viewBox={custom.viewBox} className={className} aria-hidden>
        {custom.content}
      </svg>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-primary ${className}`}>
      ?
    </span>
  );
}
