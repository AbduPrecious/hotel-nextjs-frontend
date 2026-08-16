'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoomById } from '../lib/api';
import ScrollReveal from '../components/ScrollReveal';
import { useAlert } from '../context/AlertContext';
import { BedIcon, GuestIcon } from '../components/Icons';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

function getMediaUrl(media: any) {
  if (!media) return null;
  if (media.url) return media.url;
  if (media.data?.attributes?.url) return media.data.attributes.url;
  if (media.data?.url) return media.data.url;
  if (media.attributes?.url) return media.attributes.url;
  if (Array.isArray(media) && media.length > 0) {
    return getMediaUrl(media[0]);
  }
  return null;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const nameParam = searchParams.get('name') || '';
  const emailParam = searchParams.get('email') || '';
  const phoneParam = searchParams.get('phone') || '';

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<any>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { showAlert } = useAlert();

  const goToPrevPhoto = () =>
    setCurrentPhotoIndex((prev) => (prev === 0 ? room.photos.length - 1 : prev - 1));
  const goToNextPhoto = () =>
    setCurrentPhotoIndex((prev) => (prev === room.photos.length - 1 ? 0 : prev + 1));

  const [formData, setFormData] = useState({
    name: nameParam,
    email: emailParam,
    phone: phoneParam,
    payment_method: 'bank_transfer',
    screenshot: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!roomId) return;
      try {
        const [roomData, paymentRes] = await Promise.all([
          getRoomById(roomId),
          fetch(`${STRAPI_URL}/api/payment-method?populate=*`),
        ]);
        setRoom(roomData);
        const paymentJson = await paymentRes.json();
        setPaymentMethods(paymentJson.data?.attributes || paymentJson.data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setLoading(false);
      }
    }
    fetchData();
  }, [roomId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      payment_method: value,
      screenshot: null,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, screenshot: e.target.files![0] }));
    }
  };

  const calculateDetails = () => {
    if (!checkInParam || !checkOutParam || !room) return { nights: 0, total: 0 };
    const inDate = new Date(checkInParam);
    const outDate = new Date(checkOutParam);
    const nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
    return { nights: nights > 0 ? nights : 0, total: nights > 0 ? nights * room.price : 0 };
  };

  const { nights, total } = calculateDetails();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  const checkInDate = new Date(checkInParam!);
  const checkOutDate = new Date(checkOutParam!);
  if (checkOutDate <= checkInDate) {
    showAlert('Check‑out must be after check‑in.', 'error');
    setSubmitting(false);
    return;
  }

  const paymentMethod = formData.payment_method;
  if (paymentMethod === 'bank_transfer' && !formData.screenshot) {
    showAlert('Please upload the bank transfer receipt or screenshot.', 'warning');
    setSubmitting(false);
    return;
  }

  // ─── 1. Get logged‑in user ID (if any) ──────────────────
  let userId = null;
  try {
    const token = localStorage.getItem('token'); // adjust if you store it differently
    if (token) {
      const userRes = await fetch(`${STRAPI_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        userId = userData.id; // Strapi user primary key (numeric or string)
      } else {
        console.warn('User not authenticated, booking will be unassigned.');
      }
    }
  } catch (error) {
    console.error('Failed to fetch user:', error);
  }

  // ─── 2. Prepare booking data ────────────────────────────
  const bookingData: any = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    room: room.documentId,      // room relation uses documentId
    check_in: checkInParam,
    check_out: checkOutParam,
    total: Number(total),
    booking_status: 'Pending',
    payment_method: paymentMethod,
  };

  // If the user is logged in, link the booking to them
  if (userId) {
    bookingData.user = userId;  // field name must match your Booking content‑type relation
  }

  try {
    // ─── 3. Create the booking ─────────────────────────────
    const res = await fetch(`${STRAPI_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: bookingData }),
    });

    const responseText = await res.text();
    if (!res.ok) {
      console.error('❌ Booking creation error:', responseText);
      throw new Error(`Booking creation failed (${res.status}): ${responseText}`);
    }

    const responseData = JSON.parse(responseText);
    const docId = responseData?.data?.documentId;
    if (!docId) throw new Error('No documentId returned from Strapi');

    // ─── 4. Upload screenshot (if bank transfer) ──────────
    if (paymentMethod === 'bank_transfer' && formData.screenshot) {
      const fileFormData = new FormData();
      fileFormData.append('files', formData.screenshot);

      const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
        method: 'POST',
        body: fileFormData,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error('❌ Upload error:', errText);
        throw new Error(`File upload failed (${uploadRes.status}): ${errText}`);
      }

      const uploadData = await uploadRes.json();
      const fileId = uploadData[0]?.id;
      if (!fileId) throw new Error('No file id returned from upload');

      // ─── 5. Attach screenshot to the booking ─────────────
      const updatePayload = { data: { screenshot: fileId } };
      const updateRes = await fetch(`${STRAPI_URL}/api/bookings/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error('❌ Update error:', errText);
        showAlert('Booking created, but screenshot attachment failed. Please contact support.', 'warning');
      }
    }

    // ─── 6. Redirect to confirmation ────────────────────────
    const params = new URLSearchParams({
      name: formData.name,
      email: formData.email,
      checkIn: checkInParam!,
      checkOut: checkOutParam!,
      totalPrice: total.toString(),
      roomName: room.title,
      paymentMethod: paymentMethod,
    });
    router.push(`/booking-confirmation?${params.toString()}`);
  } catch (error: any) {
    showAlert(error.message || 'Something went wrong', 'error');
  } finally {
    setSubmitting(false);
  }
};

  const buildImageUrl = (relativeOrAbsolute: string | null) => {
    if (!relativeOrAbsolute) return null;
    if (relativeOrAbsolute.startsWith('http')) return relativeOrAbsolute;
    const base = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
    const path = relativeOrAbsolute.startsWith('/') ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
    return `${base}${path}`;
  };

  const cbeQrUrl = buildImageUrl(getMediaUrl(paymentMethods?.cbe_qr_code));
  const telebirrQrUrl = buildImageUrl(getMediaUrl(paymentMethods?.telebirr_qr_code));

  useEffect(() => {
    if (!cbeQrUrl) console.warn('⚠️ CBE QR Image is missing in Strapi (field: cbe_qr_code)');
    if (!telebirrQrUrl) console.warn('⚠️ Telebirr QR Image is missing in Strapi (field: telebirr_qr_code)');
  }, [cbeQrUrl, telebirrQrUrl]);

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
        Loading Checkout...
      </div>
    );
  }

  if (!room || !roomId) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: BEIGE,
          padding: '1rem',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          <h2 style={{ color: DARK_NAVY }}>Oops!</h2>
          <p style={{ color: '#666' }}>No room selected. Please select a room to book.</p>
          <Link
            href="/rooms"
            style={{
              display: 'inline-block',
              background: DARK_NAVY,
              color: '#FFFFFF',
              padding: '0.7rem 2rem',
              borderRadius: '9999px',
              textDecoration: 'none',
              marginTop: '1rem',
            }}
          >
            Browse Rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeInUp 0.8s ease forwards; opacity: 0; }

        /* ─── Contact-style hero ──────────────────────────────── */
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
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: BEIGE, paddingTop: isMobile ? '5rem' : '6.5rem' }}>
        {/* ─── HERO (Contact page style) ─── */}
        <div className="contact-hero animate-in" style={{ padding: isMobile ? '4rem 1rem' : '5rem 1rem' }}>
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/rooms">Rooms</Link>
            <span>/</span>
            <Link href={`/rooms/${room.documentId || room.id}`}>{room.title}</Link>
            <span>/</span>
            <span style={{ color: '#FFFFFF' }}>Checkout</span>
          </div>
          <h1>{room.title}</h1>
          <p>
            {checkInParam && checkOutParam
              ? `Check-in: ${new Date(checkInParam).toLocaleDateString()}  |  Check-out: ${new Date(checkOutParam).toLocaleDateString()}`
              : 'Complete your booking'}
          </p>
        </div>

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '2rem',
            }}
          >
            {/* LEFT: Room Summary */}
            <ScrollReveal delay={100}>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '1.5rem',
                  padding: '1.5rem',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {room.photos && room.photos.length > 0 ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: isMobile ? '220px' : '300px',
                      borderRadius: '1rem',
                      overflow: 'hidden',
                      background: '#F0F0F0',
                    }}
                  >
                    <img
                      src={`${STRAPI_URL}${room.photos[currentPhotoIndex].url}`}
                      alt={`${room.title} - slide ${currentPhotoIndex + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
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
                      {currentPhotoIndex + 1} / {room.photos.length}
                    </div>
                    <button
                      onClick={goToPrevPhoto}
                      style={{
                        position: 'absolute',
                        left: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        border: 'none',
                        borderRadius: '50%',
                        width: isMobile ? '32px' : '40px',
                        height: isMobile ? '32px' : '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        zIndex: 5,
                        fontSize: isMobile ? '1rem' : '1.2rem',
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
                      onClick={goToNextPhoto}
                      style={{
                        position: 'absolute',
                        right: '0.5rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        border: 'none',
                        borderRadius: '50%',
                        width: isMobile ? '32px' : '40px',
                        height: isMobile ? '32px' : '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        zIndex: 5,
                        fontSize: isMobile ? '1rem' : '1.2rem',
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
                      height: isMobile ? '220px' : '300px',
                      background: '#F0F0F0',
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                    }}
                  >
                    No Room Image
                  </div>
                )}
                <div>
                  <h3
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 600,
                      color: DARK_NAVY,
                      marginBottom: '0.25rem',
                    }}
                  >
                    {room.title}
                  </h3>
                  <p
                    style={{
                      color: '#666',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <GuestIcon size={16} color="#666" /> {room.capacity || 4} Guests
                    <span style={{ color: '#ccc' }}></span>
                    <BedIcon size={16} color="#666" /> {room.bed_type || '2 Beds'}
                  </p>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #E8E8E8',
                    paddingTop: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                    <span>Check-in:</span>
                    <span style={{ fontWeight: 500, color: DARK_NAVY }}>
                      {checkInParam ? new Date(checkInParam).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                    <span>Check-out:</span>
                    <span style={{ fontWeight: 500, color: DARK_NAVY }}>
                      {checkOutParam ? new Date(checkOutParam).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                    <span>Nights:</span>
                    <span style={{ fontWeight: 500, color: DARK_NAVY }}>{nights}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      color: DARK_NAVY,
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #E8E8E8',
                    }}
                  >
                    <span>Total Price:</span>
                    <span style={{ color: GOLD }}>ETB {total}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* RIGHT: Form */}
            <ScrollReveal delay={300}>
              <form
                onSubmit={handleSubmit}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '1.5rem',
                  padding: '1.5rem',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.25rem' }}>
                  Guest Details
                </h3>

                <div>
                  <label
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#777',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      border: '1px solid #E0E0E0',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      transition: 'border 0.3s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#777',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      border: '1px solid #E0E0E0',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      transition: 'border 0.3s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#777',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+251 911 123 456"
                    required
                    style={{
                      width: '100%',
                      padding: '0.7rem',
                      border: '1px solid #E0E0E0',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      transition: 'border 0.3s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = GOLD)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: '#777',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Payment Method *
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: '0.5rem',
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        border: `2px solid ${formData.payment_method === 'bank_transfer' ? GOLD : '#E0E0E0'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        background: formData.payment_method === 'bank_transfer' ? '#F9F6F0' : 'transparent',
                        flex: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="bank_transfer"
                        checked={formData.payment_method === 'bank_transfer'}
                        onChange={handlePaymentMethodChange}
                      />{' '}
                      Bank Transfer
                    </label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        border: `2px solid ${formData.payment_method === 'cash' ? GOLD : '#E0E0E0'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        background: formData.payment_method === 'cash' ? '#F9F6F0' : 'transparent',
                        flex: 1,
                        justifyContent: 'center',
                      }}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value="cash"
                        checked={formData.payment_method === 'cash'}
                        onChange={handlePaymentMethodChange}
                      />{' '}
                      Cash on Arrival
                    </label>
                  </div>
                </div>

                {formData.payment_method === 'bank_transfer' && (
                  <div>
                    {paymentMethods ? (
                      <ScrollReveal delay={400}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            alignItems: 'stretch',
                          }}
                        >
                          <div
                            style={{
                              border: `1px solid ${GOLD}`,
                              borderRadius: '1rem',
                              padding: '1.5rem',
                              textAlign: 'center',
                              background: '#FBFBFB',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              height: '100%',
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  color: DARK_NAVY,
                                  marginBottom: '0.25rem',
                                }}
                              >
                                {paymentMethods.cbe_bank_name || 'CBE Transfer'}
                              </h4>
                              <p style={{ fontSize: '0.8rem', color: '#555' }}>
                                <strong>Acct:</strong> {paymentMethods.cbe_account_name || 'N/A'}
                              </p>
                              <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '1rem' }}>
                                <strong>Number:</strong> {paymentMethods.cbe_account_number || 'N/A'}
                              </p>
                            </div>
                            {cbeQrUrl ? (
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '180px',
                                  aspectRatio: '1/1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  borderRadius: '0.5rem',
                                  background: '#FFFFFF',
                                  border: '1px solid #E8E8E8',
                                }}
                              >
                                <img
                                  src={cbeQrUrl}
                                  alt="CBE QR"
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '180px',
                                  aspectRatio: '1/1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#999',
                                  fontSize: '0.75rem',
                                  background: '#F0F0F0',
                                  borderRadius: '0.5rem',
                                  border: '1px solid #E8E8E8',
                                }}
                              >
                                No QR
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              border: `1px solid ${GOLD}`,
                              borderRadius: '1rem',
                              padding: '1.5rem',
                              textAlign: 'center',
                              background: '#FBFBFB',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              height: '100%',
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  color: DARK_NAVY,
                                  marginBottom: '0.25rem',
                                }}
                              >
                                Telebirr
                              </h4>
                              <p style={{ fontSize: '0.8rem', color: '#555' }}>
                                <strong>Name:</strong> {paymentMethods.telebirr_name || 'N/A'}
                              </p>
                              <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '1rem' }}>
                                <strong>Number:</strong> {paymentMethods.telebirr_number || 'N/A'}
                              </p>
                            </div>
                            {telebirrQrUrl ? (
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '180px',
                                  aspectRatio: '1/1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  borderRadius: '0.5rem',
                                  background: '#FFFFFF',
                                  border: '1px solid #E8E8E8',
                                }}
                              >
                                <img
                                  src={telebirrQrUrl}
                                  alt="Telebirr QR"
                                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '180px',
                                  aspectRatio: '1/1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#999',
                                  fontSize: '0.75rem',
                                  background: '#F0F0F0',
                                  borderRadius: '0.5rem',
                                  border: '1px solid #E8E8E8',
                                }}
                              >
                                No QR
                              </div>
                            )}
                          </div>
                        </div>
                      </ScrollReveal>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#999', padding: '1rem' }}>
                        Loading payment details...
                      </div>
                    )}

                    <label
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#777',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Upload Bank Transfer Receipt/Screenshot *
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px dashed #E0E0E0',
                        borderRadius: '0.5rem',
                        outline: 'none',
                      }}
                    />
                    {formData.screenshot && (
                      <p style={{ fontSize: '0.75rem', color: GOLD, marginTop: '0.25rem' }}>
                        {formData.screenshot.name} uploaded
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: DARK_NAVY,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginTop: '0.5rem',
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = GOLD;
                      e.currentTarget.style.color = DARK_NAVY;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = DARK_NAVY;
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                >
                  {submitting ? 'Processing...' : 'Confirm Booking'}
                </button>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#666666' }}>Loading checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}