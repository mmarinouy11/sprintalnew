/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // service_role must never be bundled into the client. Keeping the
    // serverless externals default; server-only guards live in lib/supabase.
  },
};

export default nextConfig;
