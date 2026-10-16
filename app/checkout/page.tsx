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

// ─── Default hints (fallback if Strapi hint is empty) ───
const DEFAULT_HINTS: Record<string, string> = {
  cbe: 'Open your CBE app → Transactions → tap the payment → copy the Reference ID (usually starts with "FT" and is 12+ characters).',
  telebirr: 'Check the Telebirr SMS you received → find the code labeled "Transaction ID" (e.g. DET8FJGUJ4).',
  awash: 'Open your Awash app or SMS → copy the Reference Number from the receipt.',
  siinqee: 'Open your Siinqee app or SMS → copy the Reference Number from the receipt.',
  coopay:
    'Open the Coopay Ebirr SMS → copy the receipt LINK (starts with http) or the case-sensitive token. The plain SMS ref number alone will NOT work.',
};

const DEFAULT_SUPPORT_PHONE = '+251 911 000 000';
const DEFAULT_SUPPORT_EMAIL = 'booking@qafffamilyhotel.com';

// ─── Internal bank type ───
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

function buildImageUrl(relativeOrAbsolute: string | null): string | null {
  if (!relativeOrAbsolute) return null;
  if (relativeOrAbsolute.startsWith('http')) return relativeOrAbsolute;
  const base = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
  const path = relativeOrAbsolute.startsWith('/')
    ? relativeOrAbsolute
    : `/${relativeOrAbsolute}`;
  return `${base}${path}`;
}

function shortLabel(name: string): string {
  // For fallback circle icon — take first 3-4 letters, uppercase
  const cleaned = name.replace(/[^A-Za-z ]/g, '').trim();
  if (!cleaned) return '?';
  const words = cleaned.split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();
}

function referenceLabelFor(code: string, display: string): string {
  if (code === 'cbe') return 'CBE Reference ID';
  if (code === 'telebirr') return 'Telebirr Transaction ID';
  if (code === 'coopay') return 'Coopay Receipt Link or Token';
  if (code === 'awash') return 'Awash Reference Number';
  if (code === 'siinqee') return 'Siinqee Reference Number';
  return `${display} Reference`;
}

function referencePlaceholderFor(code: string): string {
  if (code === 'cbe') return 'e.g. FT25XXXXXXXX or receipt link';
  if (code === 'telebirr') return 'e.g. DET8FJGUJ4';
  if (code === 'coopay') return 'Receipt link (http...) or token';
  if (code === 'awash') return 'e.g. AW12345678';
  if (code === 'siinqee') return 'e.g. SQ12345678';
  return 'Enter reference number';
}

// ─── Build a Bank object from Strapi's dynamic `banks[]` component ───
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
    reference_label: entry.reference_label || referenceLabelFor(code, display),
    reference_hint: entry.reference_hint || DEFAULT_HINTS[code] || `Find the reference for ${display} in your app or SMS.`,
    reference_placeholder:
      entry.reference_placeholder || referencePlaceholderFor(code),
  };
}

// ─── Legacy fallback: build CBE + Telebirr from old flat fields ───
function legacyBanks(pm: any): Bank[] {
  if (!pm) return [];
  const out: Bank[] = [];
  if (pm.cbe_account_number || pm.cbe_qr_code) {
    out.push({
      bank_code: 'cbe',
      display_name: pm.cbe_display_name || pm.cbe_bank_name || 'Commercial Bank of Ethiopia',
      logo_url: buildImageUrl(getMediaUrl(pm.cbe_logo)),
      qr_url: buildImageUrl(getMediaUrl(pm.cbe_qr_code)),
      account_name: pm.cbe_account_name || null,
      account_number: pm.cbe_account_number || null,
      reference_label: 'CBE Reference ID',
      reference_hint: pm.cbe_reference_hint || DEFAULT_HINTS.cbe,
      reference_placeholder: referencePlaceholderFor('cbe'),
    });
  }
  if (pm.telebirr_number || pm.telebirr_qr_code) {
    out.push({
      bank_code: 'telebirr',
      display_name: pm.telebirr_display_name || 'Telebirr',
      logo_url: buildImageUrl(getMediaUrl(pm.telebirr_logo)),
      qr_url: buildImageUrl(getMediaUrl(pm.telebirr_qr_code)),
      account_name: pm.telebirr_name || null,
      account_number: pm.telebirr_number || null,
      reference_label: 'Telebirr Transaction ID',
      reference_hint: pm.telebirr_reference_hint || DEFAULT_HINTS.telebirr,
      reference_placeholder: referencePlaceholderFor('telebirr'),
    });
  }
  return out;
}

