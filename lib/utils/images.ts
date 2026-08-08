/**
 * Real Unsplash photography, sourced and content-verified for this project
 * (search term -> chosen photo noted per entry). No stock-photo placeholders.
 */
export const LANDING_IMAGES = {
  hero: {
    id: "photo-1778659292555-3e58271fa080",
    alt: "Golden hour light on street construction with workers",
  },
  solutionCreateProfile: {
    id: "photo-1626885930974-4b69aa21bbf9",
    alt: "Two construction workers in safety vests at site",
  },
  solutionCheckIn: {
    id: "photo-1673201159772-a3b7fa2ecc5d",
    alt: "A man wearing a hard hat working on a piece of metal",
  },
  solutionCredentials: {
    id: "photo-1764114908655-9a26d32750a0",
    alt: "Workers operating heavy machinery in a factory",
  },
  solutionVerified: {
    id: "photo-1760963301666-582b92218a19",
    alt: "Three people in hard hats and vests talking",
  },
  valueSplit: {
    id: "photo-1780220176316-99cfba738b07",
    alt: "Two men wearing reflective vests and hard hats outside",
  },
  liveDemoSample: {
    id: "photo-1504328345606-18bbc8c9d7d1",
    alt: "Worker performing arc welding without protective gloves",
  },
} as const;

export function unsplashUrl(id: string, width: number, height?: number, quality = 80): string {
  const params = new URLSearchParams({
    w: String(width),
    fit: "crop",
    q: String(quality),
  });
  if (height) params.set("h", String(height));
  return `https://images.unsplash.com/${id}?${params.toString()}`;
}
