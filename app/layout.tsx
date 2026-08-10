// app/layout.tsx
'use client'; // required for usePathname

import { Inter, Playfair_Display } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./components/ThemeProvider";

// ✅ 1. Global Sans-Serif font (Inter)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// ✅ 2. Optional Serif font for elegant headings
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased min-h-screen flex flex-col transition-colors duration-300`}
        style={{ fontFamily: 'var(--font-inter), sans-serif' }} // ✅ This forces Inter globally
        suppressHydrationWarning
      >
        <ThemeProvider>
          {/* ─── Navbar (hidden on dashboard) ─── */}
          {!isDashboard && <Navbar />}

          {/* ─── Main content ─── */}
          <main className={`flex-1 ${!isDashboard ? 'pt-20' : 'pt-0'}`}>
            {children}
          </main>

          {/* ─── Footer (hidden on dashboard) ─── */}
          {!isDashboard && <Footer />}
        </ThemeProvider>
      </body>
    </html>
  );
}