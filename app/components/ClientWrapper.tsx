// app/components/ClientWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

interface ClientWrapperProps {
  children: React.ReactNode;
  hotelName?: string;
  logoUrl?: string | null;
  phone?: string;
  email?: string;
  address?: string;
}

export default function ClientWrapper({
  children,
  hotelName = 'Jalo Hotel',
  logoUrl = null,
  phone = 'N/A',
  email = 'N/A',
  address = 'N/A',
}: ClientWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // ✅ Fixed: returns null instead of empty return
  }

  return (
    <div>
      <Navbar hotelName={hotelName} logoUrl={logoUrl} />
      <main className="flex-1 pt-20">{children}</main>
      <Footer hotelName={hotelName} phone={phone} email={email} address={address} />
    </div>
  );
}