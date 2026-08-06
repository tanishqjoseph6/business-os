import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { VanderBaseCursor } from "../components/cursor/vanderbase-cursor";
import { VANDERBASE_SOCIAL_PROFILES } from "../lib/social";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://vanderbase.com",
  ),
  applicationName: "VanderBase",
  title: {
    default: "VanderBase — The AI-Native Business OS",
    template: "%s | VanderBase",
  },
  description: "The AI-native Business OS for modern businesses.",
  keywords: [
    "VanderBase",
    "AI operating system",
    "CRM",
    "AI inbox",
    "content OS",
    "workspace",
  ],
  authors: [{ name: "VanderBase", url: "https://vanderbase.com" }],
  creator: "VanderBase",
  publisher: "VanderBase",
  category: "business",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VanderBase — The AI-Native Business OS",
    description: "The AI-native Business OS for modern businesses.",
    url: "/",
    siteName: "VanderBase",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/branding/vanderbase-og.png",
        width: 1200,
        height: 630,
        alt: "VanderBase — The AI-Native Business OS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VanderBase — The AI-Native Business OS",
    description: "The AI-native Business OS for modern businesses.",
    images: ["/branding/vanderbase-og.png"],
  },
  icons: {
    icon: [
      { url: "/branding/vanderbase-icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/branding/vanderbase-icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/vanderbase-icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: {
      url: "/branding/vanderbase-icon-180.png",
      sizes: "180x180",
      type: "image/png",
    },
    shortcut: "/branding/vanderbase-icon-32.png",
  },
  other: {
    "msapplication-TileColor": "#0B0B0B",
    "theme-color": "#0B0B0B",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VanderBase",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "VanderBase",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: "The AI-native Business OS for modern businesses.",
      brand: {
        "@type": "Brand",
        name: "VanderBase",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "VanderBase",
      url: "https://vanderbase.com",
      email: "hello@vanderbase.com",
      sameAs: [...VANDERBASE_SOCIAL_PROFILES],
    },
  ];

  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <VanderBaseCursor />
        {children}
      </body>
    </html>
  );
}
