import { EXTERNAL_APIS, REDIS_TTL } from "@/lib/constants";
import type { UnsplashImage } from "@/lib/types";

// Re-export type for convenience
export type { UnsplashImage };

interface UnsplashSearchResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

// Simple in-memory cache for image results
const imageCache = new Map<
  string,
  { data: UnsplashImage[]; timestamp: number }
>();
const CACHE_TTL = REDIS_TTL.IMAGE_CACHE * 1000; // Convert to ms
const MAX_CACHE_ENTRIES = 100;

function pruneCache() {
  if (imageCache.size <= MAX_CACHE_ENTRIES) return;
  const entries = Array.from(imageCache.entries()).sort(
    (a, b) => a[1].timestamp - b[1].timestamp
  );
  const overflow = imageCache.size - MAX_CACHE_ENTRIES;
  for (let i = 0; i < overflow; i++) {
    const key = entries[i]?.[0];
    if (key) {
      imageCache.delete(key);
    }
  }
}

/**
 * Search Unsplash for mango images
 */
export async function getImages(
  query: string,
  count: number = 3
): Promise<UnsplashImage[]> {
  const cacheKey = `${query}-${count}`;
  const cached = imageCache.get(cacheKey);

  // Return cached results if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      console.warn("Unsplash API key not configured");
      return getFallbackImages(count);
    }

    const params = new URLSearchParams({
      query,
      per_page: count.toString(),
      orientation: "landscape",
    });

    const response = await fetch(
      `${EXTERNAL_APIS.UNSPLASH_BASE_URL}/search/photos?${params}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
        next: { revalidate: REDIS_TTL.IMAGE_CACHE },
      }
    );

    if (!response.ok) {
      console.error("Unsplash API error:", response.status);
      return getFallbackImages(count);
    }

    const data: UnsplashSearchResponse = await response.json();
    const images = data.results;

    // Cache results
    imageCache.set(cacheKey, { data: images, timestamp: Date.now() });
    pruneCache();

    return images;
  } catch (error) {
    console.error("Error fetching Unsplash images:", error);
    return getFallbackImages(count);
  }
}

/**
 * Fallback placeholder images when Unsplash is unavailable
 */
function getFallbackImages(count: number): UnsplashImage[] {
  const fallbackImages: UnsplashImage[] = [];

  for (let i = 0; i < count; i++) {
    fallbackImages.push({
      id: `fallback-${i}`,
      urls: {
        raw: `https://via.placeholder.com/1200x800/7C3AED/ffffff?text=Brazilian+Mango`,
        full: `https://via.placeholder.com/1200x800/7C3AED/ffffff?text=Brazilian+Mango`,
        regular: `https://via.placeholder.com/800x600/7C3AED/ffffff?text=Brazilian+Mango`,
        small: `https://via.placeholder.com/400x300/7C3AED/ffffff?text=Brazilian+Mango`,
        thumb: `https://via.placeholder.com/200x150/7C3AED/ffffff?text=Mango`,
      },
      alt_description: "Brazilian mango",
      user: {
        name: "Placeholder",
        links: {
          html: "#",
        },
      },
    });
  }

  return fallbackImages;
}
