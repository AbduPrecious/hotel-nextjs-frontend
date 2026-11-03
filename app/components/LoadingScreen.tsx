'use client';

import { useEffect, useState } from 'react';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';

type LoadingScreenProps = {
  message?: string;
  /** 'light' = beige background (default), 'dark' = navy background */
  variant?: 'light' | 'dark';
  /** Size of the ring in pixels */
  size?: number;
  /** Full screen (100vh) or inline (auto) */
  fullScreen?: boolean;
};

let cachedLogoUrl: string | null = null;

export default function LoadingScreen({
  message = 'Loading…',
  variant = 'light',
  size = 100,
  fullScreen = true,
}: LoadingScreenProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(cachedLogoUrl);

  useEffect(() => {
    // Only fetch once per session
    if (cachedLogoUrl) {
      setLogoUrl(cachedLogoUrl);
      return;
    }

    async function fetchLogo() {
      try {
        // Try sessionStorage cache first
        if (typeof window !== 'undefined') {
          const cached = sessionStorage.getItem('hotel_logo_url');
          if (cached) {
            cachedLogoUrl = cached;
            setLogoUrl(cached);
            return;
          }
        }

        const res = await fetch(`${STRAPI_URL}/api/hotel-detail?populate=*`);
        const data = await res.json();
        const hotel = data?.data?.attributes || data?.data;
        const logo = hotel?.logo;
        const url = logo?.url || logo?.data?.attributes?.url || logo?.data?.url;

        if (url) {
          const fullUrl = url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
          cachedLogoUrl = fullUrl;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hotel_logo_url', fullUrl);
          }
          setLogoUrl(fullUrl);
        }
      } catch (err) {
        // Silent fail — we'll show just the ring without logo
        console.warn('Could not load hotel logo for loading screen:', err);
      }
    }
    fetchLogo();
  }, []);

  const isDark = variant === 'dark';
  const bg = isDark ? DARK_NAVY : '#ECEAE6';
  const textColor = isDark ? 'rgba(255,255,255,0.7)' : '#666666';
  const ringTrack = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(200,168,124,0.2)';

  return (
    <div
      style={{
        minHeight: fullScreen ? '100vh' : '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        padding: '2rem',
      }}
    >
      <style>{`
        @keyframes ls-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ls-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.96); opacity: 0.9; }
        }
      `}</style>

      {/* Spinner + logo wrapper */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Outer spinning ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `3px solid ${ringTrack}`,
            borderTopColor: GOLD,
            animation: 'ls-spin 1s linear infinite',
          }}
        />

        {/* Inner logo (or fallback letter) */}
        <div
          style={{
            width: size * 0.68,
            height: size * 0.68,
            borderRadius: '50%',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            animation: 'ls-pulse 2s ease-in-out infinite',
          }}
        >
                  {logoUrl && (
            <img
              src={logoUrl}
              alt="Loading"
              style={{
                width: '90%',
                height: '90%',
                objectFit: 'contain',
              }}
            />
          )}
        </div>
      </div>

      {/* Message below */}
      {message && (
        <p
          style={{
            marginTop: '1.25rem',
            color: textColor,
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}