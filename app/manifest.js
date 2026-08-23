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
      { src: "/logo.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/logo-sm.png", type: "image/png", sizes: "512x512" },
      { src: "/logo-md.png", type: "image/png", sizes: "1024x1024" },
      { src: "/logo-lg.png", type: "image/png", sizes: "2048x2048" },
    ],
  };
}
