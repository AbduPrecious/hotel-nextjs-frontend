'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getAvailableRooms } from '../lib/api';
import ScrollReveal from '../components/ScrollReveal';
import { BedIcon, GuestIcon } from '../components/Icons';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

function getRoomType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('suite')) return 'suite';
  if (lower.includes('family')) return 'family';
  if (lower.includes('deluxe')) return 'deluxe';
  if (lower.includes('executive')) return 'executive';
  if (lower.includes('presidential')) return 'presidential';
  return 'standard';
}

function RoomsContent() {
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const DARK_NAVY = '#17232E';
  const GOLD = '#C8A87C';
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const initialAdults = searchParams.get('adults') || 'all';
  const initialChildren = searchParams.get('children') || '0';

  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      try {
        const roomsData = await getAvailableRooms(false);
        setRooms(roomsData || []);
      } catch (error) {
        console.error('Failed to load rooms:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (initialAdults !== 'all') {
      const totalGuests = Number(initialAdults) + Number(initialChildren);
      if (totalGuests <= 2) setCapacityFilter('1-2');
      else if (totalGuests <= 4) setCapacityFilter('3-4');
      else setCapacityFilter('5+');
    }
  }, [initialAdults, initialChildren]);

  const filteredRooms = rooms.filter((room) => {
    const roomData = room?.attributes || room;
    const title = roomData?.title || '';
    const capacity = roomData?.capacity || 0;
    const price = roomData?.price || 0;

    if (roomTypeFilter !== 'all') {
      const type = getRoomType(title);
      if (type !== roomTypeFilter) return false;
    }

    if (capacityFilter !== 'all') {
      if (capacityFilter === '1-2' && (capacity < 1 || capacity > 2)) return false;
      if (capacityFilter === '3-4' && (capacity < 3 || capacity > 4)) return false;
      if (capacityFilter === '5+' && capacity < 5) return false;
    }

    if (priceFilter !== 'all') {
      if (priceFilter === 'budget' && price > 2000) return false;
      if (priceFilter === 'mid' && (price < 2001 || price > 4000)) return false;
      if (priceFilter === 'premium' && price < 4001) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setRoomTypeFilter('all');
    setCapacityFilter('all');
    setPriceFilter('all');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#666666', letterSpacing: '0.05em', fontSize: '12px', textTransform: 'uppercase' }}>Loading accommodations...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', color: '#1A1A1A', paddingTop: isMobile ? '5rem' : '6.5rem', boxSizing: 'border-box' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fadeInUp 0.8s ease forwards; opacity: 0; }
        
        .section-tag {
          color: #C8A87C;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 0.5rem;
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1A1A1A;
          line-height: 1.2;
        }
        @media (min-width: 768px) {
          .section-title { font-size: 3rem; }
        }
        @media (min-width: 1024px) {
          .section-title { font-size: 3.5rem; }
        }
        .section-divider {
          width: 4rem;
          height: 0.25rem;
          background: linear-gradient(90deg, #C8A87C 0%, #E8D5B8 100%);
          border-radius: 9999px;
          margin: 1rem auto 0;
        }
        .room-number-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          color: #C8A87C;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.3rem 0.9rem;
          border-radius: 9999px;
          border: 1px solid rgba(200,168,124,0.3);
          letter-spacing: 0.05em;
        }
        .room-card {
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          background: #F8F8F8;
          border: 1px solid #E8E8E8;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .room-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
          border-color: #C8A87C;
        }
        .room-card .image-wrapper {
          position: relative;
          overflow: hidden;
          background: #F0F0F0;
          min-height: 280px;
        }
        .room-card .image-wrapper img {
          width: 100%;
          height: 100%;
          min-height: 280px;
          object-fit: cover;
          transition: transform 0.7s ease;
        }
        .room-card:hover .image-wrapper img {
          transform: scale(1.06);
        }
        .room-card .content {
          padding: 1.75rem 2rem 2rem;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .room-card .content .room-title {
          font-size: 1.5rem;
          font-weight: 500;
          color: #1A1A1A;
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }
        .room-card:hover .content .room-title {
          color: #C8A87C;
        }
        .room-card .content .room-title a {
          color: inherit;
          text-decoration: none;
        }
        .room-card .content .room-description {
          font-size: 0.85rem;
          color: #666666;
          line-height: 1.7;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .room-card .content .room-details {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.75rem 0;
          border-top: 1px solid #EEEEEE;
          border-bottom: 1px solid #EEEEEE;
          margin-bottom: 1.5rem;
          font-size: 0.8rem;
          color: #555555;
        }
        .room-card .content .room-details span {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .room-card .content .view-btn {
          display: inline-block;
          text-align: center;
          background: #15232e;
          color: #FFFFFF;
          padding: 0.9rem 1.5rem;
          border: none;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }
        .room-card .content .view-btn:hover {
          background: #C8A87C;
          transform: scale(1.02);
          box-shadow: 0 8px 30px rgba(200,168,124,0.3);
        }
        .room-card .content .view-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            to right,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.1) 50%,
            rgba(255,255,255,0) 100%
          );
          transform: rotate(45deg) translateX(-100%);
          transition: transform 0.6s ease;
        }
        .room-card .content .view-btn:hover::after {
          transform: rotate(45deg) translateX(100%);
        }
        .price-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: #C8A87C;
          color: #FFFFFF;
          padding: 0.35rem 1rem;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(200,168,124,0.3);
        }
        /* ─── Responsive: Tablet/Desktop ─── */
        @media (min-width: 768px) {
          .room-card {
            flex-direction: row;
          }
          .room-card .image-wrapper {
            width: 50%;
            min-height: 320px;
          }
          .room-card .image-wrapper img {
            min-height: 320px;
          }
          .room-card .content {
            width: 50%;
          }
        }
        /* ─── Mobile adjustments ─── */
        @media (max-width: 768px) {
          .room-card .content {
            padding: 1.25rem 1.25rem 1.5rem;
          }
          .room-card .content .room-title {
            font-size: 1.25rem;
          }
          .room-card .content .room-details {
            flex-wrap: wrap;
            gap: 0.75rem;
          }
          .room-card .image-wrapper {
            min-height: 220px;
          }
          .room-card .image-wrapper img {
            min-height: 220px;
          }
          /* Filter bar: stack vertically */
          .filter-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .hero-title {
            font-size: 2.5rem !important;
          }
        }
        @media (max-width: 480px) {
          .room-card .image-wrapper {
            min-height: 180px;
          }
          .room-card .image-wrapper img {
            min-height: 180px;
          }
          .price-badge {
            font-size: 0.6rem;
            padding: 0.2rem 0.6rem;
          }
          .room-number-badge {
            font-size: 0.7rem;
            padding: 0.2rem 0.6rem;
          }
        }

        /* ─── Contact-style hero (copied from Contact page) ─── */
        .contact-hero {
          background: ${DARK_NAVY};
          padding: 3rem 1rem;
          text-align: center;
          border-bottom: 3px solid ${GOLD};
        }
        .contact-hero .breadcrumb {
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
        .contact-hero .breadcrumb a {
          color: ${GOLD};
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .contact-hero .breadcrumb a:hover { color: white; }
        .contact-hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.25rem;
          letter-spacing: 0.02em;
        }
        .contact-hero p {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
          max-width: 672px;
          margin: 0 auto;
          font-weight: 300;
          line-height: 1.6;
        }
        @media (max-width: 768px) {
          .contact-hero h1 { font-size: 2rem; }
        }
      `}</style>

      {/* ─── 1. HERO (Contact page style) ─── */}
      <div className="contact-hero animate-in" style={{ padding: isMobile ? '4rem 1rem' : '5rem 1rem' }}>
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span style={{ color: '#FFFFFF' }}>Rooms</span>
        </div>
        <h1 className="hero-title">Accommodations</h1>
        <p>Refurbished with sophisticated elegance, designed to deliver a memorable stay.</p>

        {checkIn && checkOut && (
          <div style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', background: '#2A2A2A', border: '1px solid rgba(200,168,124,0.3)', padding: '0.5rem 1rem', fontSize: '11px', letterSpacing: '0.05em', color: GOLD }}>
            <span>CHECK-IN: <strong style={{ color: '#FFFFFF' }}>{checkIn}</strong></span>
            <span>•</span>
            <span>CHECK-OUT: <strong style={{ color: '#FFFFFF' }}>{checkOut}</strong></span>
          </div>
        )}
      </div>

      {/* ─── 2. Filter Bar ─── */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 1rem', marginTop: '-1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ background: '#FFFFFF', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', padding: '1.5rem', borderBottom: '2px solid #C8A87C' }}>
          <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.15em', fontWeight: 700, color: '#777777', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>ROOM TYPE</label>
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #E0E0E0', padding: '0.5rem 0', fontSize: '0.9rem', color: '#1A1A1A', outline: 'none', cursor: 'pointer' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C8A87C'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}
              >
                <option value="all">All Room Types</option>
                <option value="standard">Standard Room</option>
                <option value="deluxe">Deluxe Room</option>
                <option value="suite">Suite</option>
                <option value="family">Family Room</option>
                <option value="executive">Executive Room</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.15em', fontWeight: 700, color: '#777777', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>CAPACITY</label>
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #E0E0E0', padding: '0.5rem 0', fontSize: '0.9rem', color: '#1A1A1A', outline: 'none', cursor: 'pointer' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C8A87C'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}
              >
                <option value="all">All Capacities</option>
                <option value="1-2">1 – 2 Guests</option>
                <option value="3-4">3 – 4 Guests</option>
                <option value="5+">5+ Guests</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', letterSpacing: '0.15em', fontWeight: 700, color: '#777777', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>PRICE RANGE</label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #E0E0E0', padding: '0.5rem 0', fontSize: '0.9rem', color: '#1A1A1A', outline: 'none', cursor: 'pointer' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#C8A87C'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}
              >
                <option value="all">All Prices</option>
                <option value="budget">Under ETB 2,000</option>
                <option value="mid">ETB 2,001 – 4,000</option>
                <option value="premium">ETB 4,001+</option>
              </select>
            </div>

            <div>
              <button
                onClick={resetFilters}
                style={{ 
                  width: '100%', 
                  background: '#15232e',
                  color: '#FFFFFF', 
                  padding: '0.75rem 0', 
                  border: 'none', 
                  fontSize: '11px', 
                  fontWeight: 600, 
                  letterSpacing: '0.15em', 
                  textTransform: 'uppercase', 
                  cursor: 'pointer', 
                  transition: 'background 0.3s ease' 
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#C8A87C'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#15232e'; }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Room Listings ─── */}
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '3rem 1rem' }}>
        {filteredRooms.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {filteredRooms.map((room, idx) => {
              const roomData = room?.attributes || room;
              const photos = roomData?.photos || [];
              const imageUrl = photos.length > 0 ? photos[0]?.url : null;
              const roomNumber = String(idx + 1).padStart(2, '0');

              return (
                <ScrollReveal key={room.documentId || room.id || idx} delay={idx * 80}>
                  <div className="room-card">
                    <div className="image-wrapper">
                      {imageUrl ? (
                        <img
                          src={`${STRAPI_URL}${imageUrl}`}
                          alt={roomData?.title || 'Room'}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', background: '#F0F0F0', fontSize: '0.9rem' }}>
                          No Preview Available
                        </div>
                      )}
                      <div className="price-badge">ETB {roomData?.price || 0} / NIGHT</div>
                      <div className="room-number-badge">{roomNumber}</div>
                    </div>

                    <div className="content">
                      <h3 className="room-title">
                        <Link href={`/rooms/${room.documentId || room.id}`}>
                          {roomData?.title || 'Luxury Room'}
                        </Link>
                      </h3>

                      <p className="room-description">
                        {roomData?.overview || 'Designed with individual luxury and full amenities for an elevated experience.'}
                      </p>

                      <div className="room-details">
                       <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
  <BedIcon size={18} color="#555" />
  {roomData?.bed_type || 'King Bed'}
</span>
<span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
  <GuestIcon size={18} color="#555" />
  {roomData?.capacity || 2} Guests
</span>
                        
                      </div>
                      <Link
                        href={`/rooms/${room.documentId || room.id}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`}
                        className="view-btn"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', background: '#FFFFFF', border: '1px solid #E8E8E8', padding: '2rem', maxWidth: '448px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#1A1A1A', marginBottom: '0.5rem' }}>No Rooms Matched</h3>
            <p style={{ fontSize: '0.8rem', color: '#777777', marginBottom: '1.5rem' }}>Try relaxing your filter parameters to see more options.</p>
            <button
              onClick={resetFilters}
              style={{ 
                background: '#15232e',
                color: '#FFFFFF', 
                padding: '0.75rem 1.5rem', 
                border: 'none', 
                fontSize: '11px', 
                fontWeight: 600, 
                letterSpacing: '0.15em', 
                textTransform: 'uppercase', 
                cursor: 'pointer', 
                transition: 'background 0.3s ease' 
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#C8A87C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#15232e'; }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    }>
      <RoomsContent />
    </Suspense>
  );
}