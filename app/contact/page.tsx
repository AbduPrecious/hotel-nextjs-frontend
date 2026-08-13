'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#15232E'; // 🟢 Updated to your requested color
const BEIGE = '#ECEAE6';

// ─── Scroll Reveal Component ──────────────────────────────
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }
      },
      { threshold: 0.1 }
    );

    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`;
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return <div ref={ref}>{children}</div>;
}

export default function ContactPage() {
  const [hotelInfo, setHotelInfo] = useState<any>(null);
  const [contactData, setContactData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // ─── Responsive Hook ──────────────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Fetch Data from Strapi ──────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        const [hotelRes, contactRes] = await Promise.all([
          fetch(`${STRAPI_URL}/api/hotel-detail?populate=*`),
          fetch(`${STRAPI_URL}/api/contact?populate=*`),
        ]);

        const hotelData = await hotelRes.json();
        const contactData = await contactRes.json();

        setHotelInfo(hotelData.data?.attributes || hotelData.data);
        setContactData(contactData.data?.attributes || contactData.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('Sending your message...');

    try {
      const payload = {
        data: {
          Name: formData.name,
          Email: formData.email,
          Phone: formData.phone,
          Subject: formData.subject,
          Message: formData.message,
        },
      };

      const response = await fetch(`${STRAPI_URL}/api/contact-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(' Message sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      } else {
        const errorMsg = data?.error?.message || data?.error?.details?.message || 'Failed to send message.';
        setStatus('error');
        setMessage(`❌ ${errorMsg}`);
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      setStatus('error');
      setMessage('❌ Failed to send message. Please try again.');
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  // ─── Strapi Data Mapping ─────────────────────────────────
  const hotelName = hotelInfo?.name || 'Jalo Hotel';
  const address = hotelInfo?.address || 'Shashamane, Ethiopia';
  const phone = hotelInfo?.phone || '+251-912-345678';
  const email = hotelInfo?.email || 'info@jalohotel.com';
  const workingHours = contactData?.working_hours || '24/7 - Always Open';
  const heroTitle = contactData?.Hero_Title || 'Contact Us';
  const heroSubtitle = contactData?.Hero_Subtitle || "We'd love to hear from you. Reach out to us for any inquiries or bookings.";
  const mapEmbed = contactData?.Map_Embed || contactData?.googleMapsEmbed;

  return (
    <div style={{ minHeight: '100vh', color: '#1A1A1A', paddingTop: isMobile ? '5rem' : '6.5rem', boxSizing: 'border-box' }}>
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

        .contact-grid {
          max-width: 1180px;
          margin: 0 auto;
          padding: 4rem 1rem;
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 3rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .contact-grid { grid-template-columns: 1fr; gap: 2.5rem; }
        }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          background: #F8F8F8;
          border: 1px solid #E8E8E8;
          border-radius: 1rem;
          transition: all 0.3s ease;
        }
        .info-card:hover {
          border-color: ${GOLD};
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.04);
        }
        .info-card .icon { font-size: 1.5rem; flex-shrink: 0; }
        .info-card h4 {
          font-size: 1rem;
          font-weight: 600;
          color: ${DARK_NAVY};
          margin: 0 0 0.1rem 0;
        }
        .info-card p {
          font-size: 0.85rem;
          color: #666;
          margin: 0;
          line-height: 1.4;
        }

        .form-wrapper {
          background: #FFFFFF;
          border: 1px solid #E8E8E8;
          border-radius: 1.5rem;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
        }
        .form-wrapper h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: ${DARK_NAVY};
          margin-bottom: 1.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        .form-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #777;
          display: block;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 0.7rem 0.75rem;
          border: 1px solid #E0E0E0;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s ease;
          background: #FAFAFA;
          color: ${DARK_NAVY};
          font-family: inherit;
        }
        .form-group input:focus, .form-group textarea:focus {
          border-color: ${GOLD};
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(200,168,124,0.1);
        }
        .form-group textarea { resize: vertical; min-height: 120px; }
        
        .submit-btn {
          width: 100%;
          background: ${DARK_NAVY};
          color: white;
          padding: 0.8rem;
          border: none;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .submit-btn:hover:not(:disabled) {
          background: ${GOLD};
          color: ${DARK_NAVY};
          transform: scale(1.02);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .status-message {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          text-align: center;
          margin-top: 1rem;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .status-message.success {
          background: rgba(200,168,124,0.1);
          border: 1px solid ${GOLD};
          color: ${DARK_NAVY};
        }
        .status-message.error {
          background: rgba(229,62,62,0.05);
          border: 1px solid #E53E3E;
          color: #E53E3E;
        }
        .map-section {
          width: 100%;
          height: 300px;
          background: #F0F0F0;
          overflow: hidden;
        }
        .map-section iframe { width: 100%; height: 100%; border: 0; }
        
        @media (max-width: 768px) {
          .contact-hero h1 { font-size: 2rem; }
          .form-wrapper { padding: 1.25rem; }
        }
      `}</style>

      {/* ─── 1. ANIMATED HERO ─────────────────────────────────── */}
     <div className="contact-hero animate-in" style={{ padding: isMobile ? '4rem 1rem' : '5rem 1rem' }}>
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span style={{ color: '#FFFFFF' }}>Contact</span>
        </div>
        <h1>{heroTitle}</h1>
        <p>{heroSubtitle}</p>
      </div>

      {/* ─── 2. STAGGERED CONTENT ────────────────────────────── */}
      <div className="contact-grid">
        
        {/* ─── Left: Contact Info ─── */}
        <ScrollReveal delay={100}>
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: DARK_NAVY, marginBottom: '0.5rem' }}>Get in Touch</h2>
              <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.7' }}>
                Have questions or ready to book? Reach out and we'll get back to you as soon as possible.
              </p>
            </div>

            <div className="info-card">
              <div className="icon"></div>
              <div><h4>Address</h4><p>{address}</p></div>
            </div>
            <div className="info-card">
              <div className="icon"></div>
              <div><h4>Phone</h4><p>{phone}</p></div>
            </div>
            <div className="info-card">
              <div className="icon"></div>
              <div><h4>Email</h4><p>{email}</p></div>
            </div>
            <div className="info-card">
              <div className="icon"></div>
              <div><h4>Working Hours</h4><p>{workingHours}</p></div>
            </div>
          </div>
        </ScrollReveal>

        {/* ─── Right: Contact Form ─── */}
        <ScrollReveal delay={300}>
          <div className="animate-in form-wrapper">
            <h2>Send Us a Message</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+251 911 123 456" />
              </div>
              <div className="form-group">
                <label>Subject *</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Booking Inquiry" required />
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us how we can help..." required />
              </div>

              <button type="submit" disabled={status === 'loading'} className="submit-btn">
                {status === 'loading' ? 'Sending...' : 'Send Message'}
              </button>

              {status === 'success' && <div className="status-message success">{message}</div>}
              {status === 'error' && <div className="status-message error">{message}</div>}
            </form>
          </div>
        </ScrollReveal>

      </div>

      {/* ─── 3. MAP SECTION ───────────────────────────────────── */}
      {mapEmbed && (
        <div className="map-section animate-in" style={{ animationDelay: '500ms' }}>
          <iframe src={mapEmbed} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Hotel Location Map" />
        </div>
      )}
    </div>
  );
}