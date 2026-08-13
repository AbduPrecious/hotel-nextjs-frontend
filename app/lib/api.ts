// app/lib/api.ts

// Added fallback URL to prevent crashes if env variable is missing
const STRAPI_BASE =
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:1337';
const API_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  `${STRAPI_BASE.replace(/\/$/, '')}/api`;

// Helper to get image URL from any Strapi response structure
export function getImageUrl(imageData: any): string | null {
  if (!imageData) return null;
  
  // Case 1: Direct url (like your hotel-detail)
  if (imageData.url) return imageData.url;
  
  // Case 2: Strapi v5 format with data.attributes
  if (imageData.data?.attributes?.url) return imageData.data.attributes.url;
  
  // Case 3: Array with data
  if (Array.isArray(imageData) && imageData.length > 0) {
    if (imageData[0].url) return imageData[0].url;
    if (imageData[0].attributes?.url) return imageData[0].attributes.url;
  }
  
  return null;
}

// Fetch Hotel Details (Singleton) - FIXED
export async function getHotelDetails() {
  try {
    const res = await fetch(`${API_URL}/hotel-detail?populate=*`);
    if (!res.ok) return null;
    const data = await res.json();
    // For singletons, Strapi returns data directly, not inside attributes
    // Try attributes first, fallback to the data itself
    return data.data?.attributes || data.data || null;
  } catch (error) {
    console.error('Failed to fetch hotel details:', error);
    return null;
  }
}

export async function getAvailableRooms(featuredOnly: boolean = false) {
  try {
    let url = `${API_URL}/rooms?filters[available][$eq]=true&populate=*`;

    // If featuredOnly is true, add the featured filter
    if (featuredOnly) {
      url = `${API_URL}/rooms?filters[available][$eq]=true&filters[featured][$eq]=true&populate=*`;
    }

    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return [];
  }
}

// Fetch a Single Room by ID (numeric or documentId)
export async function getRoomById(id: string) {
  try {
    // If it's a numeric ID, use the default endpoint
    if (!isNaN(Number(id))) {
      const res = await fetch(`${API_URL}/rooms/${id}?populate=*`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.data || null;
    }

    // If it's a documentId, use a filter
    const res = await fetch(`${API_URL}/rooms?filters[documentId][$eq]=${id}&populate=*`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] || null;
  } catch (error) {
    console.error('Failed to fetch room:', error);
    return null;
  }
}

// ─── FIXED Rich Text Renderer ──────────────────────────────────
// Converts Strapi blocks into beautiful HTML strings
export function renderRichText(blocks: any): string {
  if (!blocks) return '';
  if (typeof blocks === 'string') return blocks;

  const renderChildren = (children: any[]) => {
    if (!children) return '';
    return children.map(child => {
      let text = child.text || '';
      if (child.bold) text = `<strong>${text}</strong>`;
      if (child.italic) text = `<em>${text}</em>`;
      if (child.underline) text = `<u>${text}</u>`;
      return text;
    }).join('');
  };

  if (Array.isArray(blocks)) {
    let html = '';
    for (const block of blocks) {
      if (block.type === 'heading') {
        html += `<h${block.level}>${renderChildren(block.children)}</h${block.level}>`;
      } else if (block.type === 'paragraph') {
        html += `<p>${renderChildren(block.children)}</p>`;
      } else if (block.type === 'list') {
        const tag = block.format === 'ordered' ? 'ol' : 'ul';
        html += `<${tag}>`;
        for (const item of block.children) {
          if (item.type === 'list-item') {
            html += `<li>${renderChildren(item.children)}</li>`;
          }
        }
        html += `</${tag}>`;
      } else if (block.type === 'list-item') {
        // Fallback just in case it appears standalone
        html += `<li>${renderChildren(block.children)}</li>`;
      } else {
        // Fallback for unknown blocks
        html += `<p>${renderChildren(block.children)}</p>`;
      }
    }
    return html;
  }
  return '';
}

// Fetch All Amenities
export async function getAmenities() {
  try {
    const res = await fetch(`${API_URL}/amenities?populate=image`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch amenities:', error);
    return [];
  }
}

// Fetch All Testimonials (Reviews)
export async function getTestimonials() {
  try {
    const res = await fetch(`${API_URL}/reviews?populate=*`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
    return [];
  }
}

// ─── Gallery ──────────────────────────────────────────────

// Fetch All Gallery Images
export async function getGalleryImages() {
  try {
    // If you have an Order field, use: ?sort=Order
    // If not, just remove the sort parameter
    const res = await fetch(`${API_URL}/galleries?populate=Image`);
    const data = await res.json();
    console.log('📦 Gallery API Response:', data);
    return data.data || [];
  } catch (error) {
    console.error('❌ Failed to fetch gallery images:', error);
    return [];
  }
}

// ─── NEW: fetch videos from Strapi ──────────────────────
export async function getGalleryVideos() {
  try {
    // Fixed: Changed STRAPI_URL to API_URL
    const res = await fetch(`${API_URL}/videos?populate=*`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return [];
  }
}