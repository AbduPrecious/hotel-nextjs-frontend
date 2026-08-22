// app/gallery/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getGalleryImages, getGalleryVideos } from '../lib/api';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#A89279'; // Carmelina's signature gold/beige accent
const DARK_NAVY = '#15232E'; // Carmelina's primary dark navy
const BEIGE = '#F8F7F5';

// ─── SCROLL REVEAL ──────────────────────────────────────
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
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`;
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return <div ref={ref}>{children}</div>;
}

// ─── MODAL (UPDATED WITH KEYBOARD NAVIGATION) ────────────────────────────────
function MediaModal({ item, onClose, onPrev, onNext }: { item: any; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item?.video && videoRef.current) {
      videoRef.current.play();
    }
  }, [item]);

  // ─── NEW: KEYBOARD NAVIGATION ─────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onPrev();
      } else if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onClose]);
  // ───────────────────────────────────────────────────

  if (!item) return null;

  const isVideo = item.video?.url;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(15, 23, 30, 0.96)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      {/* ─── CLOSE BUTTON ─── */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '2rem',
          color: 'white',
          fontSize: '2rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'color 0.3s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'white')}
      >
        ✕
      </button>

      {/* ─── PREVIOUS BUTTON ─── */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          fontSize: '2.5rem',
          background: 'rgba(21,35,46,0.6)',
          border: '1px solid rgba(168,146,121,0.5)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = DARK_NAVY; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(21,35,46,0.6)'; e.currentTarget.style.color = 'white'; }}
      >
        ‹
      </button>

      {/* ─── NEXT BUTTON ─── */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        style={{
          position: 'absolute',
          right: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'white',
          fontSize: '2.5rem',
          background: 'rgba(21,35,46,0.6)',
          border: '1px solid rgba(168,146,121,0.5)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = DARK_NAVY; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(21,35,46,0.6)'; e.currentTarget.style.color = 'white'; }}
      >
        ›
      </button>

      <div
        style={{ maxWidth: '1024px', maxHeight: '85vh', width: '100%', height: '100%', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={`${STRAPI_URL}${item.video.url}`}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <img
            src={`${STRAPI_URL}${item.image.url}`}
            alt={item.Title || 'Gallery media'}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
        {item.Title && (
          <div
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '1rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'rgba(21, 35, 46, 0.85)',
              border: `1px solid ${GOLD}`,
              padding: '0.6rem 2rem',
              backdropFilter: 'blur(6px)',
            }}
          >
            {item.Title}
          </div>
        )}
      </div>
    </div>
  );
}
export default function GalleryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // ─── Modal navigation state (KEPT) ─────────────────────
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ─── Fetch images and videos ────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      try {
        const [images, videos] = await Promise.all([
          getGalleryImages(),
          getGalleryVideos ? getGalleryVideos() : Promise.resolve([]),
        ]);

        const imageItems = images.map((img: any) => ({
          ...img,
          type: 'image',
          image: img.Image,
          video: null,
        }));
        const videoItems = (videos || []).map((vid: any) => ({
          ...vid,
          type: 'video',
          image: null,
          video: vid.Video,
        }));

        setItems([...imageItems, ...videoItems]);
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const categories = ['All', ...new Set(items.map((item) => item.Category).filter(Boolean))];

  const filteredItems = selectedCategory === 'All'
    ? items
    : items.filter((item) => item.Category === selectedCategory);

  // ─── Modal Preview (KEPT) ─────────────────────────────
  const openMedia = (item: any, idx: number) => {
    setSelectedItemIndex(idx);
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleModalNext = () => {
    const nextIndex = (selectedItemIndex + 1) % filteredItems.length;
    setSelectedItemIndex(nextIndex);
    setSelectedItem(filteredItems[nextIndex]);
  };

  const handleModalPrev = () => {
    const prevIndex = (selectedItemIndex - 1 + filteredItems.length) % filteredItems.length;
    setSelectedItemIndex(prevIndex);
    setSelectedItem(filteredItems[prevIndex]);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: `3px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ marginTop: '16px', color: '#666', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, color: DARK_NAVY, paddingTop: isMobile ? '4.5rem' : '6rem', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .gallery-hero {
          background: ${DARK_NAVY};
          padding: 4rem 1rem 3.5rem;
          text-align: center;
        }
        .gallery-hero .breadcrumb {
          font-size: 0.75rem;
          color: ${GOLD};
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.75rem;
        }
        .gallery-hero .breadcrumb a {
          color: ${GOLD};
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .gallery-hero .breadcrumb a:hover {
          color: white;
        }
        .gallery-hero .breadcrumb span {
          color: #555;
        }
        .gallery-hero h1 {
          font-size: 2.6rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .gallery-hero p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
          max-width: 600px;
          margin: 0 auto;
          font-weight: 300;
          line-height: 1.6;
        }

        /* ─── FILTER TABS ────────────────────────── */
        .filter-bar {
          max-width: 1200px;
          margin: 2rem auto 0;
          padding: 0 1rem;
        }
        .filter-bar-inner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #E2DEC9;
        }
        .filter-btn {
          background: transparent;
          border: none;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #777;
          cursor: pointer;
          padding: 0.5rem 0.25rem;
          position: relative;
          transition: color 0.4s ease;
        }
        .filter-btn::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background: ${GOLD};
          transform: scaleX(0);
          transition: transform 0.4s ease;
        }
        .filter-btn:hover {
          color: ${DARK_NAVY};
        }
        .filter-btn:hover::after,
        .filter-btn.active::after {
          transform: scaleX(1);
        }
        .filter-btn.active {
          color: ${DARK_NAVY};
        }

        /* ─── GRID ────────────────────────── */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          padding: 2.5rem 1rem 4.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .gallery-item {
          position: relative;
          border-radius: 0px;
          overflow: hidden;
          background: #EBE8E3;
          cursor: pointer;
          aspect-ratio: 4/3;
        }

        .gallery-item img,
        .gallery-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .gallery-item:hover img,
        .gallery-item:hover video {
          transform: scale(1.08);
        }

        .gallery-item .overlay {
          position: absolute;
          inset: 0;
          background: rgba(21, 35, 46, 0.65);
          opacity: 0;
          transition: opacity 0.5s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          text-align: center;
          z-index: 2;
        }

        .gallery-item .overlay::before {
          content: '';
          position: absolute;
          inset: 12px;
          border: 1px solid ${GOLD};
          opacity: 0;
          transform: scale(0.92);
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease;
          pointer-events: none;
        }

        .gallery-item:hover .overlay {
          opacity: 1;
        }

        .gallery-item:hover .overlay::before {
          opacity: 1;
          transform: scale(1);
        }

        .gallery-item .action-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${GOLD};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          margin-bottom: 0.75rem;
          transform: scale(0.7);
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .gallery-item:hover .action-icon {
          transform: scale(1);
        }

        .gallery-item .overlay .title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #FFFFFF;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transform: translateY(10px);
          transition: transform 0.5s ease 0.05s;
        }

        .gallery-item:hover .overlay .title {
          transform: translateY(0);
        }

        .gallery-item .overlay .category-tag {
          margin-top: 0.35rem;
          font-size: 0.65rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: ${GOLD};
          transform: translateY(10px);
          transition: transform 0.5s ease 0.1s;
        }

        .gallery-item:hover .overlay .category-tag {
          transform: translateY(0);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 1rem;
          background: white;
          border: 1px solid #E2DEC9;
          max-width: 448px;
          margin: 3rem auto;
        }
        .empty-state .icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .empty-state h3 {
          font-size: 1.3rem;
          color: ${DARK_NAVY};
          margin-bottom: 0.5rem;
          text-transform: uppercase;
        }
        .empty-state p { color: #888; font-size: 0.85rem; }

        @media (max-width: 992px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
          }
        }

        @media (max-width: 600px) {
          .gallery-hero h1 { font-size: 1.8rem; }
          .gallery-grid { 
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 2rem 1rem;
          }
          .filter-bar-inner { gap: 1rem; }
          .filter-btn { font-size: 0.75rem; }
        }
      `}</style>

      {/* ─── HERO ─── */}
      <div className="gallery-hero">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span style={{ color: '#FFFFFF' }}>Gallery</span>
        </div>
        <h1>Our Gallery</h1>
        <p>Explore photos and videos of our luxurious accommodations and amenities.</p>
      </div>

      {/* ─── FILTER BAR ─── */}
      <div className="filter-bar">
        <div className="filter-bar-inner">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'All' ? 'All Photos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── GRID (ALL ITEMS SHOWN AT ONCE, NO PAGINATION) ─── */}
      {filteredItems.length > 0 ? (
        <div className="gallery-grid">
          {filteredItems.map((item, idx) => {
            const isVideo = item.type === 'video';
            const mediaUrl = isVideo
              ? `${STRAPI_URL}${item.video?.url}`
              : (item.image?.url ? `${STRAPI_URL}${item.image.url}` : null);

            return (
              <ScrollReveal key={item.documentId || idx} delay={idx * 60}>
                <div className="gallery-item" onClick={() => openMedia(item, idx)}>
                  {mediaUrl ? (
                    isVideo ? (
                      <video src={mediaUrl} muted loop playsInline style={{ pointerEvents: 'none' }} />
                    ) : (
                      <img src={mediaUrl} alt={item.Title || 'Gallery media'} />
                    )
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCC', background: '#E0DDD7', fontSize: '2rem' }}>
                      {isVideo ? '🎬' : '🖼️'}
                    </div>
                  )}
                  
                  {/* Carmelina Luxury Overlay */}
                  <div className="overlay">
                    <div className="action-icon">
                      {isVideo ? '▶' : '+'}
                    </div>
                    {item.Title && <h3 className="title">{item.Title}</h3>}
                    {item.Category && <span className="category-tag">{item.Category}</span>}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">🖼️</div>
          <h3>No Media Found</h3>
          <p>
            {selectedCategory === 'All'
              ? 'No gallery items available right now.'
              : `No media items in "${selectedCategory}" category.`}
          </p>
        </div>
      )}

      {/* ─── MODAL (ONLY WITH PREV/NEXT) ─── */}
      {modalOpen && selectedItem && (
        <MediaModal 
          item={selectedItem} 
          onClose={() => setModalOpen(false)} 
          onPrev={handleModalPrev} 
          onNext={handleModalNext} 
        />
      )}
    </div>
  );
}