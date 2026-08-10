// app/terms/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';

// ─── SAFE RICH TEXT RENDERER ────────────────────────────────
function RichTextRenderer({ content }: { content: any }) {
  if (!content) return null;
  if (typeof content === 'string') {
    return <p style={{ lineHeight: '1.7', color: '#444' }}>{content}</p>;
  }
  if (!Array.isArray(content)) return null;

  const extractText = (children: any[]) => {
    let text = '';
    if (!children) return text;
    for (const child of children) {
      if (child.text) text += child.text;
      if (child.children && Array.isArray(child.children)) {
        text += extractText(child.children);
      }
    }
    return text;
  };

  return content.map((block, idx) => {
    const blockText = extractText(block.children || []);

    if (block.type === 'heading') {
      if (block.level === 1) {
        return (
          <h2 key={idx} style={{ fontSize: '1.4rem', color: DARK_NAVY, marginTop: '2.5rem', borderBottom: '2px solid ' + GOLD, paddingBottom: '0.5rem', marginBottom: '1rem', letterSpacing: '0.02em' }}>
            {blockText}
          </h2>
        );
      }
      if (block.level === 2) {
        return (
          <h3 key={idx} style={{fontSize: '1.2rem', color: DARK_NAVY, marginTop: '1.5rem', marginBottom: '0.25rem', fontWeight: 600 }}>
            {blockText}
          </h3>
        );
      }
    }

    if (block.type === 'list') {
      const listItems = block.children.map((item: any, i: number) => {
        const itemText = extractText(item.children || []);
        return (
          <li key={i} style={{ marginBottom: '0.25rem', paddingLeft: '0.25rem', display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ color: GOLD, marginRight: '0.5rem' }}>•</span>
            <span>{itemText}</span>
          </li>
        );
      });
      return (
        <ul key={idx} style={{ paddingLeft: '0', marginBottom: '1rem', color: '#444', listStyle: 'none' }}>
          {listItems}
        </ul>
      );
    }

    return (
      <p key={idx} style={{ color: '#444', lineHeight: '1.8', fontSize: '0.95rem', marginBottom: '1rem' }}>
        {blockText}
      </p>
    );
  });
}

export default function TermsPage() {
  const [screenWidth, setScreenWidth] = useState(0);
  const [termsData, setTermsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth < 768;

  // ─── FETCH TERMS ──────────────────────────────────────────
  useEffect(() => {
    async function fetchTerms() {
      try {
        // ✅ FIXED: The API ID from your screenshot is "term"
        const res = await fetch(`${STRAPI_URL}/api/term?populate=*`);
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();

        if (data.data) {
          setTermsData(data.data?.attributes || data.data);
        } else {
          setError('Strapi returned empty data. Did you click "Publish" in Content Manager?');
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load Terms and Conditions.');
      } finally {
        setLoading(false);
      }
    }
    fetchTerms();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECEAE6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '16px', color: '#666666',}}>Loading Terms & Conditions...</p>
        </div>
      </div>
    );
  }

  if (error || !termsData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ECEAE6', padding: '1rem' }}>
        <div style={{ background: '#FFFFFF', borderRadius: '1rem', padding: '2rem', textAlign: 'center', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{color: DARK_NAVY, fontSize: '1.2rem' }}>Content Not Found</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {error || 'Please go to your Strapi Admin, publish content in the "TermsAndConditions" single type.'}
          </p>
          <Link href="/" style={{ display: 'inline-block', background: DARK_NAVY, color: '#FFFFFF', padding: '0.7rem 2.5rem', borderRadius: '9999px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = DARK_NAVY; }} onMouseLeave={(e) => { e.currentTarget.style.background = DARK_NAVY; e.currentTarget.style.color = '#FFFFFF'; }}>Go Back Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3EF', color: '#1A1A1A', paddingTop: isMobile ? '8rem' : '9rem', paddingBottom: '3rem', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-hero { animation: fadeInUp 0.8s ease forwards; opacity: 0; }
        .animate-card { animation: fadeInUp 0.8s ease 0.3s forwards; opacity: 0; }
        .animate-btn { animation: fadeInUp 0.8s ease 0.6s forwards; opacity: 0; }
      `}</style>

      {/* ─── HERO ─── */}
      <div className="animate-hero" style={{
        background: DARK_NAVY,
        padding: isMobile ? '1.5rem 1rem' : '2.5rem 1rem',
        borderBottom: '3px solid ' + GOLD,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.25rem' }}>
            {termsData?.title || 'Terms & Conditions'}
          </h1>
          {termsData?.last_updated && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? '0.85rem' : '1rem', margin: 0, letterSpacing: '0.05em' }}>
              Last Updated: {new Date(termsData.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* ─── CONTENT CARD ─── */}
      <div className="animate-card" style={{ maxWidth: '900px', margin: '-1.5rem auto 0', padding: '0 1rem' }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '1.5rem',
          padding: isMobile ? '1.5rem 1.25rem' : '3rem 3.5rem',
          boxShadow: '0 15px 50px rgba(0,0,0,0.06)',
          border: '1px solid rgba(200, 168, 124, 0.15)',
        }}>
          <RichTextRenderer content={termsData?.content} />

          {/* ─── BUTTONS ─── */}
          <div className="animate-btn" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #E8E8E8', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/" style={{ display: 'inline-block', background: DARK_NAVY, color: '#FFFFFF', padding: '0.8rem 2.5rem', borderRadius: '9999px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(23,35,46,0.2)' }} onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = DARK_NAVY; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(200,168,124,0.4)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = DARK_NAVY; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(23,35,46,0.2)'; }}>Back to Home</Link>
            <Link href="/rooms" style={{ display: 'inline-block', border: '2px solid #C8A87C', background: 'transparent', color: DARK_NAVY, padding: '0.8rem 2.5rem', borderRadius: '9999px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DARK_NAVY; e.currentTarget.style.transform = 'translateY(0)'; }}>Explore Rooms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}