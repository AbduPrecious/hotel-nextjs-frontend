'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAlert } from '../../../context/AlertContext';
import { BedIcon, GuestIcon } from '../../../components/Icons';

const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const STRAPI_URL = API_URL.replace('/api', '');
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: '#22C55E', text: '#FFFFFF' },
  pending: { bg: '#C8A87C', text: '#17232E' },
  rejected: { bg: '#EF4444', text: '#FFFFFF' },
  cancelled: { bg: '#EF4444', text: '#FFFFFF' },
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { showAlert, showConfirm } = useAlert();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('strapi_token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (id) {
      fetchBooking(id, token);
    } else {
      router.push('/dashboard');
    }
  }, [id, router]);

  const fetchBooking = async (bookingId: string, token: string) => {
    setLoading(true);
    try {
      const url = `${API_URL}/bookings/${bookingId}?populate[room]=true`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const bookingData = data.data || {};

      // Fetch the room with photos only if we have a room documentId
      if (bookingData.room?.documentId) {
        const roomId = bookingData.room.documentId;
        const roomUrl = `${API_URL}/rooms/${roomId}?populate=photos`;
        const roomRes = await fetch(roomUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (roomRes.ok) {
          const roomData = await roomRes.json();
          // Strapi v5: data is the room object, photos might be under data.photos or data.attributes.photos
          const roomAttr = roomData.data || {};
          // Extract photos array from various possible structures
          let photos = [];
          if (roomAttr.photos) {
            photos = roomAttr.photos.data || roomAttr.photos;
          } else if (roomAttr.attributes?.photos) {
            photos = roomAttr.attributes.photos.data || roomAttr.attributes.photos;
          }
          // Ensure photos is an array of objects with a 'url' property
          if (Array.isArray(photos)) {
            bookingData.room.photos = photos.map((p: any) => ({
              url: p.url || p.attributes?.url,
            }));
          } else {
            bookingData.room.photos = [];
          }
          setCurrentPhotoIndex(0);
        }
      }
      setBooking(bookingData);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (photo: any) => {
    if (!photo) return null;
    const url = photo?.url || photo?.attributes?.url || photo?.data?.attributes?.url;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  const photos = booking?.room?.photos || [];
  const currentPhoto = photos.length > 0 ? photos[currentPhotoIndex] : null;
  const imgSrc = currentPhoto ? getImageUrl(currentPhoto) : null;

  const goToPrev = () => {
    if (photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };
  const goToNext = () => {
    if (photos.length === 0) return;
    setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleCancelBooking = () => {
    showConfirm({
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
      onConfirm: async () => {
        setCancelling(true);
        try {
          const token = localStorage.getItem('strapi_token');
          const res = await fetch(`${API_URL}/bookings/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ data: { booking_status: 'Cancelled' } }),
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error?.message || `Strapi error ${res.status}`);
          }
          showAlert('Booking cancelled successfully!', 'success');
          router.push('/dashboard');
        } catch (err: any) {
          showAlert(`Cancel failed: ${err.message}`, 'error');
        } finally {
          setCancelling(false);
        }
      },
      onCancel: () => {},
    });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '80vh',
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
              background: GOLD,
              borderRadius: '50%',
              margin: '0 auto',
              opacity: 0.5,
            }}
          ></div>
          <p style={{ marginTop: '16px', color: '#666' }}>Loading booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BEIGE,
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          <h2 style={{ color: DARK_NAVY }}>Booking Not Found</h2>
          <p style={{ color: '#666' }}>{error || "This booking doesn't exist."}</p>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-block',
              background: DARK_NAVY,
              color: '#fff',
              padding: '0.6rem 1.5rem',
              borderRadius: '9999px',
              textDecoration: 'none',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const roomData = booking?.room || {};
  const status = booking?.booking_status?.toLowerCase() || 'pending';
  const statusColors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const roomTitle = roomData?.title || 'Room details not available';
  const capacity = roomData?.capacity || '—';
  const bedType = roomData?.bed_type || '—';

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, paddingTop: isMobile ? '5rem' : '6.5rem' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeInUp 0.8s ease forwards; opacity: 0; }

        .contact-hero {
          background: ${DARK_NAVY};
          padding: 3rem 1rem;
          text-align: center;
          border-bottom: 3px solid ${GOLD};
        }
        .contact-hero .breadcrumb {
          font-size: 0.7rem;
          color: ${GOLD};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }
        .contact-hero .breadcrumb a {
          color: ${GOLD};
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .contact-hero .breadcrumb a:hover { color: white; }
        .contact-hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
          letter-spacing: 0.02em;
        }
        .contact-hero p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
          max-width: 672px;
          margin: 0 auto;
          font-weight: 300;
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .contact-hero h1 { font-size: 2rem; }
          .contact-hero p { font-size: 0.8rem; }
        }
      `}</style>

      {/* ─── HERO ─── */}
      <div className="contact-hero animate-in" style={{ padding: isMobile ? '4rem 1rem' : '5rem 1rem' }}>
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <span style={{ color: '#FFFFFF' }}>Booking Details</span>
        </div>
        <h1>{roomTitle}</h1>
        <div
          style={{
            fontSize: isMobile ? '0.75rem' : '0.9rem',
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.05em',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {booking?.check_in && booking?.check_out ? (
            <>
              <span>Check‑in: {new Date(booking.check_in).toLocaleDateString()}</span>
              <span>|</span>
              <span>Check‑out: {new Date(booking.check_out).toLocaleDateString()}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <GuestIcon size={16} color="rgba(255,255,255,0.7)" /> {capacity} Guests
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <BedIcon size={16} color="rgba(255,255,255,0.7)" /> {bedType}
              </span>
            </>
          ) : (
            'Booking details'
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ minHeight: '70vh', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr',
              gap: '2rem',
            }}
          >
            {/* LEFT: Carousel */}
            <div
              style={{
                background: '#fff',
                borderRadius: '1.5rem',
                overflow: 'hidden',
                boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
              }}
            >
              {photos.length > 0 ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: isMobile ? '260px' : '420px',
                    background: '#f0f0f0',
                  }}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={`${roomTitle} - slide ${currentPhotoIndex + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                      }}
                    >
                      No image
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: '0.2rem 0.8rem',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                    }}
                  >
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                  <button
                    onClick={goToPrev}
                    style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(4px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '1.4rem',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD;
                      e.currentTarget.style.color = DARK_NAVY;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                      e.currentTarget.style.color = 'white';
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={goToNext}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(4px)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '1.4rem',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD;
                      e.currentTarget.style.color = DARK_NAVY;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                      e.currentTarget.style.color = 'white';
                    }}
                  >
                    ›
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: isMobile ? '260px' : '420px',
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                  }}
                >
                  No images available
                </div>
              )}
              {photos.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', padding: '0.75rem 0' }}>
                  {photos.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: idx === currentPhotoIndex ? GOLD : '#d0d0d0',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'background 0.3s ease',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Booking Details */}
            <div
              style={{
                background: '#fff',
                borderRadius: '1.5rem',
                padding: isMobile ? '1rem' : '1.5rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.25rem' }}>
                    Booking Details
                  </h2>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.3rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: statusColors.bg,
                      color: statusColors.text,
                    }}
                  >
                    {status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999' }}>Guest</div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: DARK_NAVY }}>
                      <GuestIcon size={18} color="#555" /> {booking?.name || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999' }}>Email</div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: DARK_NAVY }}>
                      <i className="fas fa-envelope" style={{ color: '#555', fontSize: '18px', width: '18px', textAlign: 'center' }}></i>
                      {booking?.email || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999' }}>Phone</div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: DARK_NAVY }}>
                      <i className="fas fa-phone" style={{ color: '#555', fontSize: '18px', width: '18px', textAlign: 'center' }}></i>
                      {booking?.phone || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999' }}>Total</div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: GOLD }}>
                      ETB {booking?.total || 0}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8f8f8',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999' }}>Check‑in</div>
                    <strong>{booking?.check_in ? new Date(booking.check_in).toLocaleDateString() : 'N/A'}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999' }}>Check‑out</div>
                    <strong>{booking?.check_out ? new Date(booking.check_out).toLocaleDateString() : 'N/A'}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#999' }}>Nights</div>
                    <strong>
                      {booking?.check_in && booking?.check_out
                        ? Math.ceil(
                            (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : '—'}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <Link
                    href="/dashboard"
                    style={{
                      padding: '0.65rem 2rem',
                      background: 'transparent',
                      border: `2px solid ${DARK_NAVY}`,
                      borderRadius: '9999px',
                      color: DARK_NAVY,
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      transition: 'all 0.3s ease',
                      flex: '1 1 auto',
                      textAlign: 'center',
                      width: isMobile ? '100%' : 'auto',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = DARK_NAVY;
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = DARK_NAVY;
                    }}
                  >
                    Back to Dashboard
                  </Link>
                  {(status === 'pending' || status === 'approved') && (
                    <button
                      onClick={handleCancelBooking}
                      disabled={cancelling}
                      style={{
                        padding: '0.65rem 2rem',
                        background: '#EF4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: cancelling ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: cancelling ? 0.7 : 1,
                        flex: '1 1 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: isMobile ? '100%' : 'auto',
                      }}
                      onMouseEnter={(e) => {
                        if (!cancelling) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(239,68,68,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!cancelling) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✕</span>{' '}
                      {cancelling ? 'Processing...' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}