import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Modern Auction Platform",
  description: "A real-time auction platform for sequential item bidding with dark mode",
  themeColor: "#18181b", // zinc-900
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex flex-col`}
      >
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        
        <footer className="mt-auto py-6 px-4 border-t border-zinc-800 text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} Nelson&apos;s Auction.</p>
        </footer>
      </body>
    </html>
  );
}
