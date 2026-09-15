import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://sametkabakci.com",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://sametkabakci.com/profile/",
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
