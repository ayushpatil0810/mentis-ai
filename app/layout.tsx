import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mentis AI - Next-generation AI Assistant",
    template: "%s | Mentis AI",
  },
  description: "An elegant, fast, and feature-rich AI assistant powered by Mentis. Experience seamless conversations with multiple AI models in a secure environment.",
  openGraph: {
    title: "Mentis AI - Next-generation AI Assistant",
    description: "An elegant, fast, and feature-rich AI assistant powered by Mentis. Experience seamless conversations with multiple AI models in a secure environment.",
    url: "https://mentis.ayushpatil.in",
    siteName: "Mentis AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Mentis AI Logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentis AI - Next-generation AI Assistant",
    description: "An elegant, fast, and feature-rich AI assistant powered by Mentis. Experience seamless conversations with multiple AI models in a secure environment.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
