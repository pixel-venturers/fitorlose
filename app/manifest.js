import { SITE } from "@/config/site";

// Web app manifest — Next serves this at /manifest.webmanifest and auto-links it.
export default function manifest() {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { "src": "/logo.svg", type: "image/svg+xml", sizes: "any" },
      { "src": "/logo.png", type: "image/png", sizes: "256x256" },
      { "src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
    ],
  };
}
