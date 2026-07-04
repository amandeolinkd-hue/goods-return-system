import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the app to be opened from other devices on the LAN during dev
  // (e.g. testing on a phone at http://192.168.x.x:3000). Without this,
  // Next.js blocks the JS/HMR dev resources cross-origin, so the page
  // renders but never hydrates (buttons/menus appear dead). No effect in
  // production. Update the exact IP if your machine's LAN address changes.
  allowedDevOrigins: ["192.168.50.170", "192.168.*.*", "*.local"],
};

export default nextConfig;
