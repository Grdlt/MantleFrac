import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/providers/WalletProvider";
import { AuthProvider } from "./components/AuthContext";
import ConditionalHeader from "./components/ConditionalHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MantleFrac - RWA Fractionalization Platform",
  description: "Fractionalize your NFTs and RWA tokens on Mantle Network",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-google-analytics-opt-out="">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark bg-[#08080c] min-h-screen`}
      >
        <WalletProvider>
          <AuthProvider>
            <ConditionalHeader />
            {children}
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}

