'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { renderRichText } from '../../lib/api';
import { useAlert } from '../../context/AlertContext';
import { BedIcon, GuestIcon } from '../../components/Icons';
import { saveAuth } from '../../lib/auth';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#B69B78';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: any[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const goToPrev = () => setCurrentIndex((p) => (p === 0 ? images.length - 1 : p - 1));
  const goToNext = () => setCurrentIndex((p) => (p === images.length - 1 ? 0 : p + 1));
  const currentImage = images[currentIndex];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          color: 'white',
          fontSize: '2rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        ✕
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToPrev();
        }}
        style={{
          position: 'absolute',
          left: '1rem',
          color: 'white',
          fontSize: '2.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        ‹
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          goToNext();
        }}
        style={{
          position: 'absolute',
          right: '1rem',
          color: 'white',
          fontSize: '2.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        ›
      </button>
      <div
        style={{ maxWidth: '1024px', maxHeight: '90vh', width: '100%', height: '100%', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {currentImage && (
          <img
            src={`${STRAPI_URL}${currentImage.url}`}
            alt={currentImage.alternativeText || 'Room image'}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.85rem',
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

export default function RoomClient({ room, heroImage }: { room: any; heroImage: string | null }) {
  const router = useRouter();
  const { showAlert } = useAlert();

  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth < 768;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const roomData = room;
  const photos = roomData?.photos || [];
  const amenities = roomData?.amenities || [];
  const detailsHtml = renderRichText(roomData?.details);

  // ─── Availability check ───
  const [isRoomBooked, setIsRoomBooked] = useState(false);
  const [bookingsForRoom, setBookingsForRoom] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBookings() {
      const roomId = roomData?.documentId || roomData?.id;
      if (!roomId) return;
      try {
        const res = await fetch(`${STRAPI_URL}/api/booking-availability?room=${roomId}`);
        if (!res.ok) return;
        const data = await res.json();
        setBookingsForRoom(data.data || []);
      } catch (error) {
        console.error('Failed to fetch bookings', error);
      }
    }
    fetchBookings();
  }, [roomData]);

  // ─── Form state ───
  // IMPORTANT: Prefill ONLY from URL params (used when guest clicks "Change" from /checkout).
  // When guest arrives from /rooms listing, there are no URL params → form is empty.
  const [formData, setFormData] = useState(() => {
    if (typeof window === 'undefined') {
      return { name: '', email: '', phone: '', check_in: '', check_out: '' };
    }
    const params = new URLSearchParams(window.location.search);
    return {
      name: params.get('name') || '',
      email: params.get('email') || '',
      phone: params.get('phone') || '',
      check_in: params.get('checkIn') || '',
      check_out: params.get('checkOut') || '',
    };
  });

  // ─── Login modal state ───
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // ─── Date overlap check ───
  useEffect(() => {
    if (!formData.check_in || !formData.check_out) {
      setIsRoomBooked(false);
      return;
    }
    const newIn = new Date(formData.check_in).getTime();
    const newOut = new Date(formData.check_out).getTime();

    const hasOverlap = bookingsForRoom.some((booking: any) => {
      const status = booking.booking_status || booking.status || 'Pending';
      if (status.toLowerCase() !== 'pending' && status.toLowerCase() !== 'approved') return false;
      const existingIn = new Date(booking.check_in).getTime();
      const existingOut = new Date(booking.check_out).getTime();
      return newIn < existingOut && newOut > existingIn;
    });
    setIsRoomBooked(hasOverlap);
  }, [formData.check_in, formData.check_out, bookingsForRoom]);

  const calculateDetails = () => {
    if (!formData.check_in || !formData.check_out) return { nights: 0, total: 0 };
    const inDate = new Date(formData.check_in);
    const outDate = new Date(formData.check_out);
    const nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
    return { nights: nights > 0 ? nights : 0, total: nights > 0 ? nights * roomData.price : 0 };
  };
  const { nights, total } = calculateDetails();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Login submit (inside modal) ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Invalid email or password.');

     const { saveAuth } = await import('../../lib/auth');
saveAuth(data.jwt, data.user.email, data.user.username || 'Guest');

      // Fill name/email in the form (so guest doesn't retype)
      const finalName = formData.name || data.user.username || '';
      const finalEmail = formData.email || data.user.email || '';

      setFormData((prev) => ({
        ...prev,
        email: finalEmail,
        name: finalName,
      }));

      setShowLoginModal(false);
      setLoginPassword('');
      setLoginLoading(false);

      // Continue straight to checkout
      proceedToCheckout(finalName, finalEmail, formData.phone);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
      setLoginLoading(false);
    }
  };

  // ─── Proceed helper ───
  const proceedToCheckout = (name: string, email: string, phone: string) => {
    if (!name || !email) {
      showAlert('Please enter your name and email.', 'warning');
      return;
    }
    if (!phone) {
      showAlert('Please enter your phone number.', 'warning');
      return;
    }
    if (!formData.check_in || !formData.check_out) {
      showAlert('Please select check-in and check-out dates.', 'warning');
      return;
    }
    const checkInDate = new Date(formData.check_in);
    const checkOutDate = new Date(formData.check_out);
    if (checkOutDate <= checkInDate) {
      showAlert('Check-out must be after check-in.', 'error');
      return;
    }
    if (isRoomBooked) {
      showAlert('Sorry, this room is already booked for those dates.', 'error');
      return;
    }

    const params = new URLSearchParams({
      roomId: roomData.documentId || roomData.id,
      checkIn: formData.check_in,
      checkOut: formData.check_out,
      name,
      email,
      phone,
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const handleProceedToCheckout = () => {
    // Dates first
    if (!formData.check_in || !formData.check_out) {
      showAlert('Please select check-in and check-out dates.', 'warning');
      return;
    }
    const checkInDate = new Date(formData.check_in);
    const checkOutDate = new Date(formData.check_out);
    if (checkOutDate <= checkInDate) {
      showAlert('Check-out must be after check-in.', 'error');
      return;
    }
    if (isRoomBooked) {
      showAlert('Sorry, this room is already booked for those dates.', 'error');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('strapi_token') : null;
    if (!token) {
      // Show login modal
      if (formData.email) setLoginEmail(formData.email);
      setShowLoginModal(true);
      return;
    }

    // Logged in → validate + proceed
    const finalName = formData.name || localStorage.getItem('userName') || '';
    const finalEmail = formData.email || localStorage.getItem('userEmail') || '';
    proceedToCheckout(
      finalName === 'Guest' ? '' : finalName,
      finalEmail,
      formData.phone
    );
  };

  const goToPrevPhoto = () => setCurrentPhotoIndex((p) => (p === 0 ? photos.length - 1 : p - 1));
  const goToNextPhoto = () => setCurrentPhotoIndex((p) => (p === photos.length - 1 ? 0 : p + 1));

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, color: '#1A1A1A', paddingTop: isMobile ? '5rem' : '6.5rem' }}>
      <style>{`
        .form-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #E0E0E0; border-radius: 0.5rem; font-size: 0.9rem; outline: none; transition: all 0.3s ease; background: #FAFAFA; color: #1A1A1A; }
        .form-input:focus { border-color: ${GOLD}; background: #FFFFFF; }
        .book-btn { width: 100%; background: ${DARK_NAVY}; color: #FFFFFF; padding: 0.8rem; border: none; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.08em; cursor: pointer; transition: all 0.3s ease; }
        .book-btn:hover:not(:disabled) { background: ${GOLD}; transform: scale(1.02); }
        .book-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      {/* HERO */}
      <div style={{ background: DARK_NAVY, padding: isMobile ? '4rem 1rem' : '5rem 1rem', textAlign: 'center', borderBottom: `3px solid ${GOLD}` }}>
        <div style={{ fontSize: '0.7rem', color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          <Link href="/" style={{ color: GOLD, textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link href="/rooms" style={{ color: GOLD, textDecoration: 'none' }}>Rooms</Link>
          <span>/</span>
          <span style={{ color: '#FFFFFF' }}>{roomData.title}</span>
        </div>
        <h1 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 700, color: 'white' }}>{roomData.title}</h1>
        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <GuestIcon size={16} color="rgba(255,255,255,0.7)" /> {roomData.capacity || 4} Guests
          <BedIcon size={16} color="rgba(255,255,255,0.7)" /> {roomData.bed_type || '2 Bedrooms'}
        </p>
      </div>

      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: isMobile ? '1.5rem' : '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {photos.length > 0 && (
              <div style={{ position: 'relative', background: '#FFFFFF', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ position: 'relative', height: isMobile ? '240px' : '360px', overflow: 'hidden' }}>
                  <img src={`${STRAPI_URL}${photos[currentPhotoIndex].url}`} alt={roomData.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '9999px', fontSize: '0.8rem' }}>
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                  <button onClick={goToPrevPhoto} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', border: 'none' }}>‹</button>
                  <button onClick={goToNextPhoto} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', border: 'none' }}>›</button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', overflowX: 'auto', background: '#F8F8F8' }}>
                  {photos.map((photo: any, idx: number) => (
                    <div key={idx} onClick={() => setCurrentPhotoIndex(idx)} style={{ width: '70px', height: '50px', flexShrink: 0, borderRadius: '0.4rem', overflow: 'hidden', cursor: 'pointer', border: idx === currentPhotoIndex ? `2px solid ${GOLD}` : '2px solid transparent', opacity: idx === currentPhotoIndex ? 1 : 0.5 }}>
                      <img src={`${STRAPI_URL}${photo.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: '1.5rem 2rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.5rem' }}>About This Room</h2>
              <p style={{ color: '#555555', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '1rem' }}>{roomData.overview || 'Recently refurbished in an individual and elegant style, enjoy the comfort of a luxurious room.'}</p>
              {detailsHtml && <div style={{ color: '#555555', fontSize: '0.9rem', lineHeight: '1.7' }} dangerouslySetInnerHTML={{ __html: detailsHtml }} />}
            </div>

            {amenities.length > 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: '1.5rem 2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.5rem' }}>Amenities:</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.5rem' }}>
                  {amenities.map((item: any, idx: number) => (
                    <span key={idx} style={{ fontSize: '0.85rem', color: '#444444', background: '#F5F5F5', padding: '0.2rem 0.7rem', borderRadius: '0.3rem' }}>{item?.name || 'Amenity'}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR — booking form */}
          <div style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 'auto' : '80px', alignSelf: 'start' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: '1.5rem 1.5rem 2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
              <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid #E8E8E8', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: DARK_NAVY }}>ETB {roomData.price}</span>
                <span style={{ color: '#999999', fontSize: '0.9rem' }}> / NIGHT</span>
              </div>

              <form style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: DARK_NAVY, display: 'block', marginBottom: '0.2rem' }}>FULL NAME <span style={{ color: '#CC3333' }}>*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required className="form-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: DARK_NAVY, display: 'block', marginBottom: '0.2rem' }}>EMAIL <span style={{ color: '#CC3333' }}>*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required className="form-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: DARK_NAVY, display: 'block', marginBottom: '0.2rem' }}>PHONE NUMBER <span style={{ color: '#CC3333' }}>*</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+251 911 123 456" required className="form-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: DARK_NAVY, display: 'block', marginBottom: '0.2rem' }}>CHECK - IN <span style={{ color: '#CC3333' }}>*</span></label>
                 <input type="date" name="check_in" value={formData.check_in} onChange={handleChange} min={new Date().toISOString().split('T')[0]} required className="form-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: DARK_NAVY, display: 'block', marginBottom: '0.2rem' }}>CHECK - OUT <span style={{ color: '#CC3333' }}>*</span></label>
                  <input type="date" name="check_out" value={formData.check_out} onChange={handleChange} min={formData.check_in || new Date().toISOString().split('T')[0]} required className="form-input" />
                </div>

                {isRoomBooked && (
                  <div style={{ background: '#FFEBEB', border: '1px solid #FF6B6B', color: '#D32F2F', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', textAlign: 'center', fontWeight: 600 }}>
                    ⚠️ Room already booked for these dates.
                  </div>
                )}

                {nights > 0 && (
                  <div style={{ background: DARK_NAVY, padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: GOLD }}>Total: ETB {total}</span>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{nights} nights × ETB {roomData.price}</div>
                  </div>
                )}

                <button type="button" onClick={handleProceedToCheckout} className="book-btn" disabled={isRoomBooked}>
                  {isRoomBooked ? 'ROOM UNAVAILABLE' : 'PROCEED TO CHECKOUT'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LOGIN MODAL ─── */}
      {showLoginModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(23,35,46,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            style={{ background: DARK_NAVY, borderRadius: '1.25rem', padding: '2rem 1.75rem', maxWidth: '420px', width: '100%', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 80px rgba(0,0,0,0.5)', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowLoginModal(false)} style={{ position: 'absolute', top: '0.75rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '52px', height: '52px', background: `linear-gradient(135deg, ${GOLD} 0%, #E8D5B8 100%)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <svg width="24" height="24" fill="none" stroke={DARK_NAVY} viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.25rem' }}>Please Log In</h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>Sign in to continue with your booking</p>
            </div>

            {loginError && (
              <div style={{ padding: '0.6rem 0.9rem', background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ color: '#E53E3E', fontSize: '0.8rem', margin: 0 }}>{loginError}</p>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                style={{ width: '100%', padding: '0.8rem', background: GOLD, color: DARK_NAVY, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', opacity: loginLoading ? 0.6 : 1, marginTop: '0.25rem' }}
              >
                {loginLoading ? 'Signing in…' : 'Sign In & Continue'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem' }}>
  <span style={{ color: 'rgba(255,255,255,0.55)' }}>No account? </span>
  <Link
    href={`/register?redirect=${encodeURIComponent(
      `/checkout?${new URLSearchParams({
        roomId: String(roomData.documentId || roomData.id),
        checkIn: formData.check_in || '',
        checkOut: formData.check_out || '',
        name: formData.name || '',
        email: formData.email || '',
        phone: formData.phone || '',
      }).toString()}`
    )}`}
    style={{ color: GOLD, fontWeight: 600, textDecoration: 'none' }}
  >
    Register
  </Link>
</div>
          </div>
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox images={photos} initialIndex={selectedImageIndex} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}