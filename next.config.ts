/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/process-video": ["./node_modules/ffmpeg-static/**"],
    "/api/media/extract-frame": ["./node_modules/ffmpeg-static/**"],
  },
};

module.exports = nextConfig;
