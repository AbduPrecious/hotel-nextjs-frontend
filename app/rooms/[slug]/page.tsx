// app/rooms/[slug]/page.tsx
import { getRoomById, getAvailableRooms, renderRichText } from '../../lib/api';
import RoomClient from './RoomClient';
import Link from 'next/link'; // ✅ Added missing import

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// ─── Static Params ──────────────────────────────────────
export async function generateStaticParams() {
  const rooms = await getAvailableRooms();
  return rooms.map((room: any) => ({
    slug: room.documentId,
  }));
}

// ─── Page Component (Server) ────────────────────────────
export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = await getRoomById(slug);

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-4 sm:px-6 py-8 sm:py-12 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
          Room Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
          The room you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          className="mt-4 sm:mt-6 text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base inline-block"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  const photos = room?.photos || [];
  const heroImage = photos.length > 0 ? `${STRAPI_URL}${photos[0]?.url}` : null;

  return <RoomClient room={room} heroImage={heroImage} />;
}