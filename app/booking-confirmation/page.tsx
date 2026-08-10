// app/booking-confirmation/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD_GRADIENT = 'linear-gradient(135deg, #C8A87C 0%, #E8D5B8 100%)';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

// ─── Loading Fallback ──────────────────────────────────
function LoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE, padding: '1rem'}}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#666666',letterSpacing: '0.05em', fontSize: '12px', textTransform: 'uppercase' }}>Loading confirmation...</p>
      </div>
    </div>
  );
}

// ─── Confirmation Content ─────────────────────────────
function ConfirmationContent() {
  const searchParams = useSearchParams();
  const [bookingData, setBookingData] = useState<any>(null);
  
  // ─── Responsive Hook ──────────────────────────────────
  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth < 768;
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    const params = {
      name: searchParams.get('name') || '',
      email: searchParams.get('email') || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      totalPrice: searchParams.get('totalPrice') || '',
      roomName: searchParams.get('roomName') || '',
      paymentMethod: searchParams.get('paymentMethod') || 'screenshot',
    };
    setBookingData(params);
  }, [searchParams]);

  if (!bookingData) {
    return <LoadingFallback />;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    return Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
  const paymentMethodLabel = bookingData.paymentMethod === 'cash' ? 'Cash on Arrival' : 'Screenshot (pending verification)';

  const dashboardLink = bookingData.email ? `/dashboard?email=${encodeURIComponent(bookingData.email)}` : '/dashboard';

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, color: '#1A1A1A', paddingTop: '64px' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .section-title {
        
          font-weight: 700;
        }
        .gold-divider {
          width: 4rem;
          height: 0.25rem;
          background: linear-gradient(90deg, #C8A87C 0%, #E8D5B8 100%);
          border-radius: 9999px;
          margin: 1rem auto 0;
        }
      `}</style>

      {/* ─── Main Content ─── */}
      <section style={{ padding: '2rem 1rem 4rem', maxWidth: '768px', margin: '0 auto' }}>
        <div style={{ 
          background: '#FFFFFF', 
          borderRadius: '1.5rem', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)', 
          padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem' 
        }}>

          {/* ─── Checkmark ─── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(200,168,124,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'bounce-slow 2s ease-in-out infinite' }}>
              <svg style={{ width: '40px', height: '40px', color: '#C8A87C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 style={{ 
          
            fontSize: isMobile ? '1.8rem' : '2rem', 
            fontWeight: 700, 
            color: DARK_NAVY, 
            textAlign: 'center', 
            marginBottom: '0.25rem' 
          }}>
            ✅ Booking Submitted!
          </h1>
          <p style={{ color: '#666666', textAlign: 'center', fontSize: '1rem', marginBottom: '1.5rem' }}>
            Your reservation has been received and is pending confirmation.
          </p>

          <div className="gold-divider" style={{ margin: '0 auto 1.5rem' }} />

          {/* ─── Booking Details ─── */}
          <div style={{ background: '#F8F8F8', borderRadius: '1rem', padding: isMobile ? '1rem' : '1.25rem', marginBottom: '1.5rem' }}>
            <h2 style={{fontSize: '1.2rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}></span> Booking Details
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
              gap: isMobile ? '0.5rem 0' : '0.75rem 1rem' 
            }}>
              <div>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Guest Name</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{bookingData.name || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Email</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{bookingData.email || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Room</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{bookingData.roomName || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Payment Method</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{paymentMethodLabel}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Check-in</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{formatDate(bookingData.checkIn)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Check-out</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{formatDate(bookingData.checkOut)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Nights</p>
                <p style={{ fontWeight: 500, color: DARK_NAVY }}>{nights} night{nights !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', fontWeight: 600 }}>Total Amount</p>
                <p style={{ fontWeight: 700, color: '#C8A87C', fontSize: '1.1rem' }}>ETB {bookingData.totalPrice || '0'}</p>
              </div>
            </div>
          </div>

          {/* ─── Payment Status ─── */}
          <div style={{ background: 'rgba(200,168,124,0.08)', border: '1px solid rgba(200,168,124,0.2)', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ fontSize: '1.5rem' }}>⏳</div>
              <div>
                <h3 style={{ fontWeight: 600, color: DARK_NAVY, fontSize: '0.9rem' }}>Payment Pending Verification</h3>
                <p style={{ color: '#666666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {bookingData.paymentMethod === 'screenshot'
                    ? 'Your payment screenshot is being reviewed by our team. You will receive a confirmation email once verified.'
                    : 'You have selected Cash on Arrival. Please have your payment ready upon check-in.'}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Next Steps ─── */}
          <div style={{ background: '#F8F8F8', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 600, color: DARK_NAVY, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}></span> Next Steps
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.35rem' : '0.5rem', paddingLeft: '0', margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8rem', color: '#555' }}>
                <span style={{ width: '20px', height: '20px', background: DARK_NAVY, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold', flexShrink: 0, marginTop: '0.1rem' }}>1</span>
                {bookingData.paymentMethod === 'screenshot'
                  ? 'Our team will review your payment screenshot within 24 hours.'
                  : 'Your booking is confirmed – we look forward to welcoming you!'}
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8rem', color: '#555' }}>
                <span style={{ width: '20px', height: '20px', background: DARK_NAVY, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold', flexShrink: 0, marginTop: '0.1rem' }}>2</span>
                You'll receive a confirmation email once your booking is approved.
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8rem', color: '#555' }}>
                <span style={{ width: '20px', height: '20px', background: DARK_NAVY, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold', flexShrink: 0, marginTop: '0.1rem' }}>3</span>
                Check your booking status anytime in your dashboard.
              </li>
            </ul>
          </div>

          {/* ─── Buttons ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              href="/"
              style={{
                textAlign: 'center',
                background: GOLD_GRADIENT,
                color: DARK_NAVY,
                fontWeight: 600,
                padding: '0.8rem 1.5rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(200,168,124,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Return Home
            </Link>
            <Link
              href={dashboardLink}
              style={{
                textAlign: 'center',
                border: '2px solid #C8A87C',
                color: DARK_NAVY,
                fontWeight: 600,
                padding: '0.8rem 1.5rem',
                borderRadius: '9999px',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#C8A87C'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DARK_NAVY; e.currentTarget.style.transform = 'scale(1)'; }}
            >
               View Dashboard
            </Link>
          </div>

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