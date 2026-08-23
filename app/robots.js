import { SITE } from "@/config/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
