// app/booking/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// The old booking form is replaced by the room → checkout flow.
export default function BookingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/rooms');
  }, [router]);

  return null;
}