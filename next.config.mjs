/** @type {import('next').NextConfig} */

function strapiUploadRemotePatterns() {
  const candidates = [
    process.env.NEXT_PUBLIC_STRAPI_URL,
    process.env.STRAPI_URL,
    "https://api-hotel.qenenia.com",
    "http://localhost:3001",
  ].filter(Boolean);
  const seen = new Set();
  const patterns = [];
  for (const raw of candidates) {
    try {
      const u = new URL(raw);
      const key = `${u.hostname}:${u.port || "default"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      patterns.push({
        protocol: u.protocol.replace(":", ""),
        hostname: u.hostname,
        port: u.port || "",
        pathname: "/uploads/**",
      });
    } catch {
      /* skip invalid env */
    }
  }
  return patterns.length > 0
    ? patterns
    : [{ protocol: "http", hostname: "localhost", port: "3001", pathname: "/uploads/**" }];
}

const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: strapiUploadRemotePatterns(),
    // Next.js blocks optimizing images that resolve to localhost/private IPs by default.
    // This is safe in local dev and keeps production locked down.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    /** How long optimized images are cached (browser + `/_next/image`); default is 60s. */
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;