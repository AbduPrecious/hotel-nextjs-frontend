// app/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Invalid email or password.');
      }

      localStorage.setItem('strapi_token', data.jwt);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.username || 'Guest');

      router.push('/dashboard');
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK_NAVY, padding: '7.5rem 1rem 2.5rem 1rem', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '420px', width: '100%', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '1.5rem', padding: '2.5rem 2rem', boxShadow: '0 20px 80px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', background: `linear-gradient(135deg, ${GOLD} 0%, #E8D5B8 100%)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg style={{ width: '28px', height: '28px', color: DARK_NAVY }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 style={{fontSize: '1.75rem', fontWeight: 700, color: '#FFFFFF' }}>Welcome Back</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Sign in to view your booking dashboard</p>
        </div>

        {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(229,62,62,0.1)', border: '1px solid rgba(229,62,62,0.2)', borderRadius: '0.75rem', marginBottom: '1.5rem' }}><p style={{ color: '#E53E3E', fontSize: '0.85rem', margin: 0 }}>{error}</p></div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease' }} onFocus={(e) => { e.currentTarget.style.borderColor = GOLD; }} onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} required />
          </div>
          
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '0.8rem 2.5rem 0.8rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease' }} 
                onFocus={(e) => { e.currentTarget.style.borderColor = GOLD; }} 
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }} 
                required minLength={6} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  transition: 'color 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                {showPassword ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.85rem', background: GOLD, color: DARK_NAVY, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.08em', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.3s ease', opacity: loading ? 0.6 : 1 }} onMouseEnter={(e) => { if(!loading) { e.currentTarget.style.transform = 'scale(1.02)'; } }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>{loading ? 'Processing...' : 'Login'}</button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', fontSize: '0.9rem', gap: '0.25rem' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>Don't have an account? </span>
          <Link href="/register" style={{ color: GOLD, fontWeight: 600, textDecoration: 'none', transition: 'color 0.3s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'} onMouseLeave={(e) => e.currentTarget.style.color = GOLD}>Register</Link>
        </div>
      </div>
    </div>
  );
}