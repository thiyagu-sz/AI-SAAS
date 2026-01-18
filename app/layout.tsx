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
    icon: "/dominlogo.png",
    apple: "/dominlogo.png",
  },
  openGraph: {
    title: "QuickNotes - AI Study Assistant",
    description: "Transform your documents into organized study materials with AI.",
    images: [
      {
        url: "/dominlogo.png",
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
    images: ["/dominlogo.png"],
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