// ═══════════════════════════════════════════════════════════
// MAIN CHECKOUT
// ═══════════════════════════════════════════════════════════
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
  const [banks, setBanks] = useState<Bank[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showQr, setShowQr] = useState(false);

  const { showAlert } = useAlert();

  const [failedState, setFailedState] = useState<{
    show: boolean;
    message: string;
    reference: string;
  }>({ show: false, message: '', reference: '' });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const goToPrevPhoto = () =>
    setCurrentPhotoIndex((prev) => (prev === 0 ? room.photos.length - 1 : prev - 1));
  const goToNextPhoto = () =>
    setCurrentPhotoIndex((prev) => (prev === room.photos.length - 1 ? 0 : prev + 1));

  const [formData, setFormData] = useState({
    name: nameParam,
    email: emailParam,
    phone: phoneParam,
    payment_method: 'bank_transfer',
    payment_bank: '',
    payment_reference: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingDocId, setBookingDocId] = useState<string | null>(null);

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
          const paymentJson = await paymentRes.json();
          pm = paymentJson.data?.attributes || paymentJson.data;
        } catch {
          // If populate=deep failed, retry with populate=*
          try {
            const retry = await fetch(`${STRAPI_URL}/api/payment-method?populate=*`);
            const retryJson = await retry.json();
            pm = retryJson.data?.attributes || retryJson.data;
          } catch {
            /* ignore */
          }
        }

        setPaymentMethods(pm);

        // Prefer new `banks[]` component; fall back to legacy cbe/telebirr
        let list: Bank[] = [];
        if (pm?.banks && Array.isArray(pm.banks) && pm.banks.length > 0) {
          list = pm.banks
            .map(bankFromComponent)
            .filter((b: Bank) => !!b.bank_code);
        } else {
          list = legacyBanks(pm);
        }

        setBanks(list);
        // Auto-select first bank
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, payment_bank: list[0].bank_code }));
        }
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
    if (name === 'payment_reference' || name === 'payment_bank') {
      setFailedState({ show: false, message: '', reference: '' });
      setImageFile(null);
    }
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, payment_method: value }));
    setFailedState({ show: false, message: '', reference: '' });
    setImageFile(null);
  };

  const handleBankChange = (bankCode: string) => {
    setFormData((prev) => ({ ...prev, payment_bank: bankCode }));
    setFailedState({ show: false, message: '', reference: '' });
    setImageFile(null);
    setShowQr(false); // collapse QR when switching banks
  };

  const calculateDetails = () => {
    if (!checkInParam || !checkOutParam || !room) return { nights: 0, total: 0 };
    const inDate = new Date(checkInParam);
    const outDate = new Date(checkOutParam);
    const nights = Math.ceil(
      (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { nights: nights > 0 ? nights : 0, total: nights > 0 ? nights * room.price : 0 };
  };

  const { nights, total } = calculateDetails();

  const ensureBooking = async (): Promise<string> => {
    if (bookingDocId) return bookingDocId;

    const paymentMethod = formData.payment_method;
    const reference = formData.payment_reference.trim();

    const bookingData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      room: room.documentId,
      check_in: checkInParam,
      check_out: checkOutParam,
      total: Number(total),
      payment_method: paymentMethod,
    };
    if (paymentMethod === 'bank_transfer') {
      bookingData.payment_bank = formData.payment_bank;
      bookingData.payment_reference = reference;
    }

    const res = await fetch(`${STRAPI_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: bookingData }),
    });
    const responseText = await res.text();
    if (!res.ok) {
      console.error('❌ Strapi error:', responseText);
      let message = 'Could not create your booking. Please try again.';
      try {
        const errJson = JSON.parse(responseText);
        if (res.status === 400 && errJson?.error?.message) message = errJson.error.message;
      } catch {
        /* keep generic */
      }
      throw new Error(message);
    }
    const docId = JSON.parse(responseText)?.data?.documentId;
    if (!docId) throw new Error('Booking was created but no ID was returned.');
    setBookingDocId(docId);
    return docId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const checkInDate = new Date(checkInParam!);
    const checkOutDate = new Date(checkOutParam!);
    if (checkOutDate <= checkInDate) {
      showAlert('Check-out must be after check-in.', 'error');
      setSubmitting(false);
      return;
    }

    const paymentMethod = formData.payment_method;
    const reference = formData.payment_reference.trim();
    if (paymentMethod === 'bank_transfer' && reference.length < 6) {
      showAlert('Please enter the reference number from your payment receipt.', 'warning');
      setSubmitting(false);
      return;
    }

    try {
      const docId = await ensureBooking();

      let paymentStatus = 'cash';
      if (paymentMethod === 'bank_transfer') {
        const vRes = await fetch(`${STRAPI_URL}/api/bookings/${docId}/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_bank: formData.payment_bank,
            payment_reference: reference,
          }),
        });
        const vJson = await vRes.json().catch(() => ({}));
        if (!vRes.ok) {
          throw new Error(vJson?.error?.message || 'Could not verify your payment right now.');
        }
        paymentStatus = vJson.status;

        if (paymentStatus === 'failed') {
          setFailedState({
            show: true,
            message:
              vJson.message ||
              'We could not find this reference. Try a different one, or upload your receipt image.',
            reference,
          });
          showAlert(
            vJson.message || 'We could not verify this payment. Please try the options below.',
            'error'
          );
          setSubmitting(false);
          return;
        }
      }

      const params = new URLSearchParams({
        name: formData.name,
        email: formData.email,
        checkIn: checkInParam!,
        checkOut: checkOutParam!,
        totalPrice: total.toString(),
        roomName: room.title,
        paymentMethod,
        paymentStatus,
      });
      router.push(`/booking-confirmation?${params.toString()}`);
    } catch (error: any) {
      showAlert(error.message || 'Something went wrong', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageVerify = async () => {
    if (!imageFile) {
      showAlert('Please choose an image first.', 'warning');
      return;
    }
    if (!bookingDocId) {
      showAlert('Booking missing. Please submit the form first.', 'error');
      return;
    }
    setUploadingImage(true);

    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      fd.append('payment_bank', formData.payment_bank);

      const res = await fetch(
        `${STRAPI_URL}/api/bookings/${bookingDocId}/verify-payment-image`,
        { method: 'POST', body: fd }
      );
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error?.message || 'Could not verify the image right now.');
      }

      const status = json.status;
      if (status === 'verified') {
        const params = new URLSearchParams({
          name: formData.name,
          email: formData.email,
          checkIn: checkInParam!,
          checkOut: checkOutParam!,
          totalPrice: total.toString(),
          roomName: room.title,
          paymentMethod: formData.payment_method,
          paymentStatus: 'verified',
        });
        router.push(`/booking-confirmation?${params.toString()}`);
        return;
      }

      if (status === 'failed') {
        showAlert(
          json.message || 'We still could not verify this receipt. Please contact support.',
          'error'
        );
      } else {
        showAlert(
          json.message ||
            'Your receipt is being checked. Please wait a moment and try again.',
          'warning'
        );
      }
    } catch (error: any) {
      showAlert(error.message || 'Image verification failed.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const supportPhone = paymentMethods?.support_phone || DEFAULT_SUPPORT_PHONE;
  const supportEmail = paymentMethods?.support_email || DEFAULT_SUPPORT_EMAIL;

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

  const selectedBank = banks.find((b) => b.bank_code === formData.payment_bank) || banks[0];

  return (
    <>
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
        }

        .bank-icon-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.6rem 0.5rem;
          border-radius: 0.75rem;
          border: 2px solid #E0E0E0;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1 1 calc(33.333% - 0.5rem);
          min-width: 90px;
          max-width: 140px;
        }
        .bank-icon-btn:hover {
          border-color: #C8A87C;
          transform: translateY(-2px);
        }
        .bank-icon-btn.selected {
          border-color: ${GOLD};
          background: #F9F6F0;
          box-shadow: 0 4px 12px rgba(200,168,124,0.2);
        }
        .bank-icon-img {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }
        .bank-icon-fallback {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${DARK_NAVY};
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.7rem;
          letter-spacing: 0.03em;
        }
        .bank-icon-label {
          font-size: 0.68rem;
          font-weight: 600;
          color: ${DARK_NAVY};
          text-align: center;
          line-height: 1.15;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .show-qr-btn {
          background: transparent;
          border: 1px dashed ${GOLD};
          color: ${DARK_NAVY};
          padding: 0.35rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.4rem;
        }
        .show-qr-btn:hover {
          background: #F9F6F0;
        }
        .qr-expand {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: #FFFFFF;
          border: 1px solid #E8E8E8;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeInUp 0.3s ease;
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          background: BEIGE,
          paddingTop: isMobile ? '5rem' : '6.5rem',
        }}
      >
        <div
          className="contact-hero animate-in"
          style={{ padding: isMobile ? '4rem 1rem' : '5rem 1rem' }}
        >
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
            {/* ─── LEFT: Room Summary ─── */}
            <ScrollReveal delay={100}>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '1.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {room.photos && room.photos.length > 0 ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: isMobile ? '220px' : '300px',
                      flexShrink: 0,
                      background: '#F0F0F0',
                    }}
                  >
                    <img
                      src={`${STRAPI_URL}${room.photos[currentPhotoIndex].url}`}
                      alt={`${room.title} - slide ${currentPhotoIndex + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
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
                      type="button"
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
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: isMobile ? '1rem' : '1.2rem',
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={goToNextPhoto}
                      type="button"
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
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: isMobile ? '1rem' : '1.2rem',
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                    }}
                  >
                    No Room Image
                  </div>
                )}

                <div style={{ padding: '1.5rem' }}>
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
                    padding: '1.5rem',
                    paddingTop: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.9rem',
                      color: '#555',
                    }}
                  >
                    <span>Check-in:</span>
                    <span style={{ fontWeight: 500, color: DARK_NAVY }}>
                      {checkInParam ? new Date(checkInParam).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.9rem',
                      color: '#555',
                    }}
                  >
                    <span>Check-out:</span>
                    <span style={{ fontWeight: 500, color: DARK_NAVY }}>
                      {checkOutParam ? new Date(checkOutParam).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.9rem',
                      color: '#555',
                    }}
                  >
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

            {/* ─── RIGHT: Form ─── */}
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
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: DARK_NAVY,
                    marginBottom: '0.25rem',
                  }}
                >
                  Guest Details
                </h3>

                {[
                  { label: 'Full Name *', name: 'name', type: 'text', placeholder: 'John Doe' },
                  {
                    label: 'Email *',
                    name: 'email',
                    type: 'email',
                    placeholder: 'you@example.com',
                  },
                  {
                    label: 'Phone Number *',
                    name: 'phone',
                    type: 'tel',
                    placeholder: '+251 911 123 456',
                  },
                ].map((f) => (
                  <div key={f.name}>
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
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      name={f.name}
                      value={(formData as any)[f.name]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      required
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        border: '1px solid #E0E0E0',
                        borderRadius: '0.5rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                ))}

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
                    {[
                      { v: 'bank_transfer', label: 'Bank Transfer' },
                      { v: 'cash', label: 'Cash on Arrival' },
                    ].map((m) => (
                      <label
                        key={m.v}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          border: `2px solid ${
                            formData.payment_method === m.v ? GOLD : '#E0E0E0'
                          }`,
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          background:
                            formData.payment_method === m.v ? '#F9F6F0' : 'transparent',
                          flex: 1,
                          justifyContent: 'center',
                        }}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          value={m.v}
                          checked={formData.payment_method === m.v}
                          onChange={handlePaymentMethodChange}
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>

                {formData.payment_method === 'bank_transfer' && banks.length > 0 && (
                  <div>
                    <label
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: '#777',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '0.6rem',
                      }}
                    >
                      Choose your bank *
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '1.25rem',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                      }}
                    >
                      {banks.map((b) => (
                        <button
                          type="button"
                          key={b.bank_code}
                          className={`bank-icon-btn${
                            formData.payment_bank === b.bank_code ? ' selected' : ''
                          }`}
                          onClick={() => handleBankChange(b.bank_code)}
                        >
                          {b.logo_url ? (
                            <img
                              src={b.logo_url}
                              alt={b.display_name}
                              className="bank-icon-img"
                            />
                          ) : (
                            <div className="bank-icon-fallback">
                              {shortLabel(b.display_name)}
                            </div>
                          )}
                          <span className="bank-icon-label">{b.display_name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Selected bank card */}
                    {selectedBank && (
                      <div
                        style={{
                          border: `1px solid ${GOLD}`,
                          borderRadius: '1rem',
                          padding: '1.25rem',
                          background: '#FBFBFB',
                          marginBottom: '1.25rem',
                        }}
                      >
                        <h4
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: DARK_NAVY,
                            marginBottom: '0.6rem',
                            textAlign: 'center',
                          }}
                        >
                          {selectedBank.display_name}
                        </h4>

                        <div>
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: '#555',
                              marginBottom: '0.25rem',
                            }}
                          >
                            <strong>Account Name:</strong>{' '}
                            {selectedBank.account_name || 'N/A'}
                          </p>
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: '#555',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <strong>Account Number:</strong>{' '}
                            <span
                              style={{
                                fontFamily: 'monospace',
                                background: '#FFFFFF',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '0.25rem',
                                border: '1px solid #E8E8E8',
                                fontSize: '0.85rem',
                              }}
                            >
                              {selectedBank.account_number || 'N/A'}
                            </span>
                          </p>
                          <p
                            style={{
                              fontSize: '0.85rem',
                              color: DARK_NAVY,
                              fontWeight: 700,
                              marginBottom: '0.3rem',
                            }}
                          >
                            Amount to send: ETB {total}
                          </p>

                          {selectedBank.qr_url && (
                            <>
                              <button
                                type="button"
                                className="show-qr-btn"
                                onClick={() => setShowQr((v) => !v)}
                              >
                                {showQr ? '▾ Hide QR code' : '▸ Show QR code'}
                              </button>
                              {showQr && (
                                <div className="qr-expand">
                                  <img
                                    src={selectedBank.qr_url}
                                    alt={`${selectedBank.display_name} QR`}
                                    style={{
                                      width: '200px',
                                      height: '200px',
                                      objectFit: 'contain',
                                    }}
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Reference input */}
                    {selectedBank && (
                      <>
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
                          {selectedBank.reference_label} *
                        </label>
                        <input
                          type="text"
                          name="payment_reference"
                          value={formData.payment_reference}
                          onChange={handleChange}
                          required
                          placeholder={selectedBank.reference_placeholder}
                          style={{
                            width: '100%',
                            padding: '0.7rem',
                            border: '1px solid #E0E0E0',
                            borderRadius: '0.5rem',
                            outline: 'none',
                          }}
                        />
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: '#777',
                            marginTop: '0.4rem',
                            lineHeight: 1.5,
                          }}
                        >
                          <strong style={{ color: DARK_NAVY }}>Where do I find this?</strong>{' '}
                          {selectedBank.reference_hint}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Failure fallback */}
                {failedState.show && (
                  <div
                    style={{
                      background: 'rgba(220, 53, 69, 0.06)',
                      border: '1px solid rgba(220, 53, 69, 0.25)',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ fontSize: '1.25rem' }}>⚠️</div>
                      <div>
                        <p
                          style={{
                            fontWeight: 700,
                            color: '#B02A37',
                            fontSize: '0.85rem',
                            marginBottom: '0.15rem',
                          }}
                        >
                          We couldn't find this reference
                        </p>
                        <p
                          style={{
                            fontSize: '0.8rem',
                            color: '#555',
                            lineHeight: 1.5,
                          }}
                        >
                          {failedState.message}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: '1px dashed rgba(220,53,69,0.25)',
                        paddingTop: '0.75rem',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: DARK_NAVY,
                          fontWeight: 600,
                          marginBottom: '0.25rem',
                        }}
                      >
                        Option 1 — Fix the reference and try again
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#666' }}>
                        Edit the reference above and click Confirm Booking again.
                      </p>
                    </div>

                    <div
                      style={{
                        borderTop: '1px dashed rgba(220,53,69,0.25)',
                        paddingTop: '0.75rem',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: DARK_NAVY,
                          fontWeight: 600,
                          marginBottom: '0.25rem',
                        }}
                      >
                        Option 2 — Upload a screenshot of your receipt
                      </p>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          marginBottom: '0.5rem',
                        }}
                      >
                        We'll read the reference directly from the image. JPG, PNG, GIF, or WebP —
                        max 8 MB.
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) {
                            setImageFile(null);
                            return;
                          }
                          if (f.size > 8 * 1024 * 1024) {
                            showAlert('Image is too large. Max 8 MB.', 'error');
                            setImageFile(null);
                            return;
                          }
                          setImageFile(f);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px dashed #C8A87C',
                          borderRadius: '0.5rem',
                          background: '#FFFFFF',
                          fontSize: '0.8rem',
                        }}
                      />

                      {imageFile && (
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: '#555',
                            marginTop: '0.35rem',
                          }}
                        >
                          Selected: <strong>{imageFile.name}</strong>
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleImageVerify}
                        disabled={!imageFile || uploadingImage}
                        style={{
                          marginTop: '0.6rem',
                          width: '100%',
                          padding: '0.7rem',
                          background: imageFile && !uploadingImage ? GOLD : '#DDD',
                          color: imageFile && !uploadingImage ? DARK_NAVY : '#888',
                          fontWeight: 700,
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor:
                            imageFile && !uploadingImage ? 'pointer' : 'not-allowed',
                          fontSize: '0.85rem',
                        }}
                      >
                        {uploadingImage ? 'Reading receipt...' : 'Verify with receipt image'}
                      </button>
                    </div>

                    <div
                      style={{
                        borderTop: '1px dashed rgba(220,53,69,0.25)',
                        paddingTop: '0.5rem',
                        fontSize: '0.75rem',
                        color: '#666',
                      }}
                    >
                      Still stuck? Contact us: <strong>{supportPhone}</strong> ·{' '}
                      <strong>{supportEmail}</strong>
                    </div>
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
                    cursor: submitting ? 'wait' : 'pointer',
                    marginTop: '0.5rem',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting
                    ? formData.payment_method === 'bank_transfer'
                      ? 'Verifying payment...'
                      : 'Processing...'
                    : 'Confirm Booking'}
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
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: '#666666' }}>Loading checkout...</p>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}