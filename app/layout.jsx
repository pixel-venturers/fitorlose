import { Geist, Geist_Mono } from "next/font/google";
import { SITE } from "@/config/site";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { JsonLd } from "@/components/common/JsonLd";
import PostHogUserIdentifier from "@/components/PostHogUserIdentifier";
import UserSync from "@/components/UserSync";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "fitness challenge",
    "commitment device",
    "weight loss challenge",
    "running challenge",
    "put money on fitness goals",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  icons: { icon: "/favicon.ico" },
};

export const viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

// Site-wide structured data (Organization + WebSite) for rich results.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/logo-lg.png`,
      description: SITE.description,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      publisher: { "@id": `${SITE.url}/#organization` },
    },
  ],
};

export default function Layout({ children }) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <JsonLd data={structuredData} />
        <ClerkProvider appearance={{ theme: shadcn }}>
          <PostHogUserIdentifier />
          <UserSync />
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="bottom-right" richColors />
        </ClerkProvider>
      </body>
    </html>
  );
}
