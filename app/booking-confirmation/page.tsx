// app/booking-confirmation/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GuestIcon, BedIcon } from '../components/Icons';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

// ─── Loading Fallback ──────────────────────────────────
function LoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE, padding: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', border: `4px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#666666', letterSpacing: '0.05em', fontSize: '12px', textTransform: 'uppercase' }}>Loading confirmation...</p>
      </div>
    </div>
  );
}

// ─── Status config ──────────────────────────────────
type StatusConfig = {
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  iconBg: string;
  iconEmoji: string;
  title: string;
  subtitle: string;
  badgeText: string;
  steps: { title: string; desc: string }[];
};

function getStatusConfig(status: string): StatusConfig {
  if (status === 'verified') {
    return {
      badgeBg: 'rgba(34,197,94,0.12)',
      badgeColor: '#16A34A',
      badgeBorder: 'rgba(34,197,94,0.3)',
      iconBg: 'rgba(34,197,94,0.15)',
      iconEmoji: '✅',
      title: 'Booking Confirmed!',
      subtitle: 'Your payment was verified and your room is reserved.',
      badgeText: 'Payment Verified',
      steps: [
        { title: 'All set!', desc: 'Your booking is fully confirmed. We look forward to welcoming you.' },
        { title: 'Confirmation email', desc: 'A confirmation will be sent to your email shortly.' },
        { title: 'Manage your booking', desc: 'View or cancel anytime from your dashboard.' },
      ],
    };
  }
  if (status === 'pending') {
    return {
      badgeBg: 'rgba(234,179,8,0.12)',
      badgeColor: '#A16207',
      badgeBorder: 'rgba(234,179,8,0.3)',
      iconBg: 'rgba(234,179,8,0.15)',
      iconEmoji: '⏳',
      title: 'Payment Pending',
      subtitle: "We're still verifying your payment with the bank. This usually takes a moment.",
      badgeText: 'Verifying Payment',
      steps: [
        { title: 'Verification in progress', desc: 'Our system is confirming your payment with Verify.ET.' },
        { title: 'You will be notified', desc: "You'll receive an email once it's confirmed." },
        { title: 'Check back soon', desc: 'You can check the status in your dashboard anytime.' },
      ],
    };
  }
  // failed / unverified / unknown
  return {
    badgeBg: 'rgba(239,68,68,0.12)',
    badgeColor: '#B91C1C',
    badgeBorder: 'rgba(239,68,68,0.3)',
    iconBg: 'rgba(239,68,68,0.15)',
    iconEmoji: '⚠️',
    title: 'Action Required',
    subtitle: "We couldn't automatically verify your payment. Our team will review it manually.",
    badgeText: 'Needs Review',
    steps: [
      { title: 'Our team is on it', desc: 'We will review your payment manually within 24 hours.' },
      { title: 'Keep your receipt', desc: 'Have your payment receipt ready in case we contact you.' },
      { title: 'Questions?', desc: 'Contact us if you need help — details below.' },
    ],
  };
}

