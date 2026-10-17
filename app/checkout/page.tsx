'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
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

const DEFAULT_HINTS: Record<string, string> = {
  cbe: 'CBE app → Transactions → tap the payment → Reference ID (starts with "FT").',
  telebirr: 'Check your Telebirr SMS → find the code labeled "Transaction ID".',
  awash: 'Open your Awash app or SMS → copy the Reference Number.',
  siinqee: 'Open your Siinqee app or SMS → copy the Reference Number.',
  coopay: 'Open the Coopay SMS → copy the receipt LINK (http…) or token. The plain SMS ref will NOT work.',
};

const DEFAULT_SUPPORT_PHONE = '+251 911 000 000';
const DEFAULT_SUPPORT_EMAIL = 'booking@qafffamilyhotel.com';

type Bank = {
  bank_code: string;
  display_name: string;
  logo_url: string | null;
  qr_url: string | null;
  account_name: string | null;
  account_number: string | null;
  reference_label: string;
  reference_hint: string;
  reference_placeholder: string;
};

function getMediaUrl(media: any): string | null {
  if (!media) return null;
  if (media.url) return media.url;
  if (media.data?.attributes?.url) return media.data.attributes.url;
  if (media.data?.url) return media.data.url;
  if (media.attributes?.url) return media.attributes.url;
  if (Array.isArray(media) && media.length > 0) return getMediaUrl(media[0]);
  return null;
}

function buildImageUrl(rel: string | null): string | null {
  if (!rel) return null;
  if (rel.startsWith('http')) return rel;
  const base = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
  return `${base}${rel.startsWith('/') ? rel : `/${rel}`}`;
}

function shortLabel(name: string): string {
  const cleaned = name.replace(/[^A-Za-z ]/g, '').trim();
  if (!cleaned) return '?';
  const words = cleaned.split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
}

function refPlaceholderFor(code: string): string {
  if (code === 'cbe') return 'FT25XXXXXXXX or receipt link';
  if (code === 'telebirr') return 'e.g. DET8FJGUJ4';
  if (code === 'coopay') return 'Receipt link (http…) or token';
  return 'Reference number';
}

function refLabelFor(code: string, display: string): string {
  if (code === 'cbe') return 'CBE Reference ID';
  if (code === 'telebirr') return 'Telebirr Transaction ID';
  if (code === 'coopay') return 'Coopay Link or Token';
  if (code === 'awash') return 'Awash Reference';
  if (code === 'siinqee') return 'Siinqee Reference';
  return `${display} Reference`;
}

