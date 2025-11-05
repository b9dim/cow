const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  webpack: (config) => {
    // Force tunnel-rat (and any nested consumers) to use root zustand
    const zustandPkg = path.dirname(require.resolve('zustand/package.json'));
    const zustandEsm = path.join(zustandPkg, 'esm', 'index.mjs');
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'tunnel-rat/node_modules/zustand': zustandPkg,
      'tunnel-rat/node_modules/zustand/esm/index.mjs': zustandEsm,
      'zustand/esm': path.join(zustandPkg, 'esm'),
    };
    return config;
  },
};

module.exports = nextConfig;


