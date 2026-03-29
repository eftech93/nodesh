/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  serverRuntimeConfig: {
    // Will only be available on the server side
    dbHost: process.env.DB_HOST || 'localhost',
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    appName: 'NodeSH Example Next.js App',
  },
};

module.exports = nextConfig;
