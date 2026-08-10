// app/components/Footer.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

interface HotelInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
}

export default function Footer() {
  const [hotelInfo, setHotelInfo] = useState<HotelInfo | null>(null);

  useEffect(() => {
    async function fetchHotelInfo() {
      try {
        const res = await fetch(`${STRAPI_URL}/api/hotel-detail?populate=*`);
        const data = await res.json();
        setHotelInfo(data.data?.attributes || data.data);
      } catch (error) {
        console.error('Failed to fetch hotel info:', error);
      }
    }
    fetchHotelInfo();
  }, []);

  const hotelName = hotelInfo?.name || 'Rediet Hotel - Shashamane';
  const address = hotelInfo?.address || 'Shashamane, Ethiopia';
  const phone = hotelInfo?.phone || '+251-912-345678';
  const email = hotelInfo?.email || 'info@rediethotel.com';

  const socialLinks = [
    {
      name: 'Facebook',
      url: hotelInfo?.facebook,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Twitter',
      url: hotelInfo?.twitter,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      url: hotelInfo?.instagram,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      name: 'YouTube',
      url: hotelInfo?.youtube,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      url: hotelInfo?.linkedin,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ].filter((link) => link.url && link.url !== '#');

  return (
    <footer style={{
      background: DARK_NAVY,
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '2.5rem 1rem 1.5rem',
      
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {/* ─── Hotel Info ─── */}
          <div>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '0.75rem',
            }}>
              {hotelName}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '0.25rem' }}>
              {address}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              📞 {phone}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>
              ✉️ {email}
            </p>
          </div>

          {/* ─── Quick Links ─── */}
          <div>
            <h4 style={{
              
              fontSize: '1rem',
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: '0.75rem',
            }}>
              Quick Links
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', listStyle: 'none', padding: 0 }}>
              <li>
                <Link href="/rooms" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                  Rooms
                </Link>
              </li>
              <li>
                <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/gallery" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/about" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* ─── Social Media ─── */}
          <div>
            <h4 style={{
             
              fontSize: '1rem',
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: '0.75rem',
            }}>
              Follow Us
            </h4>
            {socialLinks.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.65)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = GOLD;
                      e.currentTarget.style.color = DARK_NAVY;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(200,168,124,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    aria-label={link.name}
                  >
                    <span style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {link.icon}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>No social links added yet.</p>
            )}
          </div>
        </div>

        {/* ─── Copyright ─── */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.4)',
        }}>
          © {new Date().getFullYear()} {hotelName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}