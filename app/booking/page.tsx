// app/booking/page.tsx
'use client';
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Room {
  id: number;
  attributes: {
    title: string;
    price: number;
  };
}

function BookingContent() {
  const searchParams = useSearchParams();
  const preSelectedRoom = searchParams.get('room');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    room: preSelectedRoom || '',
    check_in: '',
    check_out: '',
    total: 0,
    screenshot: null as File | null,
  });

  // Fetch rooms for dropdown
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/rooms?filters[available][$eq]=true&populate=*`)
      .then((res) => res.json())
      .then((data) => setRooms(data.data || []));
  }, []);

  // Auto-calculate total
  useEffect(() => {
    if (formData.room && formData.check_in && formData.check_out) {
      const selectedRoom = rooms.find((r) => String(r.id) === String(formData.room));
      if (selectedRoom) {
        const price = selectedRoom.attributes.price;
        const checkIn = new Date(formData.check_in);
        const checkOut = new Date(formData.check_out);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        if (nights > 0) {
          setFormData((prev) => ({ ...prev, total: price * nights }));
        }
      }
    }
  }, [formData.room, formData.check_in, formData.check_out, rooms]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, screenshot: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        room: formData.room,
        check_in: formData.check_in,
        check_out: formData.check_out,
        total: formData.total,
        booking_status: 'Pending',
      },
    };

    const submitData = new FormData();
    submitData.append('data', JSON.stringify(payload.data));

    if (formData.screenshot) {
      submitData.append('files.screenshot', formData.screenshot);
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_URL}/bookings`, {
        method: 'POST',
        body: submitData,
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', room: '', check_in: '', check_out: '', total: 0, screenshot: null });
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      alert('Network error. Check if Strapi is running.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 dark:text-green-400">
          ✅ Booking Submitted!
        </h1>
        <p className="text-base sm:text-xl mt-3 sm:mt-4 text-gray-600 dark:text-gray-400">
          Admin will verify your payment screenshot shortly.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 sm:mt-8 bg-black dark:bg-slate-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded hover:bg-gray-800 dark:hover:bg-slate-600 transition text-sm sm:text-base"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <main  className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 bg-white dark:bg-slate-950 transition-colors duration-300 min-h-screen">
      <Link
        href="/"
        className="text-black dark:text-gray-300 underline inline-block mb-6 sm:mb-8 hover:text-blue-600 dark:hover:text-blue-400 transition text-sm sm:text-base"
      >
        ← Back to Home
      </Link>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-800 dark:text-white">
        Book Your Stay
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            Full Name *
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2.5 sm:p-3 border rounded mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            Email *
          </label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2.5 sm:p-3 border rounded mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            Phone Number *
          </label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full p-2.5 sm:p-3 border rounded mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            Select Room *
          </label>
          <select
            name="room"
            value={formData.room}
            onChange={handleChange}
            required
            className="w-full p-2.5 sm:p-3 border rounded mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition text-sm sm:text-base"
          >
            <option value="">Choose a room</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.attributes.title} - ETB {room.attributes.price}/night
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
              Check-in Date *
            </label>
            <input
              name="check_in"
              type="date"
              value={formData.check_in}
              onChange={handleChange}
              required
              className="w-full p-2.5 sm:p-3 border rounded mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
              Check-out Date *
            </label>
            <input
              name="check_out"
              type="date"
              value={formData.check_out}
              onChange={handleChange}
              required
              className="w-full p-2.5 sm:p-3 border rounded mt-1 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition text-sm sm:text-base"
            />
          </div>
        </div>

        {formData.total > 0 && (
          <div className="bg-gray-100 dark:bg-slate-800 p-3 sm:p-4 rounded-lg">
            <p className="text-base sm:text-xl font-bold text-gray-800 dark:text-white">
              Total: ETB {formData.total}
            </p>
          </div>
        )}

        <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 p-4 sm:p-6 rounded-lg text-center">
          <label className="block font-medium mb-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base">
            Upload Payment Screenshot *
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="w-full cursor-pointer text-gray-700 dark:text-gray-300 text-sm sm:text-base file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-800/40"
          />
          {formData.screenshot && (
            <p className="text-green-600 dark:text-green-400 text-sm mt-2">
              ✅ {formData.screenshot.name} uploaded
            </p>
          )}
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
            Upload your bank/transfer receipt
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black dark:bg-slate-700 text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-800 dark:hover:bg-slate-600 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Book Now'}
        </button>
      </form>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 min-h-screen">
          <p className="text-center text-gray-500">Loading booking form...</p>
        </main>
      }
    >
      <BookingContent />
    </Suspense>
  );
}