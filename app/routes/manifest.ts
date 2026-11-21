import { BACKGROUND_COLOR, THEME_COLOR } from "~/lib/pwa";
import { strings } from "~/strings";

/** Web app manifest, served as a resource route so it can use `strings`. */
export function loader() {
  return new Response(
    JSON.stringify({
      name: strings.brand.name,
      short_name: strings.brand.name,
      description: strings.pwa.description,
      lang: "bn",
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: THEME_COLOR,
      background_color: BACKGROUND_COLOR,
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    }),
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
