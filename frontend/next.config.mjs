/** @type {import('next').NextConfig} */
<<<<<<< HEAD
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/uploads/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};
=======
const nextConfig = {};
>>>>>>> 3b0dcff828ec79e0a263c977aa2894f301d7c293

export default nextConfig;
