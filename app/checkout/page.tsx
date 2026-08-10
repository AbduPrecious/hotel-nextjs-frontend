// app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRoomById } from '../lib/api';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const adultsParam = searchParams.get('adults');
  const childrenParam = searchParams.get('children');

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ─── Form State ─────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    payment_method: 'screenshot',
    screenshot: null as File | null,
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Responsive Hook ────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Fetch Room Data ──────────────────────────────────────
  useEffect(() => {
    async function fetchRoom() {
      if (!roomId) return;
      const data = await getRoomById(roomId);
      setRoom(data);
      setLoading(false);
    }
    fetchRoom();
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
      alert('❌ Check-out must be after check-in.');
      setSubmitting(false);
      return;
    }

    const paymentMethod = formData.payment_method === 'cash' ? 'cash' : 'screenshot';
    if (paymentMethod === 'screenshot' && !formData.screenshot) {
      alert('❌ Please upload a payment screenshot.');
      setSubmitting(false);
      return;
    }

    const bookingData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      room: room.id,
      check_in: checkInParam,
      check_out: checkOutParam,
      total: Number(total),
      booking_status: 'Pending',
    };

    try {
      const res = await fetch(`${STRAPI_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: bookingData }),
      });

      if (!res.ok) throw new Error(`Strapi error (${res.status})`);
      const responseData = await res.json();
      const docId = responseData?.data?.documentId;

      if (paymentMethod === 'screenshot' && formData.screenshot && docId) {
        const fileFormData = new FormData();
        fileFormData.append('files', formData.screenshot);
        const uploadRes = await fetch(`${STRAPI_URL}/api/upload`, {
          method: 'POST',
          body: fileFormData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          const fileId = uploadData[0]?.id;
          if (fileId) {
            await fetch(`${STRAPI_URL}/api/bookings/${docId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: { screenshot: fileId } }),
            });
          }
        }
      }

      // Redirect to confirmation with query params
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
      alert(`❌ ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE,}}>Loading Checkout...</div>;
  }

  if (!room || !roomId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE, padding: '1rem', }}>
        <div style={{ background: '#FFFFFF', borderRadius: '1rem', padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: DARK_NAVY }}>Oops!</h2>
          <p style={{ color: '#666' }}>No room selected. Please select a room to book.</p>
          <Link href="/rooms" style={{ display: 'inline-block', background: DARK_NAVY, color: '#FFFFFF', padding: '0.7rem 2rem', borderRadius: '9999px', textDecoration: 'none', marginTop: '1rem' }}>Browse Rooms</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, paddingTop: isMobile ? '8rem' : '9rem', paddingBottom: '3rem', boxSizing: 'border-box',}}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 1rem' }}>
        <h2 style={{fontSize: '2rem', color: DARK_NAVY, fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>
          Checkout
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
          {/* ─── LEFT SIDE: Review Summary ──────────────────────── */}
          <div style={{ background: '#FFFFFF', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '1rem' }}>Booking Summary</h3>
            <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #E8E8E8' }}>
              {room.photos?.[0]?.url && (
                <img src={`${STRAPI_URL}${room.photos[0].url}`} alt={room.title} style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '0.5rem' }} />
              )}
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '1.1rem', color: DARK_NAVY }}>{room.title}</h4>
                <p style={{ color: '#666', fontSize: '0.85rem' }}>{room.capacity || 4} Guests • {room.bed_type || '2 Beds'}</p>
              </div>
            </div>
            <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                <span>Check-in:</span> <span>{checkInParam ? new Date(checkInParam).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                <span>Check-out:</span> <span>{checkOutParam ? new Date(checkOutParam).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                <span>Nights:</span> <span>{nights}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700, color: DARK_NAVY, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #E8E8E8' }}>
                <span>Total Price:</span> <span style={{ color: GOLD }}>ETB {total}</span>
              </div>
            </div>
          </div>

          {/* ─── RIGHT SIDE: Guest Details Form ────────────────── */}
          <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.5rem' }}>Guest Details</h3>

            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required style={{ width: '100%', padding: '0.7rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', outline: 'none', transition: 'border 0.3s ease' }} onFocus={(e) => e.currentTarget.style.borderColor = GOLD} onBlur={(e) => e.currentTarget.style.borderColor = '#E0E0E0'} />
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required style={{ width: '100%', padding: '0.7rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', outline: 'none', transition: 'border 0.3s ease' }} onFocus={(e) => e.currentTarget.style.borderColor = GOLD} onBlur={(e) => e.currentTarget.style.borderColor = '#E0E0E0'} />
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Phone Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+251 911 123 456" required style={{ width: '100%', padding: '0.7rem', border: '1px solid #E0E0E0', borderRadius: '0.5rem', outline: 'none', transition: 'border 0.3s ease' }} onFocus={(e) => e.currentTarget.style.borderColor = GOLD} onBlur={(e) => e.currentTarget.style.borderColor = '#E0E0E0'} />
            </div>

            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Payment Method *</label>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: `2px solid ${formData.payment_method === 'screenshot' ? GOLD : '#E0E0E0'}`, borderRadius: '0.5rem', cursor: 'pointer', background: formData.payment_method === 'screenshot' ? '#F9F6F0' : 'transparent', flex: 1, justifyContent: 'center' }}>
                  <input type="radio" name="payment_method" value="screenshot" checked={formData.payment_method === 'screenshot'} onChange={handlePaymentMethodChange} /> Screenshot
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: `2px solid ${formData.payment_method === 'cash' ? GOLD : '#E0E0E0'}`, borderRadius: '0.5rem', cursor: 'pointer', background: formData.payment_method === 'cash' ? '#F9F6F0' : 'transparent', flex: 1, justifyContent: 'center' }}>
                  <input type="radio" name="payment_method" value="cash" checked={formData.payment_method === 'cash'} onChange={handlePaymentMethodChange} /> Cash on Arrival
                </label>
              </div>
            </div>

            {formData.payment_method === 'screenshot' && (
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 600, color: '#777', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Payment Screenshot *</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} required style={{ width: '100%', padding: '0.5rem', border: '1px dashed #E0E0E0', borderRadius: '0.5rem', outline: 'none' }} />
              </div>
            )}

            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.85rem', background: DARK_NAVY, color: '#FFFFFF', fontWeight: 700, border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease', marginTop: '0.5rem' }} onMouseEnter={(e) => { if (!submitting) { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = DARK_NAVY; } }} onMouseLeave={(e) => { if (!submitting) { e.currentTarget.style.background = DARK_NAVY; e.currentTarget.style.color = '#FFFFFF'; } }}>
              {submitting ? 'Processing...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}