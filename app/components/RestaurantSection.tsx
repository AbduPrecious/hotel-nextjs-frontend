'use client';

import { useState, useEffect } from 'react';
import ScrollReveal from './ScrollReveal';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const GOLD_GRADIENT = 'linear-gradient(135deg, #C8A87C 0%, #E8D5B8 100%)';
const DARK_NAVY = '#15232E';

const MOCK_SLIDES = [
  {
    category: 'RESTAURANT & BAR',
    title: 'DELICIOUS FOOD AWAKEN YOUR TASTE BUDS',
    descriptionParagraph1:
      'Indulge in a symphony of flavors crafted by our award‑winning chefs. Every dish tells a story of passion and precision.',
    descriptionParagraph2:
      'From farm‑fresh ingredients to exquisite plating, our restaurant offers an unforgettable dining experience in an elegant setting.',
    images: [
      { url: '/images/restaurant-1.jpg' },
      { url: '/images/restaurant-2.jpg' },
      { url: '/images/restaurant-3.jpg' },
    ],
  },
  {
    category: 'RESTAURANT & BAR',
    title: 'EXQUISITE WINE & DINE',
    descriptionParagraph1:
      'Pair your meal with a curated selection from our world‑class wine cellar. Each bottle chosen to complement our signature dishes.',
    descriptionParagraph2:
      'Our sommeliers are ready to guide you through a journey of taste, from crisp whites to bold reds.',
    images: [
      { url: '/images/restaurant-4.jpg' },
      { url: '/images/restaurant-5.jpg' },
      { url: '/images/restaurant-6.jpg' },
    ],
  },
  {
    category: 'RESTAURANT & BAR',
    title: 'ELEGANT DINING EXPERIENCE',
    descriptionParagraph1:
      'Set in a refined atmosphere with soft lighting and contemporary décor, our dining room is the perfect backdrop for any occasion.',
    descriptionParagraph2:
      'Experience the art of fine dining with impeccable service and a menu that celebrates the best of international cuisine.',
    images: [
      { url: '/images/restaurant-7.jpg' },
      { url: '/images/restaurant-8.jpg' },
      { url: '/images/restaurant-9.jpg' },
    ],
  },
];

export default function RestaurantSection() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchSlides() {
      try {
        const res = await fetch(`${STRAPI_URL}/api/restaurant-slides?populate=images`);
        const data = await res.json();
        const items = data.data || [];
        if (items.length > 0) {
          setSlides(items.map((item: any) => item.attributes || item));
        } else {
          setSlides(MOCK_SLIDES);
        }
      } catch (error) {
        console.error('Failed to fetch restaurant slides:', error);
        setSlides(MOCK_SLIDES);
      } finally {
        setLoading(false);
      }
    }
    fetchSlides();
  }, []);

  const getImageUrl = (image: any) => {
    if (!image) return null;
    const url = image.url || image?.attributes?.url;
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  const goToPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      setIsTransitioning(false);
    }, 400);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      setIsTransitioning(false);
    }, 400);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F3EF',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #C8A87C',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
          <p style={{ marginTop: '12px', color: '#666', fontSize: '0.85rem' }}>Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const images = currentSlide?.images || [];

  return (
    <section
      style={{
        background: '#FFFFFF',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'stretch',
        // ✅ no fixed height – auto-fit content
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          width: '100%',
        }}
      >
        {/* ─── LEFT COLUMN: Image Grid ─── */}
        <div
          style={{
            position: 'relative',
            height: isMobile ? '35vh' : '100%',
            overflow: 'hidden',
            background: '#1A1A1A',
          }}
        >
          <div
            style={{
              display: 'flex',
              height: '100%',
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
              transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
            }}
          >
            {images.slice(0, 3).map((img: any, idx: number) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: '100%',
                  overflow: 'hidden',
                  borderRight:
                    idx < images.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  position: 'relative',
                }}
              >
                <img
                  src={getImageUrl(img)}
                  alt={`Restaurant ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={goToPrev}
            style={{
              position: 'absolute',
              left: '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: GOLD_GRADIENT,
              border: 'none',
              color: DARK_NAVY,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              zIndex: 10,
              fontSize: '1.4rem',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(200,168,124,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(200,168,124,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(200,168,124,0.3)';
            }}
          >
            ‹
          </button>
        </div>

        {/* ─── RIGHT COLUMN: Content ─── */}
        <div
          style={{
            background: DARK_NAVY,
            padding: isMobile
              ? '1.5rem 3rem 2rem 1.5rem'   // ✅ added bottom padding for mobile
              : '3rem 5rem 3rem 3.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflowY: isMobile ? 'auto' : 'visible',
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateX(20px)' : 'translateX(0)',
            transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out',
          }}
        >
          <ScrollReveal delay={100}>
            <span
              style={{
                color: GOLD,
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: 500,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              {currentSlide.category || 'RESTAURANT & BAR'}
            </span>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: '1.2',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
              }}
            >
              {currentSlide.title || 'DELICIOUS FOOD AWAKEN YOUR TASTE BUDS'}
            </h2>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                lineHeight: '1.6',
                fontWeight: 300,
                marginBottom: '0.5rem',
              }}
            >
              {currentSlide.descriptionParagraph1 ||
                'Indulge in a symphony of flavors crafted by our award‑winning chefs.'}
            </p>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                lineHeight: '1.6',
                fontWeight: 300,
              }}
            >
              {currentSlide.descriptionParagraph2 ||
                'From farm‑fresh ingredients to exquisite plating, our restaurant offers an unforgettable dining experience.'}
            </p>
          </ScrollReveal>

          <button
            onClick={goToNext}
            style={{
              position: 'absolute',
              right: isMobile ? '0.75rem' : '1.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: GOLD_GRADIENT,
              border: 'none',
              color: DARK_NAVY,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              zIndex: 10,
              fontSize: '1.4rem',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(200,168,124,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(200,168,124,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(200,168,124,0.3)';
            }}
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}