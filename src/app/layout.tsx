import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import ClientAppRoot from "../components/ClientAppRoot";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const canonicalDescription =
  "Track flights, airports, aircraft history, delays, and live family updates.";

function siteUrl(): URL {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv);
    } catch {
      /* fall through */
    }
  }
  if (process.env.VERCEL_URL?.trim()) {
    return new URL(`https://${process.env.VERCEL_URL.trim()}`);
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Flight Tracker — Live Airport & Flight Status",
    template: "%s | Flight Tracker",
  },
  description: canonicalDescription,
  applicationName: "Flight Tracker",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: [{ url: "/icons/favicon.ico", type: "image/x-icon" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Flight Tracker",
    title: "Flight Tracker — Live Airport & Flight Status",
    description: canonicalDescription,
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Flight Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flight Tracker — Live Airport & Flight Status",
    description: canonicalDescription,
    images: ["/icons/icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Flight Tracker",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <ClientAppRoot>{children}</ClientAppRoot>
      </body>
    </html>
  );
}
