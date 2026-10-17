'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AUTH_CHANGED_EVENT, readAuth, clearAuth } from '../lib/auth';

const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';

export default function UserNavMenu() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Read auth state (and re-read whenever AUTH_CHANGED fires)
  useEffect(() => {
    setMounted(true);
    const sync = () => {
      const { isLoggedIn, name } = readAuth();
      setIsLoggedIn(isLoggedIn);
      setUserName(name || 'Account');
    };
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLogout = () => {
    clearAuth();
    setOpen(false);
    router.push('/login');
    router.refresh();
  };

  // SSR fallback
  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', fontSize: 'inherit' }}>
        <Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Login</Link>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <Link href="/register" style={{ color: 'inherit', textDecoration: 'none' }}>Register</Link>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', fontSize: 'inherit' }}>
        <Link
          href="/login"
          style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
        >
          Login
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <Link
          href="/register"
          style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          fontSize: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: 0,
          fontFamily: 'inherit',
        }}
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span style={{ fontWeight: 500 }}>{userName}</span>
        <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: '#FFFFFF',
            color: DARK_NAVY,
            borderRadius: '0.5rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            minWidth: '180px',
            overflow: 'hidden',
            padding: '0.25rem 0',
            zIndex: 100,
            fontSize: '0.85rem',
          }}
        >
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              padding: '0.6rem 1rem',
              textDecoration: 'none',
              color: DARK_NAVY,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F8F8')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            My Dashboard
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '0.6rem 1rem',
              background: 'transparent',
              border: 'none',
              color: '#B02A37',
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF5F5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}