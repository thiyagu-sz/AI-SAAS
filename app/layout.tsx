import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuickNotes - AI Study Assistant",
  description: "AI-powered study notes and summaries. Transform your documents into organized study materials.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=5", type: "image/x-icon" },
      { url: "/favicon.png?v=5", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png?v=5", sizes: "16x16", type: "image/png" }
    ],
    apple: [
      { url: "/favicon.png?v=5", sizes: "180x180", type: "image/png" }
    ],
  },
  openGraph: {
    title: "QuickNotes - AI Study Assistant",
    description: "Transform your documents into organized study materials with AI.",
    images: [
      {
        url: "/applogo.png?v=3",
        width: 256,
        height: 256,
        alt: "QuickNotes Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "QuickNotes",
    description: "AI-powered study notes and summaries",
    images: ["/applogo.png?v=3"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, viewport-fit=cover, user-scalable=yes" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=5" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png?v=5" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png?v=5" />
        <link rel="shortcut icon" href="/favicon.ico?v=5" />
        <link rel="apple-touch-icon" href="/favicon.png?v=5" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QuickNotes" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-display antialiased`}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
