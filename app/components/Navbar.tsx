// app/components/Navbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD_GRADIENT = 'linear-gradient(135deg, #C8A87C 0%, #E8D5B8 50%, #C8A87C 100%)';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hotel, setHotel] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // Responsive state for the top bar
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchHotel() {
      try {
        const res = await fetch(`${STRAPI_URL}/api/hotel-detail?populate=*`);
        const data = await res.json();
        setHotel(data.data?.attributes || data.data);
      } catch (error) {
        console.error('Failed to fetch hotel:', error);
      }
    }
    fetchHotel();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const hotelName = hotel?.name || 'Hotel';
  const logoUrl = hotel?.logo?.url || null;

  // ─── UPDATED NAV LINKS (Dashboard removed) ───────────────
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      
      {/* ========================================================== */}
      {/* ─── RESPONSIVE TOP BAR (FIXED DESKTOP SPACING) ──────────── */}
      {/* ========================================================== */}
      <div style={{
        background: '#17232E',
        color: '#FFFFFF',
        padding: isMobile ? '0.8rem 1rem' : '0.6rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: isMobile ? '0.65rem' : '0.75rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        // ✅ Fixed: Space-between on desktop, Center on mobile
        justifyContent: isMobile ? 'center' : 'space-between',
        flexWrap: 'wrap',
        gap: isMobile ? '0.8rem' : '0.5rem',
        position: 'relative',
        width: '100%',
      }}>
        
        {/* LEFT SIDE: Phone & Location (From Strapi) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.75rem' : '0.75rem', 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.038-1.158.394l-2.718 3.772a15.75 15.75 0 01-6.286-6.286l3.772-2.718c.356-.256.505-.718.394-1.158l-1.106-4.423A1.25 1.25 0 007.372 3.75H6.75A2.25 2.25 0 004.5 6.75z" />
            </svg>
            <span>{hotel?.phone || '+33 156 78 89 56'}</span>
          </div>
          
          {!isMobile && <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)' }} />}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>{hotel?.address || 'Newark Valley, New York(NY), 13811'}</span>
          </div>
        </div>

        {/* RIGHT SIDE: Terms, Login/Register, Language */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '0.75rem' : '0.75rem', 
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = '#C8A87C'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
              Terms & Condition
            </Link>
          </div>

          {!isMobile && <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)' }} />}

          {/* ─── SPLIT LOGIN / REGISTER ───────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link href="/login" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = '#C8A87C'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
              Login
            </Link>
            
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            
            <Link href="/register" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = '#C8A87C'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
              Register
            </Link>
          </div>

          {!isMobile && <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.1)' }} />}

          {/* ─── LANGUAGE ─── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .927-.1 1.841-.289 2.724m0 0a11.948 11.948 0 01-4.498 2.537m-8.693-5.37a8.959 8.959 0 00-.75 3.109c0 .927.1 1.841.289 2.724m0 0a11.948 11.948 0 014.498 2.537m0 0A8.997 8.997 0 0112 21" />
            </svg>
            <span>English</span>
            <svg width={isMobile ? "10" : "12"} height={isMobile ? "10" : "12"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* ─── MAIN NAVIGATION (WHITE BACKGROUND) ───────────────────── */}
      {/* ========================================================== */}
      <div
        style={{
          transition: 'all 0.5s ease',
          background: '#FFFFFF',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(200, 200, 200, 0.5)',
          boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              height: '64px',
            }}
          >
            {/* ─── LOGO ─── */}
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              {logoUrl ? (
                <img
                  src={`${STRAPI_URL}${logoUrl}`}
                  alt={hotelName}
                  style={{
                    height: '32px',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  style={{
                    height: '32px',
                    width: '32px',
                    borderRadius: '0.5rem',
                    background: GOLD_GRADIENT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0A0A0A',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  {hotelName.charAt(0)}
                  {hotelName.charAt(1)}
                </div>
              )}

              <span
                style={{
                  fontSize: isMobile ? '1rem' : '1.25rem', // Reduced on mobile for better spacing
                  fontWeight: 'bold',
                  color: '#1A1A1A',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {hotelName}
              </span>
            </Link>

            {/* ─── DESKTOP NAV ─── */}
            {isDesktop && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                }}
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    style={{
                      color: isActive(link.href) ? '#C8A87C' : '#4A4A4A',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      transition: 'color 0.3s ease',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#C8A87C')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = isActive(link.href)
                        ? '#C8A87C'
                        : '#4A4A4A')
                    }
                  >
                    {link.name}
                  </Link>
                ))}

                <Link
                  href="/rooms"
                  style={{
                    background: GOLD_GRADIENT,
                    color: '#0A0A0A',
                    fontWeight: 600,
                    padding: '0.5rem 1.5rem',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow =
                      '0 10px 40px rgba(200, 168, 124, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Book Now
                  <svg
                    style={{ width: '0.75rem', height: '0.75rem' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            )}

            {/* ─── MOBILE CONTROLS ─── */}
            {!isDesktop && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#4A4A4A',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    style={{ width: '1.5rem', height: '1.5rem' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {mobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                      />
                    )}
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ─── MOBILE MENU ─── */}
          {!isDesktop && mobileMenuOpen && (
            <div
              style={{
                padding: '1rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                borderTop: '1px solid #E0E0E0',
                marginTop: '0.5rem',
                background: '#FFFFFF',
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  style={{
                    color: isActive(link.href) ? '#C8A87C' : '#4A4A4A',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    padding: '0.5rem 0',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/rooms"
                style={{
                  background: GOLD_GRADIENT,
                  color: '#0A0A0A',
                  fontWeight: 600,
                  padding: '0.75rem 0',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  marginTop: '0.5rem',
                }}
              >
                Book Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}