function bankFromComponent(entry: any): Bank {
  const code = String(entry.bank_code || '').trim();
  const display = entry.display_name || code.toUpperCase();
  return {
    bank_code: code,
    display_name: display,
    logo_url: buildImageUrl(getMediaUrl(entry.logo)),
    qr_url: buildImageUrl(getMediaUrl(entry.qr_code)),
    account_name: entry.account_name || null,
    account_number: entry.account_number || null,
    reference_label: entry.reference_label || refLabelFor(code, display),
    reference_hint: entry.reference_hint || DEFAULT_HINTS[code] || `Find the reference for ${display}.`,
    reference_placeholder: refPlaceholderFor(code),
  };
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const nameFromUrl = searchParams.get('name') || '';
  const emailFromUrl = searchParams.get('email') || '';
  const phoneFromUrl = searchParams.get('phone') || '';

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const [guestName, setGuestName] = useState(nameFromUrl);
  const [guestEmail, setGuestEmail] = useState(emailFromUrl);
  const [guestPhone, setGuestPhone] = useState(phoneFromUrl);
  const needsDetails = !nameFromUrl || !emailFromUrl || !phoneFromUrl;

  const [paymentBank, setPaymentBank] = useState('');
  const [verifyMode, setVerifyMode] = useState<'reference' | 'image'>('reference');
  const [reference, setReference] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [bookingDocId, setBookingDocId] = useState<string | null>(null);

  const { showAlert } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          fetch(`${STRAPI_URL}/api/payment-method?populate[banks][populate]=*`),
        ]);
        setRoom(roomData);
        let pm: any = null;
        try {
          const json = await paymentRes.json();
          pm = json?.data?.attributes || json?.data || null;
        } catch {
          pm = null;
        }
        setPaymentMethods(pm);

        let list: Bank[] = [];
        if (pm?.banks && Array.isArray(pm.banks) && pm.banks.length > 0) {
          list = pm.banks.map(bankFromComponent).filter((b: Bank) => !!b.bank_code);
        }
        setBanks(list);
        if (list.length > 0) setPaymentBank(list[0].bank_code);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }
    fetchData();
  }, [roomId]);

  const calculateDetails = () => {
    if (!checkInParam || !checkOutParam || !room) return { nights: 0, total: 0 };
    const inD = new Date(checkInParam);
    const outD = new Date(checkOutParam);
    const nights = Math.ceil((outD.getTime() - inD.getTime()) / 86400000);
    return { nights: nights > 0 ? nights : 0, total: nights > 0 ? nights * room.price : 0 };
  };
  const { nights, total } = calculateDetails();

  const goToPrevPhoto = () => {
    if (!room?.photos?.length) return;
    setCurrentPhotoIndex((p) => (p === 0 ? room.photos.length - 1 : p - 1));
  };
  const goToNextPhoto = () => {
    if (!room?.photos?.length) return;
    setCurrentPhotoIndex((p) => (p === room.photos.length - 1 ? 0 : p + 1));
  };

  const copyAccountNumber = async () => {
    const selectedBank = banks.find((b) => b.bank_code === paymentBank);
    if (!selectedBank?.account_number) return;
    try {
      await navigator.clipboard.writeText(selectedBank.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showAlert('Could not copy. Please select and copy manually.', 'warning');
    }
  };

  const ensureBooking = async (): Promise<string> => {
    if (bookingDocId) return bookingDocId;
    const data: any = {
      name: guestName,
      email: guestEmail,
      phone: guestPhone,
      room: room.documentId,
      check_in: checkInParam,
      check_out: checkOutParam,
      total: Number(total),
      payment_method: 'bank_transfer',
      payment_bank: paymentBank,
    };
    if (verifyMode === 'reference' && reference.trim()) {
      data.payment_reference = reference.trim();
    }
    const res = await fetch(`${STRAPI_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    const txt = await res.text();
    if (!res.ok) {
      let msg = 'Could not create your booking.';
      try {
        const j = JSON.parse(txt);
        if (j?.error?.message) msg = j.error.message;
      } catch {}
      throw new Error(msg);
    }
    const id = JSON.parse(txt)?.data?.documentId;
    if (!id) throw new Error('No booking ID returned.');
    setBookingDocId(id);
    return id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      showAlert('Please enter your name, email and phone.', 'warning');
      return;
    }
    if (verifyMode === 'reference' && reference.trim().length < 4) {
      showAlert('Please enter the reference number.', 'warning');
      return;
    }
    if (verifyMode === 'image' && !imageFile) {
      showAlert('Please choose a receipt image.', 'warning');
      return;
    }
    setSubmitting(true);

    try {
      const docId = await ensureBooking();
      let status = 'pending';
      let message = '';

      if (verifyMode === 'reference') {
        const r = await fetch(`${STRAPI_URL}/api/bookings/${docId}/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_bank: paymentBank,
            payment_reference: reference.trim(),
          }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error?.message || 'Could not verify.');
        status = j.status;
        message = j.message || '';
      } else {
        const fd = new FormData();
        fd.append('image', imageFile!);
        fd.append('payment_bank', paymentBank);
        const r = await fetch(`${STRAPI_URL}/api/bookings/${docId}/verify-payment-image`, { method: 'POST', body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error?.message || 'Could not verify image.');
        status = j.status;
        message = j.message || '';
      }

      if (status === 'verified' || status === 'pending') {
        const params = new URLSearchParams({
          name: guestName,
          email: guestEmail,
          checkIn: checkInParam!,
          checkOut: checkOutParam!,
          totalPrice: total.toString(),
          roomName: room.title,
          paymentMethod: 'bank_transfer',
          paymentStatus: status,
        });
        router.push(`/booking-confirmation?${params.toString()}`);
        return;
      }

      showAlert(message || 'We could not verify this payment. Please check the details and try again.', 'error');
    } catch (err: any) {
      showAlert(err.message || 'Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const supportPhone = paymentMethods?.support_phone || DEFAULT_SUPPORT_PHONE;
  const supportEmail = paymentMethods?.support_email || DEFAULT_SUPPORT_EMAIL;

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE }}>Loading…</div>;
  }

  if (!room || !roomId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE, padding: '1rem' }}>
        <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ color: DARK_NAVY }}>No room selected</h2>
          <p style={{ color: '#666' }}>Please pick a room first.</p>
          <Link href="/rooms" style={{ display: 'inline-block', background: DARK_NAVY, color: '#fff', padding: '0.7rem 2rem', borderRadius: '9999px', textDecoration: 'none', marginTop: '1rem' }}>
            Browse Rooms
          </Link>
        </div>
      </div>
    );
  }

  const selectedBank = banks.find((b) => b.bank_code === paymentBank) || banks[0];

  const changeLinkParams = new URLSearchParams({
    name: guestName,
    email: guestEmail,
    phone: guestPhone,
    checkIn: checkInParam || '',
    checkOut: checkOutParam || '',
  });

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeInUp 0.8s ease forwards; opacity: 0; }

        .contact-hero { background: ${DARK_NAVY}; padding: 3rem 1rem; text-align: center; border-bottom: 3px solid ${GOLD}; }
        .contact-hero .breadcrumb { font-size: 0.7rem; color: ${GOLD}; display: flex; align-items: center; justify-content: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; flex-wrap: wrap; }
        .contact-hero .breadcrumb a { color: ${GOLD}; text-decoration: none; transition: color 0.3s ease; }
        .contact-hero .breadcrumb a:hover { color: white; }
        .contact-hero h1 { font-size: 2.5rem; font-weight: 700; color: white; margin-bottom: 0.25rem; letter-spacing: 0.02em; }
        .contact-hero p { font-size: 0.9rem; color: rgba(255,255,255,0.7); max-width: 672px; margin: 0 auto; font-weight: 300; line-height: 1.6; }
        @media (max-width: 768px) { .contact-hero h1 { font-size: 1.8rem; } }

        .ck-label { font-size: 0.68rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; display: block; }
        .ck-input { width: 100%; padding: 0.7rem 0.85rem; border: 1px solid #E0E0E0; border-radius: 0.5rem; outline: none; font-size: 0.9rem; transition: border 0.2s; background: #FDFDFD; }
        .ck-input:focus { border-color: ${GOLD}; background: #fff; }
        .ck-btn { width: 100%; padding: 0.9rem; background: ${DARK_NAVY}; color: #fff; font-weight: 700; border: none; border-radius: 0.5rem; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
        .ck-btn:hover:not(:disabled) { background: ${GOLD}; color: ${DARK_NAVY}; }
        .ck-btn:disabled { opacity: 0.6; cursor: wait; }

        .bank-tile {
          width: 110px; height: 64px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 0.6rem;
          border: 2px solid #E8E8E8; background: #fff;
          cursor: pointer; transition: all 0.15s ease;
          padding: 8px;
          flex: 0 0 auto;
        }
        @media (max-width: 768px) {
          .bank-tile { width: 90px; height: 56px; padding: 6px; }
        }
        .bank-tile:hover { border-color: #C8A87C; transform: translateY(-1px); }
        .bank-tile.sel { border-color: ${GOLD}; background: #FBF7F0; box-shadow: 0 4px 12px rgba(200,168,124,0.18); }
        .bank-logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .bank-logo-fallback { width: 100%; height: 100%; border-radius: 0.4rem; background: ${DARK_NAVY}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; font-weight: 700; }

        .copy-btn {
          background: transparent; border: 1px solid #C8A87C; color: ${DARK_NAVY};
          font-size: 0.65rem; font-weight: 700; padding: 0.2rem 0.5rem;
          border-radius: 0.35rem; cursor: pointer; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 0.2rem; margin-left: 0.5rem;
          vertical-align: middle;
        }
        .copy-btn:hover { background: #FBF7F0; }
        .copy-btn.copied { background: #E8F5E9; border-color: #4CAF50; color: #2E7D32; }

        .ck-toggle { display: flex; gap: 0.5rem; }
        .ck-toggle label {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          padding: 0.65rem; border: 2px solid #E0E0E0; border-radius: 0.5rem;
          cursor: pointer; font-size: 0.8rem; font-weight: 600; color: ${DARK_NAVY};
          background: #fff; transition: all 0.15s;
        }
        .ck-toggle label.sel { border-color: ${GOLD}; background: #FBF7F0; }
      `}</style>

      <div style={{ minHeight: '100vh', background: BEIGE, paddingTop: isMobile ? '5rem' : '6.5rem' }}>
        {/* HERO */}
        <div className="contact-hero animate-in" style={{ padding: isMobile ? '2.5rem 1rem' : '4rem 1rem' }}>
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

        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: isMobile ? '1.25rem 0.85rem' : '2rem 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem' }}>

            {/* LEFT column — Your Details on TOP, then room card */}
            <ScrollReveal delay={100}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.85rem' : '1rem' }}>

                {/* Guest details — MOVED TO TOP */}
                <div style={{ background: '#FFFFFF', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', padding: isMobile ? '1rem' : '1.25rem 1.5rem' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: DARK_NAVY, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Your Details
                    <Link href={`/rooms/${room.documentId || room.id}?${changeLinkParams.toString()}`} style={{ fontSize: '0.72rem', color: GOLD, textDecoration: 'underline', fontWeight: 500, marginLeft: 'auto' }}>
                      Change
                    </Link>
                  </h3>
                  {needsDetails ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input className="ck-input" placeholder="Full name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                      <input className="ck-input" type="email" placeholder="Email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                      <input className="ck-input" type="tel" placeholder="Phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: '#555' }}>
                      <div><strong style={{ color: DARK_NAVY }}>Name:</strong> {guestName}</div>
                      <div><strong style={{ color: DARK_NAVY }}>Email:</strong> {guestEmail}</div>
                      <div><strong style={{ color: DARK_NAVY }}>Phone:</strong> {guestPhone}</div>
                    </div>
                  )}
                </div>

                {/* Room card — BELOW guest details */}
                <div style={{ background: '#FFFFFF', borderRadius: isMobile ? '1rem' : '1.5rem', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
                  {room.photos && room.photos.length > 0 ? (
                    <div style={{ position: 'relative', width: '100%', height: isMobile ? '200px' : '300px', flexShrink: 0, background: '#F0F0F0' }}>
                      <img src={`${STRAPI_URL}${room.photos[currentPhotoIndex].url}`} alt={`${room.title} - slide ${currentPhotoIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '9999px', fontSize: '0.75rem' }}>
                        {currentPhotoIndex + 1} / {room.photos.length}
                      </div>
                      <button onClick={goToPrevPhoto} type="button" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', fontSize: '1.1rem' }}>‹</button>
                      <button onClick={goToNextPhoto} type="button" style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', fontSize: '1.1rem' }}>›</button>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: isMobile ? '200px' : '300px', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Room Image</div>
                  )}

                  <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '0.25rem' }}>{room.title}</h3>
                    <p style={{ color: '#666', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <GuestIcon size={14} color="#666" /> {room.capacity || 4} Guests
                      <BedIcon size={14} color="#666" /> {room.bed_type || '2 Beds'}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: '1rem', paddingRight: isMobile ? '1rem' : '1.5rem', paddingBottom: isMobile ? '1rem' : '1.5rem', paddingLeft: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                      <span>Check-in:</span>
                      <span style={{ fontWeight: 500, color: DARK_NAVY }}>{checkInParam ? new Date(checkInParam).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                      <span>Check-out:</span>
                      <span style={{ fontWeight: 500, color: DARK_NAVY }}>{checkOutParam ? new Date(checkOutParam).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' }}>
                      <span>Nights:</span>
                      <span style={{ fontWeight: 500, color: DARK_NAVY }}>{nights}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: DARK_NAVY, marginTop: '0.4rem', paddingTop: '0.5rem', borderTop: '1px solid #E8E8E8' }}>
                      <span>Total:</span>
                      <span style={{ color: GOLD }}>ETB {total}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* RIGHT column — payment */}
            <ScrollReveal delay={200}>
              <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', borderRadius: isMobile ? '1rem' : '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.06)', padding: isMobile ? '1.15rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

                {/* Bank tiles */}
                <div>
                  <label className="ck-label">Choose Your Bank</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {banks.map((b) => (
                      <button
                        key={b.bank_code}
                        type="button"
                        title={b.display_name}
                        aria-label={b.display_name}
                        className={`bank-tile${paymentBank === b.bank_code ? ' sel' : ''}`}
                        onClick={() => { setPaymentBank(b.bank_code); setShowQr(false); }}
                      >
                        {b.logo_url ? (
                          <img src={b.logo_url} alt={b.display_name} className="bank-logo-img" />
                        ) : (
                          <div className="bank-logo-fallback">{shortLabel(b.display_name)}</div>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedBank && (
                    <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '0.5rem', textAlign: 'center' }}>
                      Selected: <strong style={{ color: DARK_NAVY }}>{selectedBank.display_name}</strong>
                    </div>
                  )}
                </div>

                {/* Account info */}
                {selectedBank && (
                  <div style={{ background: '#FBFBFB', borderRadius: '0.65rem', padding: '0.9rem 1rem', border: '1px solid #EEE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '0.15rem' }}>Pay to</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: DARK_NAVY, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace' }}>{selectedBank.account_number || '—'}</span>
                          {selectedBank.account_number && (
                            <button
                              type="button"
                              className={`copy-btn${copied ? ' copied' : ''}`}
                              onClick={copyAccountNumber}
                              title="Copy account number"
                            >
                              {copied ? '✓ Copied' : '📋 Copy'}
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#666' }}>
                          {selectedBank.account_name || ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '0.15rem' }}>Amount</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: GOLD }}>ETB {total}</div>
                      </div>
                    </div>
                    {selectedBank.qr_url && (
                      <div style={{ marginTop: '0.6rem' }}>
                        <button type="button" onClick={() => setShowQr((v) => !v)} style={{ background: 'none', border: 'none', color: DARK_NAVY, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                          {showQr ? 'Hide QR code' : 'Show QR code'}
                        </button>
                        {showQr && (
                          <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                            <img src={selectedBank.qr_url} alt="" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Verify mode toggle */}
                <div>
                  <label className="ck-label">How will you verify?</label>
                  <div className="ck-toggle">
                    <label className={verifyMode === 'reference' ? 'sel' : ''}>
                      <input type="radio" name="mode" value="reference" checked={verifyMode === 'reference'} onChange={() => setVerifyMode('reference')} style={{ display: 'none' }} />
                      Enter reference
                    </label>
                    <label className={verifyMode === 'image' ? 'sel' : ''}>
                      <input type="radio" name="mode" value="image" checked={verifyMode === 'image'} onChange={() => setVerifyMode('image')} style={{ display: 'none' }} />
                      Upload receipt
                    </label>
                  </div>
                </div>

                {/* Reference mode */}
                {verifyMode === 'reference' && selectedBank && (
                  <div>
                    <input className="ck-input" placeholder={selectedBank.reference_placeholder} value={reference} onChange={(e) => setReference(e.target.value)} />
                    <p style={{ fontSize: '0.72rem', color: '#777', marginTop: '0.5rem', lineHeight: 1.5 }}>
                      <strong style={{ color: DARK_NAVY }}>Where to find it:</strong> {selectedBank.reference_hint}
                    </p>
                  </div>
                )}

                {/* Upload mode */}
                {verifyMode === 'image' && (
                  <div>
                    <label htmlFor="ck-file" style={{ display: 'block', border: '2px dashed #C8A87C', borderRadius: '0.65rem', padding: '1.15rem', textAlign: 'center', cursor: 'pointer', background: imageFile ? '#FBF7F0' : '#FDFDFD' }}>
                      <div style={{ fontSize: '1.15rem', marginBottom: '0.2rem' }}>📎</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: DARK_NAVY }}>
                        {imageFile ? imageFile.name : 'Choose receipt image'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#999', marginTop: '0.15rem' }}>
                        JPG, PNG, GIF, WebP · max 8 MB
                      </div>
                    </label>
                    <input id="ck-file" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return setImageFile(null);
                      if (f.size > 8 * 1024 * 1024) { showAlert('Image is too large (max 8MB).', 'error'); return; }
                      setImageFile(f);
                    }} />
                  </div>
                )}

                <button type="submit" className="ck-btn" disabled={submitting}>
                  {submitting ? 'Verifying…' : 'Confirm Booking'}
                </button>

                <p style={{ fontSize: '0.68rem', color: '#aaa', textAlign: 'center', margin: 0 }}>
                  Need help? {supportPhone} · {supportEmail}
                </p>
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
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#666' }}>Loading…</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}