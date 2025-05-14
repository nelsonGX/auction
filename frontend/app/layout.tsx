import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nelson's Auction House",
  description: "A real-time auction platform for sequential item bidding."
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
        
        <footer className="mt-auto py-8 px-6 border-t border-zinc-800 bg-zinc-900">
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start">
              <Link 
          href="/" 
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
          Create New Auction
              </Link>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 text-zinc-400">
              <p>© {new Date().getFullYear()} Nelson&apos;s Auction House</p>
              <a 
          href="https://github.com/nelsonGX/auction" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-zinc-200 transition-colors p-1.5 rounded-md hover:bg-zinc-800/50"
              >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          GitHub
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
