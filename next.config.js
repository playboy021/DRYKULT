/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // MORA da ostane isključeno. Next-ov dev indikator ima trku: server pošalje
  // ISR_MANIFEST preko HMR socket-a pre nego što hidracija popuni
  // window.next.router.components, pa handleStaticIndicator baci
  // "Cannot read properties of undefined (reading 'components')".
  // Izuzetak obori boot PRE hydrateRoot-a → strana ostane mrtav SSR HTML:
  // vidi se sadržaj, ali nijedan useEffect ne radi i ništa nije klikljivo.
  // Ceo indikator je iza process.env.__NEXT_DEV_INDICATOR — ovim ga nema.
  devIndicators: false,
  // Hero asseti su već izvedeni na tačne dimenzije po tieru (scripts/gen-assets.mjs),
  // pa next/image nema šta da optimizuje — idu kao obični <img> iz /public.
};

module.exports = nextConfig;
