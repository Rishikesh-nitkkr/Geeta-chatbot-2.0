/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"]
  },
  // Allow large media files to stream without timing out
  serverExternalPackages: [],
  async headers() {
    return [
      {
        // Security headers on all routes
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Allow speaker output — required for TTS audio playback
          { key: "Permissions-Policy", value: "camera=(), geolocation=()" }
        ]
      },
      {
        // Proper MIME for mp4 videos served from /public
        source: "/:path*.mp4",
        headers: [
          { key: "Content-Type", value: "video/mp4" },
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }
        ]
      },
      {
        // Proper MIME for mp3 audio served from /public
        source: "/:path*.mp3",
        headers: [
          { key: "Content-Type", value: "audio/mpeg" },
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }
        ]
      }
    ];
  }
};

export default nextConfig;
