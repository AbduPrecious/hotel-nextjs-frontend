'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAlert } from '../context/AlertContext';
import { GuestIcon, BedIcon } from '../components/Icons';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

export default function DashboardPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const recentStaysRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/login'); 
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

  const scrollToRecentStays = () => {
    if (recentStaysRef.current) {
      recentStaysRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (isMobile) setSidebarOpen(false);
  };

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
        bgColor = '#28A745';
        textColor = '#FFFFFF';
        break;
      case 'cancelled':
        bgColor = '#E53E3E';
        textColor = '#FFFFFF';
        break;
      case 'rejected':
        bgColor = '#E53E3E';
        textColor = '#FFFFFF';
        break;
      default:
        bgColor = '#F59E0B';
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

  const total = bookings.length;
  const pending = bookings.filter(b => (b.attributes?.booking_status || b.booking_status || '').toLowerCase() === 'pending').length;
  const approved = bookings.filter(b => (b.attributes?.booking_status || b.booking_status || '').toLowerCase() === 'approved').length;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '16px', color: '#666666', fontSize: '0.8rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: BEIGE }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <aside
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          width: '256px',
          height: '100vh',
          background: '#FFFFFF',
          borderRight: '1px solid #E8E8E8',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          transition: 'transform 0.3s ease',
          boxShadow: isMobile && sidebarOpen ? '0 10px 40px rgba(0,0,0,0.1)' : 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #E8E8E8' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', fontWeight: 700, color: DARK_NAVY }}>
            Dashboard
          </h2>
          <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>Welcome back, {userName}</p>
        </div>

        <nav style={{ flex: 1, padding: '1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: GOLD,
              color: DARK_NAVY,
              borderRadius: '0.5rem',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            <i className="fas fa-home" style={{ width: '20px', textAlign: 'center' }}></i>
            Overview
          </Link>
          
          <div
            onClick={scrollToRecentStays}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#F8F8F8',
              color: '#666',
              borderRadius: '0.5rem',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F0F0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F8F8F8'; }}
          >
            <i className="fas fa-bed" style={{ width: '20px', textAlign: 'center' }}></i>
            My Stays
          </div>

          <div
            onClick={() => showAlert('Profile page coming soon!', 'info')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#F8F8F8',
              color: '#666',
              borderRadius: '0.5rem',
              fontWeight: 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F0F0F0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F8F8F8'; }}
          >
            <i className="fas fa-user" style={{ width: '20px', textAlign: 'center' }}></i>
            Profile
          </div>
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid #E8E8E8' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#F8F8F8',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#E53E3E',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(229,62,62,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#F8F8F8'; }}
          >
            <i className="fas fa-sign-out-alt" style={{ width: '20px', textAlign: 'center' }}></i>
            Log Out
          </button>
        </div>
      </aside>

      {isMobile && sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            background: 'rgba(0,0,0,0.3)',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: isMobile ? '1rem' : '2rem' }}>
        
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'transparent', border: 'none', color: DARK_NAVY, cursor: 'pointer', padding: '0.25rem' }}
            >
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: DARK_NAVY }}>Dashboard</h3>
          </div>
        )}

        <div style={{ maxWidth: '1180px', margin: '0 auto', width: '100%' }}>
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

          <div
            ref={recentStaysRef}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E8E8E8',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    <div key={booking.documentId || booking.id} style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', padding: '1rem', background: '#F8F8F8', borderRadius: '1rem', border: '1px solid #E8E8E8' }}>
                      <div style={{ width: '100px', height: '70px', borderRadius: '0.5rem', overflow: 'hidden', background: '#E0E0E0', flexShrink: 0 }}>
                        <img src={imgSrc} alt="Room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <BedIcon size={18} color="#555" />
                            <Link href={`/dashboard/bookings/${booking.documentId || booking.id}`} style={{ fontSize: '1.1rem', fontWeight: 600, color: DARK_NAVY, textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = GOLD} onMouseLeave={(e) => e.currentTarget.style.color = DARK_NAVY}>
                              {roomData?.title || 'Room'}
                            </Link>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {getStatusBadge(bData?.booking_status)}
                            <Link
                              href={`/dashboard/bookings/${booking.documentId || booking.id}`}
                              style={{
                                padding: '0.3rem 1rem',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                background: DARK_NAVY,
                                color: '#FFFFFF',
                                borderRadius: '9999px',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = GOLD;
                                e.currentTarget.style.color = DARK_NAVY;
                                e.currentTarget.style.transform = 'scale(1.02)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = DARK_NAVY;
                                e.currentTarget.style.color = '#FFFFFF';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              View Details
                            </Link>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.85rem', color: '#555555', marginTop: '0.25rem' }}>
                          <span> {formatDate(bData?.check_in)} – {formatDate(bData?.check_out)}</span>
                          <span style={{ marginLeft: '1rem' }}> <strong style={{ color: GOLD }}>ETB {bData?.total}</strong></span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', marginTop: '0.25rem', alignItems: 'center' }}>
                          <p style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                            <GuestIcon size={18} color="#555" />
                            {bData?.name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#999', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                            <i className="fas fa-envelope" style={{ color: '#555', fontSize: '0.9rem', width: '18px', textAlign: 'center' }}></i>
                            {bData?.email || 'N/A'}
                          </p>
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
    </div>
  );
}