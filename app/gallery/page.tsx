// app/gallery/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getGalleryImages, getGalleryVideos } from '../lib/api';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';
const BEIGE = '#ECEAE6';

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

// ─── MODAL ────────────────────────────────────────────────
function MediaModal({ item, onClose }: { item: any; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (item?.video && videoRef.current) {
      videoRef.current.play();
    }
  }, [item]);

  if (!item) return null;

  const isVideo = item.video?.url;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
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

      <div
        style={{ maxWidth: '1024px', maxHeight: '90vh', width: '100%', height: '100%', position: 'relative' }}
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
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: '1.2rem',
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
              background: 'rgba(0,0,0,0.5)',
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              backdropFilter: 'blur(4px)',
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
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  const openMedia = (item: any) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BEIGE }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '16px', color: '#666',fontSize: '0.8rem' }}>Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BEIGE, color: DARK_NAVY, paddingTop: '64px' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .gallery-hero {
          background: ${DARK_NAVY};
          padding: 3rem 1rem;
          text-align: center;
        }
        .gallery-hero .breadcrumb {
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
          /* ✅ Removed hardcoded serif font */
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
        }
        .gallery-hero p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
          max-width: 672px;
          margin: 0 auto;
          font-weight: 300;
          line-height: 1.6;
        }
        .filter-bar {
          max-width: 1280px;
          margin: -1.5rem auto 0;
          padding: 0 1rem;
          position: relative;
          z-index: 10;
        }
        .filter-bar-inner {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          padding: 1rem 1.5rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: 1px solid #E8E8E8;
        }
        .filter-btn {
          padding: 0.4rem 1.2rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #F0F0F0;
          color: #666;
        }
        .filter-btn:hover {
          background: ${GOLD};
          color: ${DARK_NAVY};
          transform: scale(1.02);
        }
        .filter-btn.active {
          background: ${GOLD};
          color: ${DARK_NAVY};
          box-shadow: 0 4px 20px rgba(200,168,124,0.2);
        }
        .filter-count {
          font-size: 0.7rem;
          color: #999;
          margin-left: 0.5rem;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.75rem;
          padding: 2rem 1rem;
          max-width: 1280px;
          margin: 0 auto;
        }
        .gallery-item {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          background: #F8F8F8;
          border: 1px solid #E8E8E8;
          transition: all 0.4s ease;
          cursor: pointer;
          aspect-ratio: 4/3;
        }
        .gallery-item:hover {
          border-color: ${GOLD};
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.06);
        }
        .gallery-item img,
        .gallery-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s ease;
        }
        .gallery-item:hover img,
        .gallery-item:hover video {
          transform: scale(1.05);
        }
        .gallery-item .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 1.5rem;
        }
        .gallery-item:hover .overlay {
          opacity: 1;
        }
        .gallery-item .overlay .title {
          /* ✅ Removed hardcoded serif font */
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
          margin: 0;
          transform: translateY(10px);
          transition: transform 0.4s ease 0.05s;
          text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        .gallery-item:hover .overlay .title {
          transform: translateY(0);
        }
        .gallery-item .overlay .category-tag {
          display: inline-block;
          margin-top: 0.5rem;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${GOLD};
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(4px);
          padding: 0.2rem 0.8rem;
          border-radius: 9999px;
          width: fit-content;
          transform: translateY(10px);
          transition: transform 0.4s ease 0.1s;
        }
        .gallery-item:hover .overlay .category-tag {
          transform: translateY(0);
        }
        .gallery-item .name-badge {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          color: white;
          font-size: 0.7rem;
          font-weight: 500;
          padding: 0.3rem 0.8rem;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 80%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .gallery-item .play-button {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          border-radius: 50%;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 2rem;
          transition: all 0.3s ease;
          border: 2px solid rgba(255,255,255,0.3);
          opacity: 0;
        }
        .gallery-item:hover .play-button {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.1);
        }
        .empty-state {
          text-align: center;
          padding: 4rem 1rem;
          background: white;
          border: 1px solid #E8E8E8;
          border-radius: 1rem;
          max-width: 448px;
          margin: 2rem auto;
        }
        .empty-state .icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .empty-state h3 { 
          /* ✅ Removed hardcoded serif font */
          font-size: 1.5rem; 
          color: ${DARK_NAVY}; 
          margin-bottom: 0.5rem; 
        }
        .empty-state p { color: #999; font-size: 0.85rem; }
        @media (max-width: 768px) {
          .gallery-hero h1 { font-size: 2rem; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
          .filter-bar-inner { padding: 0.75rem 1rem; gap: 0.3rem; }
          .filter-btn { font-size: 0.7rem; padding: 0.3rem 0.8rem; }
        }
        @media (max-width: 480px) {
          .gallery-grid { grid-template-columns: 1fr; }
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
        <p>Explore photos and videos from our hotel</p>
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
              {cat === 'All' ? 'All' : cat}
              {cat === selectedCategory && (
                <span className="filter-count">({filteredItems.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── GRID ─── */}
      {filteredItems.length > 0 ? (
        <div className="gallery-grid">
          {filteredItems.map((item, idx) => {
            const isVideo = item.type === 'video';
            const mediaUrl = isVideo
              ? `${STRAPI_URL}${item.video?.url}`
              : (item.image?.url ? `${STRAPI_URL}${item.image.url}` : null);
            return (
              <ScrollReveal key={item.documentId || idx} delay={idx * 60}>
                <div className="gallery-item" onClick={() => openMedia(item)}>
                  {mediaUrl ? (
                    isVideo ? (
                      <>
                        <video src={mediaUrl} muted loop playsInline style={{ pointerEvents: 'none' }} />
                        <div className="play-button">▶</div>
                      </>
                    ) : (
                      <img src={mediaUrl} alt={item.Title || 'Gallery media'} />
                    )
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CCC', background: '#F0F0F0', fontSize: '2rem' }}>
                      {isVideo ? '🎬' : '🖼️'}
                    </div>
                  )}
                  <div className="overlay">
                    {item.Title && <h3 className="title">{item.Title}</h3>}
                    {item.Category && <span className="category-tag">{item.Category}</span>}
                  </div>
                  {/* ─── Name Badge (instead of Photo/Video) ─── */}
                  {item.Title && (
                    <div className="name-badge" title={item.Title}>
                      {item.Title}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">📸</div>
          <h3>No Media Found</h3>
          <p>
            {selectedCategory === 'All'
              ? 'No gallery items added yet. Add them in Strapi.'
              : `No items in "${selectedCategory}" category.`}
          </p>
        </div>
      )}

      {/* ─── MODAL ─── */}
      {modalOpen && selectedItem && (
        <MediaModal item={selectedItem} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}