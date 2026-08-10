// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // ─── Check Login & Fetch Data ───────────────────────────────
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/login'); // Kick unauthenticated users to login page
      return;
    }
    setUserEmail(email);
    const name = localStorage.getItem('userName') || 'Guest';
    setUserName(name);
    fetchBookings(email);
  }, [router]);

  const fetchBookings = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${STRAPI_URL}/bookings?filters[email][$eqi]=${encodeURIComponent(email)}&populate=room,room.photos&sort=createdAt:desc`
      );
      const data = await res.json();
      setBookings(data.data || []);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    router.push('/login');
  };

  // ─── Helper Functions ──────────────────────────────────────
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pending';
    let bgColor, textColor;
    switch (statusLower) {
      case 'approved':
        bgColor = '#C8A87C';
        textColor = '#17232E';
        break;
      case 'rejected':
        bgColor = '#E53E3E';
        textColor = '#FFFFFF';
        break;
      default:
        bgColor = '#17232E';
        textColor = '#FFFFFF';
    }
    return (
      <span style={{
        display: 'inline-block',
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.65rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: bgColor,
        color: textColor,
      }}>
        {statusLower}
      </span>
    );
  };

  // ─── Stats Calculations ────────────────────────────────────
  const total = bookings.length;
  const pending = bookings.filter(b => (b.attributes?.booking_status || b.booking_status || '').toLowerCase() === 'pending').length;
  const approved = bookings.filter(b => (b.attributes?.booking_status || b.booking_status || '').toLowerCase() === 'approved').length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '16px', color: '#666666',fontSize: '0.8rem' }}>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, paddingTop: '7.5rem', paddingBottom: '2.5rem', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* ─── Header & Logout ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{fontSize: '1.8rem', fontWeight: 700, color: DARK_NAVY, marginBottom: '0.25rem' }}>
              Hello, <span style={{ color: GOLD }}>{userName}</span>!
            </h1>
            <p style={{ color: '#666666', fontSize: '0.9rem' }}>Track the status of your upcoming hotel stays.</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #E53E3E',
              color: '#E53E3E',
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E53E3E'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E53E3E'; }}
          >
            Log Out
          </button>
        </div>

        {/* ─── Stats Cards ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Bookings', value: total },
            { label: 'Pending', value: pending },
            { label: 'Approved', value: approved },
            { label: 'Rejected', value: total - pending - approved },
          ].map((stat, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', marginBottom: '0.25rem' }}>
                {stat.label}
              </p>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: DARK_NAVY }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ─── My Bookings List ─── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <h3 style={{fontSize: '1.2rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            My Recent Stays
            <span style={{ fontSize: '0.7rem', background: GOLD, color: DARK_NAVY, padding: '0.1rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
              {bookings.length}
            </span>
          </h3>

          {bookings.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bookings.map((booking, idx) => {
                const bData = booking.attributes || booking;
                const roomData = bData?.room?.attributes || bData?.room || {};
                const imageUrl = roomData?.photos?.[0]?.url || '/placeholder-room.jpg';
                const imgSrc = imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace('/api', '') || 'http://localhost:1337'}${imageUrl}`;

                return (
                  <div key={booking.documentId || booking.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: '#F8F8F8', borderRadius: '1rem', border: '1px solid #E8E8E8' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ width: '100px', height: '70px', borderRadius: '0.5rem', overflow: 'hidden', background: '#E0E0E0', flexShrink: 0 }}>
                        <img src={imgSrc} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <Link href={`/rooms/${roomData.documentId || roomData.id}`} style={{fontSize: '1.1rem', fontWeight: 600, color: DARK_NAVY, textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = GOLD} onMouseLeave={(e) => e.currentTarget.style.color = DARK_NAVY}>
                            {roomData?.title || 'Room'}
                          </Link>
                          {getStatusBadge(bData?.booking_status)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#555555' }}>
                          <span>• {formatDate(bData?.check_in)} – {formatDate(bData?.check_out)}</span>
                          <span style={{ marginLeft: '1rem' }}> • <strong style={{ color: GOLD }}>ETB {bData?.total}</strong></span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#999' }}> • {bData?.name}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: '#999', fontSize: '0.9rem' }}>You haven't made any bookings yet.</p>
              <Link href="/rooms" style={{ display: 'inline-block', marginTop: '1rem', background: DARK_NAVY, color: '#FFFFFF', padding: '0.5rem 1.5rem', borderRadius: '9999px', textDecoration: 'none', fontSize: '0.75rem', transition: 'background 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = DARK_NAVY; }} onMouseLeave={(e) => { e.currentTarget.style.background = DARK_NAVY; e.currentTarget.style.color = '#FFFFFF'; }}>
                Browse Available Rooms
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}