// ─── Confirmation Content ─────────────────────────────
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [bookingData, setBookingData] = useState<any>(null);
  const [supportPhone, setSupportPhone] = useState<string>('');
  const [supportEmail, setSupportEmail] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // ─── Responsive ───
  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth < 768;

  // ─── Read URL params ───
  useEffect(() => {
    const params = {
      name: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      totalPrice: searchParams.get('totalPrice') || '',
      roomName: searchParams.get('roomName') || '',
      paymentMethod: searchParams.get('paymentMethod') || 'bank_transfer',
      paymentStatus: searchParams.get('paymentStatus') || 'pending',
    };
    setBookingData(params);
  }, [searchParams]);

  // ─── Fetch support contact from Strapi ───
  useEffect(() => {
    async function fetchSupport() {
      try {
        const res = await fetch(`${STRAPI_URL}/api/payment-method?populate=*`);
        const json = await res.json();
        const pm = json?.data?.attributes || json?.data;
        if (pm?.support_phone) setSupportPhone(pm.support_phone);
        if (pm?.support_email) setSupportEmail(pm.support_email);
      } catch {
        /* ignore */
      }
    }
    fetchSupport();
  }, []);

  // ─── Check login status ───
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsLoggedIn(!!localStorage.getItem('strapi_token'));
  }, []);

  if (!bookingData) return <LoadingFallback />;

  const status = getStatusConfig(bookingData.paymentStatus);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, color: '#1A1A1A', paddingTop: isMobile ? '5rem' : '6.5rem' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .gold-divider {
          width: 4rem;
          height: 0.25rem;
          background: linear-gradient(90deg, #C8A87C 0%, #E8D5B8 100%);
          border-radius: 9999px;
          margin: 1rem auto 0;
        }
      `}</style>

      <section style={{ padding: '2rem 1rem 4rem', maxWidth: '768px', margin: '0 auto' }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '1.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem',
          }}
        >
          {/* ─── Status Icon ─── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                background: status.iconBg,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                animation: 'bounce-slow 2s ease-in-out infinite',
              }}
            >
              {status.iconEmoji}
            </div>
          </div>

          {/* ─── Title + subtitle ─── */}
          <h1
            style={{
              fontSize: isMobile ? '1.7rem' : '2rem',
              fontWeight: 700,
              color: DARK_NAVY,
              textAlign: 'center',
              marginBottom: '0.5rem',
            }}
          >
            {status.title}
          </h1>
          <p
            style={{
              color: '#666666',
              textAlign: 'center',
              fontSize: '0.95rem',
              marginBottom: '1rem',
              lineHeight: 1.5,
            }}
          >
            {status.subtitle}
          </p>

          {/* ─── Status badge ─── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <span
              style={{
                background: status.badgeBg,
                color: status.badgeColor,
                border: `1px solid ${status.badgeBorder}`,
                padding: '0.35rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
              }}
            >
              {status.badgeText}
            </span>
          </div>

          <div className="gold-divider" style={{ margin: '0 auto 1.5rem' }} />

          {/* ─── Booking Details ─── */}
          <div style={{ background: '#F8F8F8', borderRadius: '1rem', padding: isMobile ? '1rem' : '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.75rem' }}>Booking Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '0.5rem 0' : '0.75rem 1rem' }}>
              <div>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Guest Name</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GuestIcon size={16} color={DARK_NAVY} /> {bookingData.name || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Email</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY, wordBreak: 'break-all' }}>{bookingData.email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Room</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BedIcon size={16} color={DARK_NAVY} /> {bookingData.roomName || 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Payment</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>Bank Transfer</p>
              </div>
              <div>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Check-in</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{formatDate(bookingData.checkIn)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Check-out</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{formatDate(bookingData.checkOut)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Nights</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{nights} night{nights !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Total Amount</p>
                <p style={{ fontWeight: 700, color: GOLD, fontSize: '1.05rem' }}>ETB {bookingData.totalPrice || '0'}</p>
              </div>
            </div>
          </div>

          {/* ─── Next Steps ─── */}
          <div style={{ background: '#F8F8F8', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, color: DARK_NAVY, fontSize: '0.9rem', marginBottom: '0.6rem' }}>Next Steps</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.65rem', paddingLeft: 0, margin: 0, listStyle: 'none' }}>
              {status.steps.map((step, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.82rem', color: '#555' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      background: DARK_NAVY,
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: DARK_NAVY }}>{step.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.5 }}>{step.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Support Contact (if we have it) ─── */}
          {(supportPhone || supportEmail) && (
            <div
              style={{
                background: 'rgba(200,168,124,0.08)',
                border: '1px solid rgba(200,168,124,0.25)',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                marginBottom: '1.5rem',
                fontSize: '0.8rem',
                color: '#555',
                textAlign: 'center',
              }}
            >
              Need help?{' '}
              {supportPhone && <strong style={{ color: DARK_NAVY }}>{supportPhone}</strong>}
              {supportPhone && supportEmail && ' · '}
              {supportEmail && <strong style={{ color: DARK_NAVY }}>{supportEmail}</strong>}
            </div>
          )}

          {/* ─── CTA Buttons ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              href={isLoggedIn ? '/dashboard' : '/login'}
              style={{
                textAlign: 'center',
                background: DARK_NAVY,
                color: '#FFFFFF',
                fontWeight: 600,
                padding: '0.8rem 1.5rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              {isLoggedIn ? 'View My Dashboard' : 'Log In to Track Booking'}
            </Link>

            <Link
              href="/"
              style={{
                textAlign: 'center',
                border: `2px solid ${GOLD}`,
                color: DARK_NAVY,
                fontWeight: 600,
                padding: '0.8rem 1.5rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                background: 'transparent',
              }}
            >
              Return Home
            </Link>
          </div>

          {/* ─── Register prompt if not logged in ─── */}
          {!isLoggedIn && bookingData.email && (
            <div
              style={{
                marginTop: '1.25rem',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: '#888',
                lineHeight: 1.5,
              }}
            >
              Booked without an account?{' '}
              <Link
                href={`/register?redirect=${encodeURIComponent('/dashboard')}`}
                style={{ color: GOLD, fontWeight: 600, textDecoration: 'underline' }}
              >
                Create one with {bookingData.email}
              </Link>{' '}
              to track this booking.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmationContent />
    </Suspense>
  );
}