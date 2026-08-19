// app/components/MenuSection.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface MenuItem {
  id: number;
  documentId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  order: number;
  image?: { url: string; alternativeText?: string };
}

interface MenuSectionProps {
  items: MenuItem[];
}

export default function MenuSection({ items }: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── Animation / Transition States ─────────────────────────
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | 'fade'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  // ─── Responsive Hook ──────────────────────────────────────────
  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  if (!items || items.length === 0) return null;

  const categories = ['All', ...new Set(items.map((item) => item.category))];
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const handleCategoryChange = (cat: string) => {
    if (cat === selectedCategory || isAnimating) return;
    setSlideDirection('fade');
    setIsAnimating(true);
    setTimeout(() => {
      setSelectedCategory(cat);
      setCurrentPage(0);
      setIsAnimating(false);
    }, 200);
  };

  // ─── EXACT ROW CALCULATIONS ──────────────────────────────────
  const GAP = isMobile ? 16 : 24;
  // Exactly 3 items per row on Desktop, 2 on Tablet, 1 on Mobile
  const itemsPerRow = isMobile ? 1 : isTablet ? 2 : 3; 
  const totalPages = Math.ceil(filteredItems.length / itemsPerRow);
  const startIndex = currentPage * itemsPerRow;
  const visibleItems = filteredItems.slice(startIndex, startIndex + itemsPerRow);
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;
  // If the row has fewer items than max capacity (e.g., 1 or 2 items), do not stretch them
  const isFullRow = visibleItems.length === itemsPerRow;

  const handlePageChange = (newPage: number, direction: 'left' | 'right') => {
    if (isAnimating) return;
    setSlideDirection(direction);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsAnimating(false);
    }, 200);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isFirstPage && !isAnimating) {
      handlePageChange(currentPage - 1, 'left');
    }
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLastPage && !isAnimating) {
      handlePageChange(currentPage + 1, 'right');
    }
  };

  const needsPagination = filteredItems.length > itemsPerRow;

  // Compute slide transform offset based on current animation state
  const getTransform = () => {
    if (!isAnimating) return 'translateX(0px)';
    if (slideDirection === 'right') return 'translateX(-30px)';
    if (slideDirection === 'left') return 'translateX(30px)';
    return 'translateY(10px)';
  };

  return (
    <section
      style={{
        padding: '4rem 1rem',
        background: '#FFFFFF',
        borderTop: '1px solid #E8E8E8',
        borderBottom: '1px solid #E8E8E8',
      }}
      id="menu"
      ref={containerRef}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* ─── Header ─── */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span
            style={{
              color: '#C8A87C',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: '0.5rem',
            }}
          >
            Our Menu
          </span>
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1A1A1A',
              lineHeight: '1.2',
            }}
          >
            Food &amp; Drinks
          </h2>
          <p
            style={{
              color: '#666666',
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              maxWidth: '672px',
              margin: '0.5rem auto 0',
            }}
          >
            Delicious meals prepared with love
          </p>
          <div
            style={{
              width: '4rem',
              height: '0.25rem',
              background: 'linear-gradient(90deg, #C8A87C 0%, #E8D5B8 100%)',
              borderRadius: '9999px',
              margin: '1rem auto 0',
            }}
          />
        </div>

        {/* ─── Category Buttons ─── */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: selectedCategory === cat ? '#C8A87C' : '#F0F0F0',
                color: selectedCategory === cat ? '#1A1A1A' : '#666666',
                border: selectedCategory === cat ? '1px solid #C8A87C' : '1px solid #E0E0E0',
                transform: selectedCategory === cat ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedCategory === cat ? '0 4px 12px rgba(200, 168, 124, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.borderColor = '#C8A87C';
                  e.currentTarget.style.color = '#C8A87C';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat) {
                  e.currentTarget.style.borderColor = '#E0E0E0';
                  e.currentTarget.style.color = '#666666';
                  e.currentTarget.style.transform = 'none';
                }
              }}
            >
              {cat === 'All' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── PERFECTLY CENTERED & EQUAL HEIGHT ROW WITH SLIDE TRANSITION ─── */}
        <div style={{
          display: isFullRow ? 'grid' : 'flex',
          gridTemplateColumns: isFullRow ? `repeat(${itemsPerRow}, 1fr)` : 'none',
          justifyContent: isFullRow ? 'normal' : 'center',
          alignItems: isFullRow ? 'normal' : 'stretch',
          gap: `${GAP}px`,
          padding: '0.25rem 0',
          width: '100%',
          opacity: isAnimating ? 0 : 1,
          transform: getTransform(),
          transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {visibleItems.map((item) => {
            const imageUrl = item.image?.url ? `${STRAPI_URL}${item.image.url}` : null;
            return (
              <div
                key={item.documentId}
                style={{
                  width: isFullRow ? '100%' : (isMobile ? '100%' : '380px'),
                  maxWidth: isFullRow ? '100%' : (isMobile ? '100%' : '380px'),
                  background: '#F8F8F8',
                  border: '1px solid #E8E8E8',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#C8A87C';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E8E8E8';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                                              {imageUrl && (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4 / 3', // 👈 Dynamically tall, no fixed pixels!
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={item.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top center', // 👈 Locks the top so the burger bun & top fruits are NEVER cut
                        transition: 'transform 0.7s ease-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                        opacity: 0.4,
                        transition: 'opacity 0.4s ease',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                )}

                <div
                  style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: '#1A1A1A',
                        transition: 'color 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#C8A87C';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#1A1A1A';
                      }}
                    >
                      {item.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: 'bold',
                        color: '#C8A87C',
                        flexShrink: 0,
                        marginLeft: '0.5rem',
                      }}
                    >
                      ETB {item.price}
                    </span>
                  </div>
                  <p
                    style={{
                      color: '#666666',
                      fontSize: '0.75rem',
                      lineHeight: '1.625',
                      flexGrow: 1,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {item.description}
                  </p>
                  {!item.isAvailable && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#FF6B6B',
                        fontWeight: 600,
                        marginTop: '0.25rem',
                      }}
                    >
                      ❌ Currently Unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Pagination (Fixed No-Scroll) ─── */}
        {needsPagination && totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginTop: '2rem',
            }}
          >
            <button
              type="button"
              onClick={goToPrevious}
              disabled={isFirstPage || isAnimating}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                transition: 'all 0.3s ease',
                background: isFirstPage ? '#E8E8E8' : '#C8A87C',
                color: isFirstPage ? '#999999' : '#1A1A1A',
                cursor: isFirstPage || isAnimating ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (idx !== currentPage) {
                      handlePageChange(idx, idx > currentPage ? 'right' : 'left');
                    }
                  }}
                  disabled={isAnimating}
                  style={{
                    height: '0.375rem',
                    borderRadius: '9999px',
                    transition: 'all 0.3s ease',
                    background: idx === currentPage ? '#C8A87C' : '#E0E0E0',
                    width: idx === currentPage ? '1.5rem' : '0.375rem',
                    border: 'none',
                    cursor: isAnimating ? 'not-allowed' : 'pointer',
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goToNext}
              disabled={isLastPage || isAnimating}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                transition: 'all 0.3s ease',
                background: isLastPage ? '#E8E8E8' : '#C8A87C',
                color: isLastPage ? '#999999' : '#1A1A1A',
                cursor: isLastPage || isAnimating ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {filteredItems.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: '#999999',
            }}
          >
            Showing {startIndex + 1}–{Math.min(startIndex + itemsPerRow, filteredItems.length)} of{' '}
            {filteredItems.length} items
          </div>
        )}

        {filteredItems.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: '#999999',
              marginTop: '1.5rem',
              fontSize: '0.875rem',
            }}
          >
            No items in this category.
          </p>
        )}
      </div>
    </section>
  );
}