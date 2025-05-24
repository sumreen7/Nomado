import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";

export const metadata: Metadata = {
  title: "Nomado - Travel Planning Assistant",
  description: "AI-powered travel planning made simple",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="bg-gradient-to-b from-primary-50 to-secondary-50 min-h-screen">
        <nav className="bg-white/70 backdrop-blur-md border-b border-gray-200 fixed w-full z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    Nomado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="pt-16 min-h-screen">
          {children}
        </main>
        
        <footer className="bg-white/70 backdrop-blur-md border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Nomado. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
