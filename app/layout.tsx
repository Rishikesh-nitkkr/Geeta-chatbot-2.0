import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "KRISHNA AI - Divine Life Guidance System",
  description: "Ask life questions and receive Bhagavad Gita guidance with voice, avatar, meditation, quotes, reading, gallery, and growth tracking.",
  applicationName: "KRISHNA AI",
  keywords: ["Bhagavad Gita", "Krishna AI", "spiritual guidance", "meditation", "life advice"],
  authors: [{ name: "KRISHNA AI" }],
  openGraph: {
    title: "KRISHNA AI - Divine Life Guidance System",
    description: "A premium spiritual AI platform for Gita-based life guidance, voice, meditation, and growth.",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05020d",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
