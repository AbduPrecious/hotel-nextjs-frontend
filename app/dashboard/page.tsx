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

const getToken = () => {
  const keys = ['strapi_token', 'token', 'jwt', 'authToken'];
  for (const key of keys) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  return null;
};

export default function DashboardPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchUserAndBookings(token);
  }, [router]);

  const fetchUserAndBookings = async (token: string) => {
    setLoading(true);
    try {
      const userRes = await fetch(`${STRAPI_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) {
        if (userRes.status === 401) {
          localStorage.removeItem('strapi_token');
          localStorage.removeItem('token');
          localStorage.removeItem('jwt');
          localStorage.removeItem('authToken');
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch user (status ${userRes.status})`);
      }
      const userData = await userRes.json();
      const email = userData.email;
      setUserName(userData.username || email || 'Guest');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', userData.username || email || 'Guest');

      const bookingsRes = await fetch(
        `${STRAPI_URL}/bookings?filters[email][$eqi]=${encodeURIComponent(email)}&populate=room.photos&sort=createdAt:desc`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!bookingsRes.ok) {
        const errText = await bookingsRes.text();
        throw new Error(`Failed to fetch bookings (${bookingsRes.status}): ${errText}`);
      }
      const data = await bookingsRes.json();
      const bookingsData = data.data || [];

      const processed = bookingsData.map((booking: any) => {
        if (booking.room && booking.room.photos && !Array.isArray(booking.room.photos)) {
          booking.room.photos = booking.room.photos.data || [];
        }
        return booking;
      });

      setBookings(processed);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      showAlert(`Could not load dashboard data: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('strapi_token');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('authToken');
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
        bgColor = '#22C55E';
        textColor = '#FFFFFF';
        break;
      case 'cancelled':
      case 'rejected':
        bgColor = '#EF4444';
        textColor = '#FFFFFF';
        break;
      default:
        bgColor = '#F59E0B';
        textColor = '#FFFFFF';
    }
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: bgColor,
          color: textColor,
        }}
      >
        {statusLower}
      </span>
    );
  };

  const getImageUrl = (photo: any) => {
    if (!photo) return null;
    const url = photo?.url || photo?.attributes?.url || photo?.data?.attributes?.url;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = 'https://api-hotel.qenenia.com';
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  const total = bookings.length;
  const pending = bookings.filter(
    (b) => (b.attributes?.booking_status || b.booking_status || '').toLowerCase() === 'pending'
  ).length;
  const approved = bookings.filter(
    (b) => (b.attributes?.booking_status || b.booking_status || '').toLowerCase() === 'approved'
  ).length;
  const rejected = total - pending - approved;

  // ─── Stat card config with colors ─────────────────────────────
  const stats = [
    { label: 'Total Bookings', value: total, color: DARK_NAVY, icon: '📊' },
    { label: 'Pending', value: pending, color: '#F59E0B', icon: '⏳' },
    { label: 'Approved', value: approved, color: '#22C55E', icon: '✅' },
    { label: 'Rejected', value: rejected, color: '#EF4444', icon: '❌' },
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BEIGE,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #C8A87C',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
          <p style={{ marginTop: '16px', color: '#666666', fontSize: '0.8rem' }}>
            Loading dashboard...
          </p>
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-card {
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
        }
        .stat-card:nth-child(1) { animation-delay: 0.1s; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; }
        .stat-number {
          transition: all 0.3s ease;
        }
        .stat-number:hover {
          transform: scale(1.1);
        }
      `}</style>

      {/* ─── SIDEBAR ────────────────────────────────────────────── */}
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
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: DARK_NAVY,
            }}
          >
            Dashboard
          </h2>
          <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Welcome back, {userName}
          </p>
        </div>

        <nav
          style={{
            flex: 1,
            padding: '1rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F0F0F0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8F8F8';
            }}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F0F0F0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8F8F8';
            }}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(229,62,62,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F8F8F8';
            }}
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

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          padding: isMobile ? '1rem' : '2rem',
        }}
      >
        {isMobile && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: DARK_NAVY,
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.2rem',
                color: DARK_NAVY,
              }}
            >
              Dashboard
            </h3>
          </div>
        )}

        <div style={{ maxWidth: '1180px', margin: '0 auto', width: '100%' }}>
          {/* ─── STAT CARDS (Animated + Colored) ────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}
          >
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="stat-card"
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${stat.color}33`,
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  boxShadow: `0 4px 20px ${stat.color}15`,
                  borderTop: `4px solid ${stat.color}`,
                  transition: 'all 0.3s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 30px ${stat.color}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 20px ${stat.color}15`;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
                  <p
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#999',
                      margin: 0,
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
                <div
                  className="stat-number"
                  style={{
                    fontSize: '2.2rem',
                    fontWeight: 700,
                    color: stat.color,
                    lineHeight: 1.2,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* ─── RECENT STAYS ────────────────────────────────────── */}
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
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: DARK_NAVY,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              My Recent Stays
              <span
                style={{
                  fontSize: '0.7rem',
                  background: GOLD,
                  color: DARK_NAVY,
                  padding: '0.1rem 0.5rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                }}
              >
                {bookings.length}
              </span>
            </h3>

            {bookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookings.map((booking) => {
                  const bData = booking.attributes || booking;
                  const roomData = bData?.room || {};
                  const photos = roomData?.photos || [];
                  const firstPhoto = photos.length > 0 ? photos[0] : null;
                  const imgSrc = getImageUrl(firstPhoto);

                  return (
                    <div
                      key={booking.documentId || booking.id}
                      style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '1rem',
                        alignItems: isMobile ? 'stretch' : 'center',
                        padding: '1.25rem',
                        background: '#F8F8F8',
                        borderRadius: '1rem',
                        border: '1px solid #E8E8E8',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = GOLD;
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(200,168,124,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E8E8E8';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* ─── Image ────────────────────────────────── */}
                      <div
                        style={{
                          width: isMobile ? '100%' : '120px',
                          height: isMobile ? '150px' : '80px',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          background: '#E0E0E0',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={roomData?.title || 'Room'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.65rem' }}>No Image</span>
                        )}
                      </div>

                      {/* ─── Details ──────────────────────────────── */}
                      <div style={{ flex: 1, width: '100%' }}>
                        {/* Room Title & Status */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <BedIcon size={18} color="#555" />
                            <Link
                              href={`/dashboard/bookings/${booking.documentId || booking.id}`}
                              style={{
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                color: DARK_NAVY,
                                textDecoration: 'none',
                                transition: 'color 0.3s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                              onMouseLeave={(e) => (e.currentTarget.style.color = DARK_NAVY)}
                            >
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
                                transition: 'all 0.3s ease',
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

                        {/* ─── Guest Details (Styled & Bold) ────── */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr auto',
                            gap: '0.5rem 1.25rem',
                            marginTop: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: '0.5rem',
                            border: '1px solid #E8E8E8',
                          }}
                        >
                          {/* Guest Name */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <GuestIcon size={14} color="#555" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: DARK_NAVY }}>
                              {bData?.name || 'N/A'}
                            </span>
                          </div>

                          {/* Email */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <i className="fas fa-envelope" style={{ color: '#555', fontSize: '0.75rem', width: '14px', textAlign: 'center' }}></i>
                            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#555' }}>
                              {bData?.email || 'N/A'}
                            </span>
                          </div>

                          {/* Check-in / Check-out */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <i className="fas fa-calendar-alt" style={{ color: '#555', fontSize: '0.75rem', width: '14px', textAlign: 'center' }}></i>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: DARK_NAVY }}>
                              {formatDate(bData?.check_in)} – {formatDate(bData?.check_out)}
                            </span>
                          </div>

                          {/* Total Price */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: GOLD }}>
                              ETB {bData?.total || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ color: '#999', fontSize: '0.9rem' }}>
                  You haven't made any bookings yet.
                </p>
                <Link
                  href="/rooms"
                  style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    background: DARK_NAVY,
                    color: '#FFFFFF',
                    padding: '0.5rem 1.5rem',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    fontSize: '0.75rem',
                    transition: 'background 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = GOLD;
                    e.currentTarget.style.color = DARK_NAVY;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = DARK_NAVY;
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                >
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