'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { renderRichText } from '../lib/api';
import AnimatedCounter from '../components/AnimatedCounter';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#15232E';
const BEIGE = '#ECEAE6';

function getMediaUrl(media: any) {
  if (!media) return null;
  if (typeof media === 'string') return media;
  if (media.url) return media.url;
  if (media.data?.attributes?.url) return media.data.attributes.url;
  if (media.data?.url) return media.data.url;
  if (media.attributes?.url) return media.attributes.url;
  if (Array.isArray(media) && media.length > 0) return getMediaUrl(media[0]);
  return null;
}

function buildImageUrl(relativeOrAbsolute: string | null) {
  if (!relativeOrAbsolute) return null;
  if (relativeOrAbsolute.startsWith('http')) return relativeOrAbsolute;
  const base = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
  const path = relativeOrAbsolute.startsWith('/') ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
  return `${base}${path}`;
}

export default function AboutPage() {
  const [screenWidth, setScreenWidth] = useState(0);
  const [about, setAbout] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth < 768;

  useEffect(() => {
    async function fetchData() {
      try {
        const aboutRes = await fetch(`${STRAPI_URL}/api/about?populate=*`);
        const aboutData = await aboutRes.json();
        setAbout(aboutData.data?.attributes || aboutData.data);

        const statsRes = await fetch(`${STRAPI_URL}/api/stats?populate=*&sort=Order`);
        const statsData = await statsRes.json();
        setStats(statsData.data || []);
      } catch (error) {
        console.error('Failed to fetch About or Stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '16px', color: '#666666' }}>Loading About Page...</p>
        </div>
      </div>
    );
  }

  const visionImgUrl = buildImageUrl(getMediaUrl(about?.Section_Image));

  return (
    <div style={{ minHeight: '100vh', color: '#1A1A1A', paddingTop: isMobile ? '5rem' : '6.5rem', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeInUp 0.8s ease forwards; opacity: 0; }

        /* ─── Contact-style hero (copied from Contact page) ─── */
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

      {/* ─── 1. HERO SECTION (Contact page style) ─── */}
      <div className="contact-hero animate-in" style={{ padding: isMobile ? '4rem 1rem' : '5rem 1rem' }}>
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span style={{ color: '#FFFFFF' }}>About Us</span>
        </div>
        <h1>{about?.Hero_Title || 'About Us'}</h1>
        <p>{about?.Hero_Subtitle || 'Discover the story behind our hospitality'}</p>
      </div>

      {/* ─── 2. OUR STORY & MISSION ─── */}
      <section style={{ padding: isMobile ? '3rem 1rem' : '4.5rem 1rem', background: BEIGE, borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '2.5rem' : '4rem' }}>
            <div className="animate-in">
              <h2 style={{fontSize: '2rem', fontWeight: 600, color: DARK_NAVY, marginBottom: '1rem' }}>
                {about?.Section_Title || 'Our Story'}
              </h2>
              <div style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.8' }}>
                {about?.Content ? (
                  <div dangerouslySetInnerHTML={{ __html: renderRichText(about.Content) }} />
                ) : (
                  <p>Welcome to our hospitality journey...</p>
                )}
              </div>
              <Link href="/rooms" style={{ display: 'inline-block', marginTop: '1.5rem', background: DARK_NAVY, color: '#FFFFFF', padding: '0.8rem 2.5rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = DARK_NAVY; }} onMouseLeave={(e) => { e.currentTarget.style.background = DARK_NAVY; e.currentTarget.style.color = '#FFFFFF'; }}>
                Discovery More
              </Link>
            </div>
            
            <div className="animate-in" style={{ borderLeft: isMobile ? 'none' : `2px solid ${GOLD}`, paddingLeft: isMobile ? '0' : '2rem' }}>
              <div style={{ color: '#444', fontSize: '1rem', lineHeight: '1.8', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                {about?.Mission_Text ? (
                  <div dangerouslySetInnerHTML={{ __html: `"${renderRichText(about.Mission_Text)}"` }} />
                ) : (
                  '"Our mission is to provide exceptional hospitality experiences that exceed our guests\' expectations."'
                )}
              </div>
              <div style={{fontSize: '1.8rem', color: DARK_NAVY, marginBottom: '0.25rem' }}>
                {about?.Mission_Title || 'Our Mission'}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#777', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                — {about?.Mission_Title || 'General Manager'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section style={{ padding: isMobile ? '2.5rem 1rem' : '4rem 1rem', background: '#FFFFFF', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '1.5rem' : '2rem' }}>
            <AnimatedCounter target={10} label="Years of Service" />
            <AnimatedCounter target={25} label="Luxury Rooms" />
            <AnimatedCounter target={500} label="Happy Guests" />
            <AnimatedCounter target={20} label="Professional Staff" />
          </div>
        </div>
      </section>

      {/* ─── 4. OUR VISION ─── */}
      <section style={{ padding: isMobile ? '3rem 1rem' : '4.5rem 1rem', background: BEIGE }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '2rem' : '3.5rem', alignItems: 'center' }}>
            <div className="animate-in">
              {visionImgUrl ? (
                <img src={visionImgUrl} alt="Section Visual" style={{ width: '100%', height: isMobile ? '250px' : '400px', objectFit: 'cover', borderRadius: '0.75rem', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }} />
              ) : (
                <div style={{ width: '100%', height: isMobile ? '250px' : '400px', background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: '0.75rem' }}>Add Section_Image</div>
              )}
            </div>
            
            <div className="animate-in">
              <span style={{ color: GOLD, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700, display: 'block', marginBottom: '0.75rem', borderTop: `2px solid ${GOLD}`, paddingTop: '1rem', width: '80px' }}>Our Vision</span>
              <h2 style={{fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: 600, color: DARK_NAVY, lineHeight: '1.2', marginBottom: '1rem' }}>
                {about?.Vision_Title || 'Experience the Extraordinary'}
              </h2>
              <div style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.8' }}>
                {about?.Vision_Text ? (
                  <div dangerouslySetInnerHTML={{ __html: renderRichText(about.Vision_Text) }} />
                ) : (
                  <p>Our vision is to create unforgettable moments through impeccable service and a deep sense of place.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. BOLD CTA ─── */}
      <section style={{ padding: isMobile ? '3rem 1rem' : '4.5rem 1rem', background: DARK_NAVY, textAlign: 'center', borderTop: `3px solid ${GOLD}` }}>
        <div className="animate-in" style={{ maxWidth: '672px', margin: '0 auto' }}>
          <h2 style={{fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Experience the Difference
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Make your next getaway unforgettable. Book your perfect room with us today.
          </p>
          <Link href="/rooms" style={{ display: 'inline-block', background: GOLD, color: DARK_NAVY, padding: '0.85rem 2.5rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.3s ease', letterSpacing: '0.05em' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(200,168,124,0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}