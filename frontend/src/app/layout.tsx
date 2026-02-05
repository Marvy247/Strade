import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ConnectProvider } from "@stacks/connect-react";
import { userSession } from "@/lib/stacks";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Strade - Decentralized Marketplace on Stacks",
  description: "Buy and sell goods securely on the blockchain. A decentralized marketplace with escrow, dispute resolution, and reputation system built on Stacks.",
  keywords: ["blockchain", "marketplace", "stacks", "bitcoin", "decentralized", "web3", "crypto"],
  authors: [{ name: "Strade Team" }],
  openGraph: {
    title: "Strade - Decentralized Marketplace",
    description: "Buy and sell goods securely on the blockchain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <ConnectProvider
          userSession={userSession}
          appDetails={{
            name: 'Strade',
            icon: typeof window !== 'undefined' ? window.location.origin + '/favicon.ico' : '',
          }}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </ConnectProvider>
      </body>
    </html>
  );
}
