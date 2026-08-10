'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // ✅ Added Router
import { renderRichText } from '../../lib/api';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#B69B78';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

function ImageLightbox({ images, initialIndex, onClose }: {
  images: any[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const goToPrev = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
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
        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
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
        onClick={(e) => { e.stopPropagation(); goToNext(); }}
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
  const router = useRouter(); // ✅ Initialize Router

  // ─── Responsive Breakpoint Hook ──────────────────────────────
  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth < 768;
  // ──────────────────────────────────────────────────────────────

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const roomData = room;
  const photos = roomData?.photos || [];
  const amenities = roomData?.amenities || [];
  const detailsHtml = renderRichText(roomData?.details);

  // ─── Simplified Form State ──────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    check_in: '',
    check_out: '',
  });

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

  // ─── Redirect to Checkout Page ──────────────────────────────
  const handleProceedToCheckout = () => {
    // 1. Required fields validation
    if (!formData.name || !formData.email || !formData.phone || !formData.check_in || !formData.check_out) {
      alert('Please fill out all required fields before proceeding to checkout.');
      return;
    }

    // 2. ✅ Date validation (Check-out must be strictly after Check-in)
    const checkInDate = new Date(formData.check_in);
    const checkOutDate = new Date(formData.check_out);
    if (checkOutDate <= checkInDate) {
      alert('❌ Check-out must be after check-in.');
      return;
    }

    // 3. Redirect to Checkout with parameters
    const params = new URLSearchParams({
      roomId: roomData.documentId || roomData.id,
      checkIn: formData.check_in,
      checkOut: formData.check_out,
      adults: '1', // You can make this dynamic later if you want
      children: '0',
    });

    router.push(`/checkout?${params.toString()}`);
  };

  const goToPrevPhoto = () => setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  const goToNextPhoto = () => setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, color: '#1A1A1A', paddingTop: isMobile ? '56px' : '64px' }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .room-hero {
          position: relative;
          background: ${DARK_NAVY};
          padding: 3rem 0 2rem;
        }
        .room-hero .container {
          max-width: 1152px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        .room-hero .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          color: ${GOLD};
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
        }
        .room-hero .breadcrumb a {
          color: ${GOLD};
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .room-hero .breadcrumb a:hover { color: white; }
        .room-hero .breadcrumb span { color: #555; }
        .room-hero h1 {
      
          font-size: 2.2rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.25rem;
        }
        .room-hero .subtitle {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.05em;
        }
        @media (max-width: 768px) {
          .room-hero { padding: 2rem 0 1.5rem; }
          .room-hero h1 { font-size: 1.8rem; }
        }
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #E0E0E0;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s ease;
          background: #FAFAFA;
          color: #1A1A1A;
        }
        .form-input:focus {
          border-color: ${GOLD};
          background: #FFFFFF;
        }
        .book-btn {
          width: 100%;
          background: ${DARK_NAVY};
          color: #FFFFFF;
          padding: 0.8rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .book-btn:hover {
          background: ${GOLD};
          transform: scale(1.02);
        }
        .book-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>

      <div className="room-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/rooms">Rooms</Link>
            <span>/</span>
            <span style={{ color: 'white' }}>{roomData.title}</span>
          </div>
          <h1>{roomData.title}</h1>
          <div className="subtitle">
            •{roomData.capacity || 4} Guests • {roomData.bed_type || '2 Bedrooms'}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: isMobile ? '1.5rem 1rem' : '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: isMobile ? '1.5rem' : '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {photos.length > 0 && (
              <div style={{ position: 'relative', background: '#FFFFFF', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ position: 'relative', height: isMobile ? '240px' : '360px', overflow: 'hidden' }}>
                  <img src={`${STRAPI_URL}${photos[currentPhotoIndex].url}`} alt={`${roomData.title} - ${currentPhotoIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '9999px', fontSize: '0.8rem' }}>
                    {currentPhotoIndex + 1} / {photos.length}
                  </div>
                  <button onClick={goToPrevPhoto} style={{
                    position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%',
                    width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', cursor: 'pointer', transition: 'all 0.3s ease', zIndex: 5, fontSize: '1.2rem'
                  }} onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#1A1A1A'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = 'white'; }}>‹</button>
                  <button onClick={goToNextPhoto} style={{
                    position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%',
                    width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', cursor: 'pointer', transition: 'all 0.3s ease', zIndex: 5, fontSize: '1.2rem'
                  }} onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#1A1A1A'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = 'white'; }}>›</button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', padding: isMobile ? '0.5rem 0.75rem' : '0.75rem', overflowX: 'auto', background: '#F8F8F8', scrollbarWidth: 'thin' }}>
                  {photos.map((photo: any, idx: number) => (
                    <div key={idx} onClick={() => setCurrentPhotoIndex(idx)} style={{
                      width: isMobile ? '50px' : '70px', height: isMobile ? '35px' : '50px', flexShrink: 0, borderRadius: '0.4rem', overflow: 'hidden', cursor: 'pointer',
                      border: idx === currentPhotoIndex ? `2px solid ${GOLD}` : '2px solid transparent',
                      transition: 'all 0.3s ease', opacity: idx === currentPhotoIndex ? 1 : 0.5
                    }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = idx === currentPhotoIndex ? 1 : 0.5; }}>
                      <img src={`${STRAPI_URL}${photo.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: isMobile ? '1.5rem' : '1.5rem 2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.5rem' }}>About This Room</h2>
              <p style={{ color: '#555555', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '1rem' }}>{roomData.overview || 'Recently refurbished in an individual and elegant style, enjoy the comfort of a luxurious room. Upgrade to an immaculate view.'}</p>
              {detailsHtml && <div style={{ color: '#555555', fontSize: '0.9rem', lineHeight: '1.7' }}><div dangerouslySetInnerHTML={{ __html: detailsHtml }} /></div>}
            </div>

            {amenities.length > 0 && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: isMobile ? '1.5rem' : '1.5rem 2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                <h2 style={{fontSize: '1.1rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.5rem' }}>Amenities:</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem 0.5rem' }}>
                  {amenities.map((item: any, idx: number) => (
                    <span key={idx} style={{ fontSize: '0.85rem', color: '#444444', background: '#F5F5F5', padding: '0.2rem 0.7rem', borderRadius: '0.3rem' }}>{item?.name || 'Amenity'}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── SIMPLIFIED BOOKING FORM ───────────────────────── */}
          <div style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 'auto' : '80px', alignSelf: 'start' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: isMobile ? '1.25rem' : '1.5rem 1.5rem 2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
              <div style={{ textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid #E8E8E8', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: DARK_NAVY}}>ETB {roomData.price}</span>
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
                  <input type="date" name="check_in" value={formData.check_in} onChange={handleChange} required className="form-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: DARK_NAVY, display: 'block', marginBottom: '0.2rem' }}>CHECK - OUT <span style={{ color: '#CC3333' }}>*</span></label>
                  <input type="date" name="check_out" value={formData.check_out} onChange={handleChange} required className="form-input" />
                </div>

                {nights > 0 && (
                  <div style={{ background: DARK_NAVY, padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: GOLD }}>Total: ETB {total}</span>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{nights} nights × ETB {roomData.price}</div>
                  </div>
                )}

                {/* ─── REDIRECT BUTTON ─────────────────────────── */}
                <button 
                  type="button" 
                  onClick={handleProceedToCheckout} 
                  className="book-btn"
                >
                  PROCEED TO CHECKOUT
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={photos}
          initialIndex={selectedImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}