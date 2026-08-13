'use client';

import { Inter, Playfair_Display } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./components/ThemeProvider";
import { AlertProvider } from "./context/AlertContext";
import AlertModal from "./context/AlertModal";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
  const isDashboard =
    pathname?.startsWith('/dashboard') && !pathname?.startsWith('/dashboard/bookings');

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased min-h-screen flex flex-col transition-colors duration-300`}
        style={{ fontFamily: 'var(--font-inter), sans-serif' }}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AlertProvider>
            {!isDashboard && <Navbar />}
            <main className={`flex-1 ${!isDashboard ? 'pt-20' : 'pt-0'}`}>
              {children}
            </main>
            {!isDashboard && <Footer />}
            <AlertModal />
          </AlertProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}