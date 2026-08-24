import { SITE } from "@/config/site";
import { CHALLENGE_CATEGORIES } from "@/data/challenge-categories";

export default function sitemap() {
  const now = new Date();
  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "hourly" },
    { path: "/challenges-won", priority: 0.9, changeFrequency: "daily" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/rules", priority: 0.6, changeFrequency: "monthly" },
    { path: "/stats", priority: 0.9, changeFrequency: "daily" },
    { path: "/create", priority: 0.7, changeFrequency: "monthly" },
    { path: "/fitness-challenges", priority: 0.9, changeFrequency: "weekly" },
  ].map((route) => ({
    url: `${SITE.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const categoryRoutes = CHALLENGE_CATEGORIES.map((category) => ({
    url: `${SITE.url}/fitness-challenges/${category.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
