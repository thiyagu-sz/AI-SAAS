import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    icon: "/quicknotes-logo.svg",
    apple: "/quicknotes-logo.svg",
  },
  openGraph: {
    title: "QuickNotes - AI Study Assistant",
    description: "Transform your documents into organized study materials with AI.",
    images: [
      {
        url: "/quicknotes-logo.svg",
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
    images: ["/quicknotes-logo.svg"],
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-display antialiased`}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
