'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getHotelDetails, getAvailableRooms, getAmenities, getTestimonials, renderRichText } from './lib/api';
import MenuSection from './components/MenuSection';
import AnimatedCounter from './components/AnimatedCounter';
import ScrollReveal from './components/ScrollReveal';
import RestaurantSection from './components/RestaurantSection';
import { BedIcon, GuestIcon } from './components/Icons';
import Image from 'next/image';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const GOLD = '#C8A87C';
const DARK_NAVY = '#17232E';

async function getMenuItems() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/menus?sort=order&populate=image`);
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getAboutDetails() {
  try {
    const res = await fetch(`${STRAPI_URL}/api/about?populate=*`);
    const data = await res.json();
    return data.data?.attributes || null;
  } catch {
    return null;
  }
}

export default function Home() {
  const router = useRouter();
  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [about, setAbout] = useState<any>(null);
  const [homeWelcome, setHomeWelcome] = useState<any>(null);
  const [serviceCards, setServiceCards] = useState<any[]>([]);
  const [featureIcons, setFeatureIcons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offsetY, setOffsetY] = useState(0);

  // ─── Responsive ──────────────────────────────────────────────
  const [screenWidth, setScreenWidth] = useState(0);
  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  // ─── Booking Search ──────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // ─── Rooms Carousel ──────────────────────────────────────────
  const [roomsIndex, setRoomsIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const roomsRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const roomCount = rooms.length;
  const extendedRooms = roomCount > 0 ? [...rooms, ...rooms, ...rooms] : [];
  const realIndex = roomCount > 0 ? ((roomsIndex % roomCount) + roomCount) % roomCount : 0;

  const CARD_WIDTH = isMobile ? 280 : 580;
  const CARD_GAP = isMobile ? 12 : 24;
  const ITEM_FULL_WIDTH = CARD_WIDTH + CARD_GAP;

  useEffect(() => {
    if (roomCount > 0) {
      setRoomsIndex(roomCount);
    }
  }, [roomCount]);

  const handleTransitionEnd = () => {
    if (roomCount === 0) return;
    if (roomsIndex >= roomCount * 2) {
      setIsTransitioning(false);
      setRoomsIndex(roomsIndex - roomCount);
    } else if (roomsIndex < roomCount) {
      setIsTransitioning(false);
      setRoomsIndex(roomsIndex + roomCount);
    }
  };

  const handleNextRoom = () => {
    setIsTransitioning(true);
    setRoomsIndex((prev) => prev + 1);
  };

  const handlePrevRoom = () => {
    setIsTransitioning(true);
    setRoomsIndex((prev) => prev - 1);
  };

  const handleSelectRoom = (targetRealIdx: number) => {
    setIsTransitioning(true);
    const currentBase = Math.floor(roomsIndex / roomCount) * roomCount;
    setRoomsIndex(currentBase + targetRealIdx);
  };

  // ─── Amenities Slider ────────────────────────────────────────
  const [amenitiesPage, setAmenitiesPage] = useState(0);
  const [amenitiesAnimating, setAmenitiesAnimating] = useState(false);
  const [amenitiesSlideDir, setAmenitiesSlideDir] = useState<'left' | 'right' | 'fade'>('right');
  const amenitiesPerRow = isMobile ? 1 : isTablet ? 2 : 3;
  const amenitiesTotalPages = Math.ceil(amenities.length / amenitiesPerRow);
  const visibleAmenities = amenities.slice(amenitiesPage * amenitiesPerRow, amenitiesPage * amenitiesPerRow + amenitiesPerRow);
  const isFullAmenitiesRow = visibleAmenities.length === amenitiesPerRow;

  const getAmenitiesTransform = () => {
    if (!amenitiesAnimating) return 'translateX(0px)';
    if (amenitiesSlideDir === 'right') return 'translateX(-30px)';
    if (amenitiesSlideDir === 'left') return 'translateX(30px)';
    return 'translateY(10px)';
  };

  const handleAmenitiesPageChange = (newPage: number, direction: 'left' | 'right') => {
    if (amenitiesAnimating) return;
    setAmenitiesSlideDir(direction);
    setAmenitiesAnimating(true);
    setTimeout(() => {
      setAmenitiesPage(newPage);
      setAmenitiesAnimating(false);
    }, 200);
  };

  const goPrevAmenities = (e: React.MouseEvent) => {
    e.preventDefault();
    if (amenitiesPage > 0 && !amenitiesAnimating) {
      handleAmenitiesPageChange(amenitiesPage - 1, 'left');
    }
  };

  const goNextAmenities = (e: React.MouseEvent) => {
    e.preventDefault();
    if (amenitiesPage < amenitiesTotalPages - 1 && !amenitiesAnimating) {
      handleAmenitiesPageChange(amenitiesPage + 1, 'right');
    }
  };

  // ─── Testimonials Slider ─────────────────────────────────────
  const [testimonialsPage, setTestimonialsPage] = useState(0);
  const [testimonialsAnimating, setTestimonialsAnimating] = useState(false);
  const [testimonialsSlideDir, setTestimonialsSlideDir] = useState<'left' | 'right' | 'fade'>('right');
  const testimonialsPerRow = isMobile ? 1 : isTablet ? 2 : 3;
  const testimonialsTotalPages = Math.ceil(testimonials.length / testimonialsPerRow);
  const visibleTestimonials = testimonials.slice(testimonialsPage * testimonialsPerRow, testimonialsPage * testimonialsPerRow + testimonialsPerRow);
  const isFullTestimonialsRow = visibleTestimonials.length === testimonialsPerRow;

  const getTestimonialsTransform = () => {
    if (!testimonialsAnimating) return 'translateX(0px)';
    if (testimonialsSlideDir === 'right') return 'translateX(-30px)';
    if (testimonialsSlideDir === 'left') return 'translateX(30px)';
    return 'translateY(10px)';
  };

  const handleTestimonialsPageChange = (newPage: number, direction: 'left' | 'right') => {
    if (testimonialsAnimating) return;
    setTestimonialsSlideDir(direction);
    setTestimonialsAnimating(true);
    setTimeout(() => {
      setTestimonialsPage(newPage);
      setTestimonialsAnimating(false);
    }, 200);
  };

  const goPrevTestimonials = (e: React.MouseEvent) => {
    e.preventDefault();
    if (testimonialsPage > 0 && !testimonialsAnimating) {
      handleTestimonialsPageChange(testimonialsPage - 1, 'left');
    }
  };

  const goNextTestimonials = (e: React.MouseEvent) => {
    e.preventDefault();
    if (testimonialsPage < testimonialsTotalPages - 1 && !testimonialsAnimating) {
      handleTestimonialsPageChange(testimonialsPage + 1, 'right');
    }
  };

  // ─── Hero Slider ─────────────────────────────────────────────
  type HotelMedia = {
    url?: string;
    mime?: string;
    attributes?: { url?: string; mime?: string };
  };

  let mediaList: HotelMedia[] = [];
  if (hotel?.main_photo?.data && Array.isArray(hotel.main_photo.data)) {
    mediaList = hotel.main_photo.data.map((item: { attributes?: HotelMedia }) => item.attributes ?? {});
  } else if (Array.isArray(hotel?.main_photo)) {
    mediaList = hotel.main_photo;
  } else if (hotel?.main_photo?.url) {
    mediaList = [hotel.main_photo];
  }
  const [mediaIndex, setMediaIndex] = useState(0);
  const getMediaUrl = (media: HotelMedia | null | undefined) => {
    if (!media) return undefined;
    const url = media.url || media?.attributes?.url;
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const base = STRAPI_URL.endsWith('/') ? STRAPI_URL.slice(0, -1) : STRAPI_URL;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };
  const isVideo = (media: HotelMedia | null | undefined) => {
    if (!media) return false;
    const mime = media.mime || media?.attributes?.mime;
    return mime?.startsWith('video/');
  };
  const handlePrevMedia = () => {
    if (mediaList.length === 0) return;
    setMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1));
  };
  const handleNextMedia = () => {
    if (mediaList.length === 0) return;
    setMediaIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1));
  };

  // ─── Redirect to Checkout ────────────────────────────────────
  const handleSearchAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: adults.toString(),
      children: children.toString(),
    });
    router.push(`/rooms?${params.toString()}`);
  };

  // ─── Data Fetching ───────────────────────────────────────────
  useEffect(() => {
    async function loadAllData() {
      try {
        const [hotelData, roomsData, menuData, amenitiesData, testimonialsData, aboutData,
          homeWelcomeRes, serviceCardsRes, featureIconsRes] = await Promise.all([
            getHotelDetails(),
            getAvailableRooms(true),
            getMenuItems(),
            getAmenities(),
            getTestimonials(),
            getAboutDetails(),
            fetch(`${STRAPI_URL}/api/home-welcome?populate=gallery`),
            fetch(`${STRAPI_URL}/api/services?populate=*`),
            fetch(`${STRAPI_URL}/api/feature-icons?populate=*`),
          ]);
        setHotel(hotelData);
        setRooms(roomsData);
        setMenuItems(menuData);
        setAmenities(amenitiesData);
        setTestimonials(testimonialsData);
        setAbout(aboutData);
        const homeWelcomeJson = await homeWelcomeRes.json();
        setHomeWelcome(homeWelcomeJson.data?.attributes || homeWelcomeJson.data);
        const serviceCardsJson = await serviceCardsRes.json();
        setServiceCards(serviceCardsJson.data || []);
        const featureIconsJson = await featureIconsRes.json();
        setFeatureIcons(featureIconsJson.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Dynamic Title & Favicon ────────────────────────────────
  useEffect(() => {
    if (!hotel) return;
    const hotelName = hotel.name || 'Hotel';
    document.title = hotelName;
    let logoUrl = null;
    if (hotel?.logo?.url) logoUrl = hotel.logo.url;
    else if (hotel?.logo?.attributes?.url) logoUrl = hotel.logo.attributes.url;
    else if (typeof hotel?.logo === 'string') logoUrl = hotel.logo;
    if (logoUrl) {
      const fullUrl = logoUrl.startsWith('http') ? logoUrl : `${STRAPI_URL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        document.head.appendChild(link);
      }
      link.rel = 'icon';
      link.href = fullUrl;
    }
  }, [hotel]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', border: '4px solid #C8A87C', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '16px', color: '#A0A0A0' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const hotelName = hotel?.name || 'Hotel';

  return (
    // ✅ Removed paddingTop – now hero sits correctly
    <div style={{ minHeight: '100vh', background: '#0A0A0A' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .carmelina-input::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
          cursor: pointer;
        }
      `}</style>

      {/* ─── HERO (now with ScrollReveal & no padding) ─── */}
      <ScrollReveal delay={0}>
               <section style={{ position: 'relative', height: isMobile ? '60vh' : '100vh', minHeight: isMobile ? '320px' : '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1rem', overflow: 'hidden', background: '#FFFFFF' }}>
          {/* Dynamic Media Background */}
          {mediaList.length > 0 ? (
            <>
              {mediaList.map((media, idx) => {
                const mediaUrl = getMediaUrl(media);
                return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: idx === mediaIndex ? 1 : 0,
                    opacity: idx === mediaIndex ? 1 : 0,
                    transition: 'opacity 1.2s ease-in-out',
                  }}
                >
                  {isVideo(media) ? (
                    <video
                      src={mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        filter: 'brightness(1.2)',
                      }}
                    />
                  ) : mediaUrl ? (
                    <Image
                      src={mediaUrl}
                      alt={`${hotelName} - slide ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        transform: `translateY(${offsetY * 0.15}px)`,
                        filter: 'brightness(1.2)',
                      }}
                    />
                  ) : null}
                </div>
                );
              })}
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(0,0,0,0.4)' }} />
            </>
          ) : (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#1A1A1A' }} />
          )}

          {/* Hero Navigation Buttons */}
          {mediaList.length > 1 && (
            <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 20, pointerEvents: 'none' }}>
              <button
                onClick={handlePrevMedia}
                style={{
                  pointerEvents: 'auto',
                  position: 'absolute',
                  left: isMobile ? '0.5rem' : '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(4px)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  color: '#FFFFFF',
                  width: isMobile ? '36px' : '48px',
                  height: isMobile ? '36px' : '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200, 168, 124, 0.8)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <svg width={isMobile ? "18" : "24"} height={isMobile ? "18" : "24"} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={handleNextMedia}
                style={{
                  pointerEvents: 'auto',
                  position: 'absolute',
                  right: isMobile ? '0.5rem' : '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(4px)',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  color: '#FFFFFF',
                  width: isMobile ? '36px' : '48px',
                  height: isMobile ? '36px' : '48px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200, 168, 124, 0.8)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <svg width={isMobile ? "18" : "24"} height={isMobile ? "18" : "24"} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}

          {/* Hero Content */}
          <div style={{ position: 'relative', zIndex: 10, maxWidth: '896px', margin: '0 auto', textAlign: 'center', padding: '0 1rem' }}>
            <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.25rem', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '1rem', textShadow: '0 2px 30px rgba(0,0,0,0.5)' }}>
              {hotel?.tagline || 'Experience Luxury in the Heart of Shashamane'}
            </h1>
            <p style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', color: '#FFFFFF', marginBottom: '2rem', maxWidth: '672px', margin: '0 auto 2rem', lineHeight: '1.625', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
              Welcome to {hotelName}, where comfort meets elegance.
            </p>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#rooms" style={{ background: 'linear-gradient(135deg, #C8A87C 0%, #E8D5B8 100%)', color: '#1A1A1A', fontWeight: 600, padding: isMobile ? '0.6rem 1.25rem' : '0.75rem 2rem', borderRadius: '9999px', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: isMobile ? '0.75rem' : '0.875rem', transition: 'all 0.3s ease', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(200,168,124,0.3)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>Explore Rooms<svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></a>
              <Link href="/rooms" style={{ border: '2px solid #FFFFFF', color: '#FFFFFF', fontWeight: 600, padding: isMobile ? '0.6rem 1.25rem' : '0.75rem 2rem', borderRadius: '9999px', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: isMobile ? '0.75rem' : '0.875rem', transition: 'all 0.3s ease', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#1A1A1A'; e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,255,255,0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>Book Now<svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></Link>
            </div>
          </div>
        </section>
      </ScrollReveal>

   {/* ─── CHECK-IN / BOOKING SEARCH BAR ─── */}
<ScrollReveal delay={200}>
  <section
    style={{
      position: 'relative',
      zIndex: 30,
      marginTop: isMobile ? '-20px' : '-50px',
      padding: isMobile ? '0 1rem' : '0 1rem',
      maxWidth: '1180px',
      margin: isMobile ? '-20px 1rem 2rem' : '-50px auto 3rem',
      backgroundColor: '#FFFFFF', // Forcefully overriding any dark background
      borderRadius: '4px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
    }}
  >
    <form
      onSubmit={handleSearchAvailability}
      style={{
        backgroundColor: '#FFFFFF',
        padding: isMobile ? '1rem' : '1.75rem 2rem',
        borderBottom: '3px solid #17232E',
        borderRadius: '4px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem',
          alignItems: 'end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
          <label
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              fontWeight: 600,
              color: '#777777',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            CHECK - IN
          </label>
          <input
            type="date"
            className="carmelina-input"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            style={{
              border: 'none',
              borderBottom: '1px solid #DDDDDD',
              padding: '0.5rem 0',
              fontSize: '1rem',
              color: '#111111',
              outline: 'none',
              backgroundColor: '#FFFFFF', // Changed from transparent
            }}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
          <label
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              fontWeight: 600,
              color: '#777777',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            CHECK - OUT
          </label>
          <input
            type="date"
            className="carmelina-input"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            style={{
              border: 'none',
              borderBottom: '1px solid #DDDDDD',
              padding: '0.5rem 0',
              fontSize: '1rem',
              color: '#111111',
              outline: 'none',
              backgroundColor: '#FFFFFF', // Changed from transparent
            }}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
          <label
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              fontWeight: 600,
              color: '#777777',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            GUESTS
          </label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            style={{
              border: 'none',
              borderBottom: '1px solid #DDDDDD',
              padding: '0.5rem 0',
              fontSize: '1rem',
              color: '#111111',
              outline: 'none',
              backgroundColor: '#FFFFFF', // Changed from transparent
              cursor: 'pointer',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
          <label
            style={{
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              fontWeight: 600,
              color: '#777777',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}
          >
            CHILDREN
          </label>
          <select
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            style={{
              border: 'none',
              borderBottom: '1px solid #DDDDDD',
              padding: '0.5rem 0',
              fontSize: '1rem',
              color: '#111111',
              outline: 'none',
              backgroundColor: '#FFFFFF', // Changed from transparent
              cursor: 'pointer',
            }}
          >
            {[0, 1, 2, 3, 4].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gridColumn: isMobile ? '1 / -1' : 'span 1',
            backgroundColor: '#FFFFFF',
          }}
        >
          <button
            type="submit"
            style={{
              backgroundColor: '#17232E',
              color: '#FFFFFF',
              padding: '0.85rem 1.25rem',
              border: 'none',
              fontSize: '0.75rem',
              letterSpacing: '0.18em',
              fontWeight: 600,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#B69B78';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#17232E';
            }}
          >
            CHECK AVAILABILITY
          </button>
        </div>
      </div>
    </form>
  </section>
</ScrollReveal>

      {/* ─── ABOUT (HomeWelcome) ─── */}
      {homeWelcome && (
        <section style={{ padding: isMobile ? '3rem 1rem' : '4.5rem 1rem', background: '#F5F3EF' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
            <ScrollReveal delay={100}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '1px', background: GOLD }} />
                <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', fontWeight: 600, color: GOLD, textTransform: 'uppercase' }}>
                  {homeWelcome.subtitle || 'WE ARE THE BEST 5 STAR HOTEL FOR YOU'}
                </span>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: 700, color: '#1A1A1A', lineHeight: '1.15', marginBottom: '2rem' }}>
                {homeWelcome.title || 'A Boutique Hotel In The Heart of Shashamane'}
              </h2>
            </ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '2rem' : '3rem' }}>
              <ScrollReveal delay={300}>
                <div>
                  <div style={{ color: '#555', fontSize: '0.95rem', lineHeight: '1.7' }}>
                    {homeWelcome.content ? <div dangerouslySetInnerHTML={{ __html: renderRichText(homeWelcome.content) }} /> : <p>Welcome to our hospitality journey...</p>}
                  </div>
                  <Link href={homeWelcome.discovery_link || '/about'} style={{ display: 'inline-block', marginTop: '1.5rem', background: DARK_NAVY, color: '#FFFFFF', padding: '0.8rem 2.5rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', transition: 'all 0.3s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = DARK_NAVY; }} onMouseLeave={(e) => { e.currentTarget.style.background = DARK_NAVY; e.currentTarget.style.color = '#FFFFFF'; }}>
                    {homeWelcome.discovery_label || 'Discovery More'}
                  </Link>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={450}>
                <div>
                  <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.8', fontStyle: 'italic', marginBottom: '1rem' }}>
                    "{homeWelcome.quote || 'Our mission is to provide peace of mind, consistency, and build loyalty based on the value of our relationships with guests.'}"
                  </p>
                  <div style={{ fontFamily: '"Great Vibes", cursive', fontSize: '1.8rem', color: DARK_NAVY, marginBottom: '0.25rem' }}>
                    {homeWelcome.author_name || 'Dave Bautista'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#999', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {homeWelcome.author_title || '– General Manager'}
                  </div>
                </div>
              </ScrollReveal>
            </div>
            {homeWelcome?.gallery && homeWelcome.gallery.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem' }}>
                {homeWelcome.gallery.slice(0, 3).map((img: any, idx: number) => {
                  const rawUrl = img.url;
                  const rootUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
                  const cleanRoot = rootUrl.replace(/\/$/, '');
                  const cleanPath = rawUrl?.startsWith('/') ? rawUrl : `/${rawUrl}`;
                  const imgSrc = rawUrl?.startsWith('http') ? rawUrl : `${cleanRoot}${cleanPath}`;
                  return (
                    <ScrollReveal key={idx} delay={600 + (idx * 150)}>
                      <div style={{ height: isMobile ? '220px' : '350px', overflow: 'hidden', background: '#E8E8E8' }}>
                        <img src={imgSrc} alt={`Gallery ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── ROOMS CAROUSEL ─── */}
      <ScrollReveal delay={100}>
        <section
          style={{
            padding: isMobile ? '2.5rem 0' : '4.5rem 0',
            background: '#ECEAE6',
            color: '#111111',
            overflow: 'hidden',
          }}
          id="rooms"
          ref={roomsRef}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', padding: '0 1rem', position: 'relative' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/rooms" style={{ background: 'transparent', color: '#B69B78', fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.8rem', textDecoration: 'none', border: '1px solid #B69B78', borderRadius: '9999px', padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.25rem', transition: 'all 0.3s ease', whiteSpace: 'nowrap' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#B69B78'; e.currentTarget.style.color = '#111111'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B69B78'; e.currentTarget.style.transform = 'scale(1)'; }}>View All Rooms</Link>
            </div>
            <span style={{ color: '#B69B78', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 600, display: 'block', marginTop: isMobile ? '-0.25rem' : 0, marginBottom: '0.5rem' }}>OUR ROOMS</span>
            <h2 style={{ fontSize: isMobile ? '1.6rem' : '2.1rem', fontWeight: 600, color: '#111111', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>LUXURIOUS AND COMFORTABLE SPACE</h2>
          </div>
          <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
            <div onTransitionEnd={handleTransitionEnd} style={{ display: 'flex', alignItems: 'center', transform: `translateX(calc(50vw - ${CARD_WIDTH / 2}px - ${roomsIndex * ITEM_FULL_WIDTH}px))`, transition: isTransitioning ? 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)' : 'none', willChange: 'transform' }}>
              {extendedRooms.map((room, idx) => {
                const roomData = room?.attributes || room;
                const photos = roomData?.photos || [];
                const imageUrl = photos.length > 0 ? photos[0]?.url : null;
                const isActive = idx === roomsIndex;
                const isHovered = idx === hoveredIndex;
                return (
                  <div key={idx} onClick={() => { setIsTransitioning(true); setRoomsIndex(idx); }} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)} style={{ minWidth: `${CARD_WIDTH}px`, maxWidth: `${CARD_WIDTH}px`, height: isMobile ? '320px' : '370px', margin: `0 ${CARD_GAP / 2}px`, position: 'relative', overflow: 'hidden', cursor: isActive ? 'default' : 'pointer', opacity: isActive ? 1 : 0.65, transform: isActive ? 'scale(1)' : 'scale(0.96)', transition: 'transform 0.6s ease, opacity 0.6s ease', flexShrink: 0 }}>
                    {imageUrl ? <img src={`${STRAPI_URL}${imageUrl}`} alt={roomData?.title || 'Room'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', background: '#2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888888' }}>No Image Available</div>}
                    <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', backgroundColor: '#B69B78', color: '#FFFFFF', padding: '0.25rem 1rem', fontSize: isMobile ? '0.5rem' : '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', zIndex: 2, borderRadius: '0', pointerEvents: 'none' }}>FROM ETB {roomData?.price || 0}</div>
                    <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', background: isHovered ? 'rgba(255,255,255,0.85)' : 'linear-gradient(to top, rgba(23,35,46,0.95) 0%, rgba(23,35,46,0.5) 60%, transparent 100%)', padding: isHovered ? isMobile ? '0.8rem 1rem' : '1.2rem 1.5rem 1rem 1.5rem' : isMobile ? '1rem 1rem 0.8rem 1rem' : '2rem 1.5rem 1.5rem 1.5rem', color: isHovered ? '#111111' : '#FFFFFF', zIndex: 2, transition: 'all 0.4s ease', backdropFilter: isHovered ? 'blur(4px)' : 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <h3 style={{ fontSize: isHovered ? (isMobile ? '1.1rem' : '1.4rem') : (isMobile ? '1rem' : '1.25rem'), fontWeight: 500, margin: '0 0 0.25rem 0', color: isHovered ? '#17232E' : '#FFFFFF', letterSpacing: '0.02em', transition: 'all 0.3s ease' }}><Link href={`/rooms/${room.documentId || room.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{roomData?.title || 'Standard Room'}</Link></h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isHovered ? (isMobile ? '0.7rem' : '0.85rem') : (isMobile ? '0.6rem' : '0.75rem'), color: isHovered ? '#555' : '#D0D5DD', marginBottom: '0.6rem', fontWeight: 300, transition: 'all 0.3s ease', flexWrap: 'wrap' }}>
                        {roomData?.size && <span>{roomData.size} m²</span>}<span></span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
  <BedIcon size={isMobile ? 14 : 16} color={isHovered ? '#555' : '#D0D5DD'} />
  {roomData?.bed_type || '2 Beds'}
</span>
<span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
  <GuestIcon size={isMobile ? 14 : 16} color={isHovered ? '#555' : '#D0D5DD'} />
  {roomData?.capacity || 4} Guests
</span>
                      </div>
                      {isHovered ? (<Link href={`/rooms/${room.documentId || room.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.25rem', color: '#B69B78', fontWeight: 600, fontSize: isMobile ? '0.7rem' : '0.85rem', textDecoration: 'none', letterSpacing: '0.06em', transition: 'all 0.3s ease', width: '100%' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#17232E'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#B69B78'; }}>ROOM DETAILS<svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.5rem' }}><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></svg></Link>) : (<Link href={`/rooms/${room.documentId || room.id}`} style={{ color: '#B69B78', fontWeight: 500, fontSize: isMobile ? '0.6rem' : '0.75rem', textDecoration: 'none', letterSpacing: '0.08em', transition: 'all 0.3s ease', display: 'inline-block', borderBottom: '1.5px solid #B69B78', paddingBottom: '0.15rem' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#E8D5B8'; e.currentTarget.style.borderColor = '#E8D5B8'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#B69B78'; e.currentTarget.style.borderColor = '#B69B78'; }}>ROOM DETAILS</Link>)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {rooms.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0.5rem' : '2rem', marginTop: '2.5rem', flexWrap: 'wrap', padding: '0 1rem' }}>
              <button onClick={handlePrevRoom} style={{ background: isMobile ? 'rgba(0, 0, 0, 0.3)' : 'none', border: isMobile ? '2px solid rgba(255, 255, 255, 0.8)' : 'none', backdropFilter: isMobile ? 'blur(4px)' : 'none', borderRadius: isMobile ? '50%' : '0', width: isMobile ? '40px' : 'auto', height: isMobile ? '40px' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 'inherit' : '1.5rem', cursor: 'pointer', color: isMobile ? '#FFFFFF' : '#111111', padding: '0', transition: 'all 0.3s ease', lineHeight: 1 }} aria-label="Previous room" onMouseEnter={(e) => { if (isMobile) { e.currentTarget.style.background = 'rgba(200, 168, 124, 0.8)'; e.currentTarget.style.transform = 'scale(1.1)'; } }} onMouseLeave={(e) => { if (isMobile) { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; e.currentTarget.style.transform = 'scale(1)'; } }}>{isMobile ? (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>) : ('←')}</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.4rem' : '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>{rooms.map((_, idx) => { const pageNum = String(idx + 1).padStart(2, '0'); const isActive = idx === realIndex; return (<div key={idx} onClick={() => handleSelectRoom(idx)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', userSelect: 'none' }}><span style={{ fontSize: isMobile ? '0.75rem' : '0.9rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#111111' : '#999999', transition: 'color 0.3s ease' }}>{pageNum}</span>{isActive && (<div style={{ width: isMobile ? '15px' : '45px', height: '1px', backgroundColor: '#111111', transition: 'all 0.4s ease' }} />)}</div>); })}</div>
              <button onClick={handleNextRoom} style={{ background: isMobile ? 'rgba(0, 0, 0, 0.3)' : 'none', border: isMobile ? '2px solid rgba(255, 255, 255, 0.8)' : 'none', backdropFilter: isMobile ? 'blur(4px)' : 'none', borderRadius: isMobile ? '50%' : '0', width: isMobile ? '40px' : 'auto', height: isMobile ? '40px' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 'inherit' : '1.5rem', cursor: 'pointer', color: isMobile ? '#FFFFFF' : '#111111', padding: '0', transition: 'all 0.3s ease', lineHeight: 1 }} aria-label="Next room" onMouseEnter={(e) => { if (isMobile) { e.currentTarget.style.background = 'rgba(200, 168, 124, 0.8)'; e.currentTarget.style.transform = 'scale(1.1)'; } }} onMouseLeave={(e) => { if (isMobile) { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; e.currentTarget.style.transform = 'scale(1)'; } }}>{isMobile ? (<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>) : ('→')}</button>
            </div>
          )}
        </section>
      </ScrollReveal>

      {/* ─── SERVICES & FEATURES ─── */}
      {serviceCards.length > 0 && featureIcons.length > 0 && (
        <section style={{ padding: isMobile ? '3rem 1rem' : '4.5rem 1rem', background: '#FAFAFA', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
          <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
            <ScrollReveal delay={100}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
                {serviceCards.slice(0, 3).map((card, idx) => {
                  const data = card.attributes || card;
                  return (
                    <ScrollReveal key={card.documentId || idx} delay={200 + (idx * 100)}>
                      <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid #E8E8E8', background: '#FFFFFF', padding: '2.5rem 2rem', textAlign: 'center', borderRadius: '0px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', transition: 'border-color 0.7s ease, transform 0.7s ease, box-shadow 0.7s ease', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', zIndex: 1 }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#A89279'; e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(21, 35, 46, 0.15)'; const bgOverlay = e.currentTarget.querySelector<HTMLElement>('.carmelina-bg-overlay'); if (bgOverlay) { bgOverlay.style.transform = 'translate(-50%, -50%) scale(1)'; bgOverlay.style.opacity = '1'; } const iconBox = e.currentTarget.querySelector<HTMLElement>('.carmelina-icon-box'); if (iconBox) iconBox.style.transform = 'rotateY(180deg)'; const titleEl = e.currentTarget.querySelector<HTMLElement>('.card-title'); const descEl = e.currentTarget.querySelector<HTMLElement>('.card-desc'); if (titleEl) titleEl.style.color = '#FFFFFF'; if (descEl) descEl.style.color = 'rgba(255, 255, 255, 0.85)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)'; const bgOverlay = e.currentTarget.querySelector<HTMLElement>('.carmelina-bg-overlay'); if (bgOverlay) { bgOverlay.style.transform = 'translate(-50%, -50%) scale(0)'; bgOverlay.style.opacity = '0'; } const iconBox = e.currentTarget.querySelector<HTMLElement>('.carmelina-icon-box'); if (iconBox) iconBox.style.transform = 'rotateY(0deg)'; const titleEl = e.currentTarget.querySelector<HTMLElement>('.card-title'); const descEl = e.currentTarget.querySelector<HTMLElement>('.card-desc'); if (titleEl) titleEl.style.color = DARK_NAVY; if (descEl) descEl.style.color = '#666666'; }}
                      >
                        <div className="carmelina-bg-overlay" style={{ position: 'absolute', top: '50%', left: '50%', width: '160%', height: '160%', background: '#15232e', borderRadius: '50%', transform: 'translate(-50%, -50%) scale(0)', opacity: 0, transition: 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.7s ease', pointerEvents: 'none', zIndex: -1 }} />
                        <div className="carmelina-icon-box" style={{ width: '80px', height: '80px', background: '#A89279', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '2rem', borderRadius: '0px', flexShrink: 0, transition: 'transform 0.8s ease-in-out', perspective: '1000px', position: 'relative', zIndex: 2 }}><i className={data.icon || 'fa-solid fa-star'}></i></div>
                        <h3 className="card-title" style={{ fontSize: '1.05rem', fontWeight: 600, color: DARK_NAVY, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.85rem', position: 'relative', zIndex: 2, transition: 'color 0.6s ease' }}>{data.title || 'Service'}</h3>
                        <p className="card-desc" style={{ fontSize: '0.85rem', color: '#666666', lineHeight: '1.7', margin: 0, flexGrow: 1, position: 'relative', zIndex: 2, transition: 'color 0.6s ease' }}>{data.description || 'Experience exceptional service and care.'}</p>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </ScrollReveal>
            <ScrollReveal delay={550}>
              <div style={{ textAlign: 'center', padding: '0 1rem 3rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
                <p style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', color: DARK_NAVY, lineHeight: '1.6', letterSpacing: '0.02em', fontWeight: 500 }}>For us a luxurious room is not enough, we bring customers many high-quality services, make sure your vacation is perfect.</p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={700}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '1.5rem' : '3.5rem', flexWrap: 'wrap', padding: '0 1rem' }}>
                {featureIcons.slice(0, 5).map((item, idx) => {
                  const data = item.attributes || item;
                  return (
                    <ScrollReveal key={item.documentId || idx} delay={800 + (idx * 80)}>
                      <div style={{ textAlign: 'center', minWidth: isMobile ? '70px' : 'auto', cursor: 'pointer', transition: 'all 0.4s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; const iconEl = e.currentTarget.querySelector<HTMLElement>('.feature-icon'); if (iconEl) iconEl.style.color = '#A89279'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; const iconEl = e.currentTarget.querySelector<HTMLElement>('.feature-icon'); if (iconEl) iconEl.style.color = '#999'; }}>
                        <div className="feature-icon" style={{ fontSize: '2.5rem', color: '#999', marginBottom: '0.75rem', transition: 'color 0.4s ease' }}><i className={data.Icon_Class || 'fa-solid fa-circle'}></i></div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: DARK_NAVY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{data.Label || 'Service'}</p>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ─── MENU ─── */}
      {menuItems.length > 0 && (
        <ScrollReveal delay={100}>
          <MenuSection items={menuItems} />
        </ScrollReveal>
      )}

      {/* ─── RESTAURANT & BAR ─── */}
      <ScrollReveal delay={100}>
        <RestaurantSection />
      </ScrollReveal>


{/* ─── STATS ─── */}
<ScrollReveal delay={150}>
  <section
    style={{
      padding: isMobile ? '2.5rem 1rem 2rem 1rem' : '4rem 1rem 2rem 1rem', // ✅ bottom padding for spacing
      background: '#FFFFFF',
      border: 'none',              // ✅ force remove all borders
      boxShadow: 'none',
    }}
  >
    <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
        }}
      >
        <AnimatedCounter target={10} label="Years of Service" />
        <AnimatedCounter target={25} label="Luxury Rooms" />
        <AnimatedCounter target={500} label="Happy Guests" />
        <AnimatedCounter target={20} label="Professional Staff" />
      </div>
    </div>
  </section>
</ScrollReveal>


      {/* ─── TESTIMONIALS ─── */}
      <ScrollReveal delay={100}>
        <section style={{ padding: isMobile ? '2.5rem 1rem' : '4rem 1rem', background: '#FFFFFF', borderTop: '1px solid #E8E8E8' }} id="testimonials">
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <span className="section-tag">Testimonials</span>
              <h2 className="section-title">What Our Guests Say</h2>
              <p style={{ color: '#666666', marginTop: '0.5rem', fontSize: '0.875rem', maxWidth: '672px', margin: '0.5rem auto 0' }}>Real reviews from real guests who stayed with us</p>
              <div className="section-divider"></div>
            </div>
            <div style={{ display: isFullTestimonialsRow ? 'grid' : 'flex', gridTemplateColumns: isFullTestimonialsRow ? `repeat(${testimonialsPerRow}, 1fr)` : 'none', justifyContent: isFullTestimonialsRow ? 'normal' : 'center', alignItems: isFullTestimonialsRow ? 'normal' : 'stretch', gap: '24px', padding: '0.25rem 0', width: '100%', opacity: testimonialsAnimating ? 0 : 1, transform: getTestimonialsTransform(), transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              {visibleTestimonials.map((review, idx) => {
                const avatarUrl = review?.avatar?.url ? `${STRAPI_URL}${review.avatar.url}` : null;
                const formatDate = (dateString: string) => {
                  if (!dateString) return null;
                  const date = new Date(dateString);
                  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                };
                const roomName = review?.room?.title || review?.relatedRoom || null;
                return (
                  <div key={review.documentId || idx} style={{ width: isFullTestimonialsRow ? '100%' : (isMobile ? '100%' : '380px'), maxWidth: isFullTestimonialsRow ? '100%' : (isMobile ? '100%' : '380px'), background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: '1rem', padding: isMobile ? '1.25rem' : '1.5rem', transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', display: 'flex', flexDirection: 'column', height: '100%' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C8A87C'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.06)'; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>{[...Array(5)].map((_, i) => (<svg key={i} style={{ width: '1.2rem', height: '1.2rem', color: i < (review.rating || 5) ? '#C8A87C' : '#DDD', fill: i < (review.rating || 5) ? '#C8A87C' : 'none' }} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}</div>
                    <p style={{ color: '#555555', fontSize: '0.85rem', lineHeight: '1.6', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>"{review.comment || 'Amazing experience!'}"</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #E8E8E8', marginTop: 'auto' }}>{avatarUrl ? (<img src={avatarUrl} alt={review.guestName || 'Guest'} style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', objectFit: 'cover', border: '2px solid #C8A87C' }} />) : (<div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '50%', background: '#C8A87C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1A1A', fontWeight: 'bold', fontSize: '1rem' }}>{review.guestName?.charAt(0) || 'G'}</div>)}<div><p style={{ fontWeight: 600, color: '#1A1A1A', fontSize: '0.9rem' }}>{review.guestName || 'Guest'}</p>{(roomName || review.dateOfStay) && (<p style={{ fontSize: '0.8rem', color: '#999999' }}>{roomName && `${roomName}`}{roomName && review.dateOfStay && '  '}{review.dateOfStay && formatDate(review.dateOfStay)}</p>)}</div></div>
                  </div>
                );
              })}
            </div>
            {testimonials.length > testimonialsPerRow && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" onClick={goPrevTestimonials} disabled={testimonialsPage === 0 || testimonialsAnimating} style={{ padding: '0.5rem 0.75rem', borderRadius: '9999px', transition: 'all 0.3s ease', background: testimonialsPage === 0 ? '#E8E8E8' : '#C8A87C', color: testimonialsPage === 0 ? '#999999' : '#1A1A1A', cursor: testimonialsPage === 0 || testimonialsAnimating ? 'not-allowed' : 'pointer', border: 'none' }}><svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <div style={{ display: 'flex', gap: '0.375rem' }}>{Array.from({ length: testimonialsTotalPages }).map((_, idx) => (<button key={idx} type="button" onClick={() => { if (idx !== testimonialsPage && !testimonialsAnimating) { handleTestimonialsPageChange(idx, idx > testimonialsPage ? 'right' : 'left'); } }} disabled={testimonialsAnimating} style={{ height: '0.375rem', borderRadius: '9999px', transition: 'all 0.3s ease', background: idx === testimonialsPage ? '#C8A87C' : '#E0E0E0', width: idx === testimonialsPage ? '1.5rem' : '0.375rem', border: 'none', cursor: testimonialsAnimating ? 'not-allowed' : 'pointer' }} />))}</div>
                <button type="button" onClick={goNextTestimonials} disabled={testimonialsPage >= testimonialsTotalPages - 1 || testimonialsAnimating} style={{ padding: '0.5rem 0.75rem', borderRadius: '9999px', transition: 'all 0.3s ease', background: testimonialsPage >= testimonialsTotalPages - 1 ? '#E8E8E8' : '#C8A87C', color: testimonialsPage >= testimonialsTotalPages - 1 ? '#999999' : '#1A1A1A', cursor: testimonialsPage >= testimonialsTotalPages - 1 || testimonialsAnimating ? 'not-allowed' : 'pointer', border: 'none' }}><svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
              </div>
            )}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}