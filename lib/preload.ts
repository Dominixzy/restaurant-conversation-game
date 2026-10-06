import restaurantsData from "@/data/restaurants.json";
import ingredientsData from "@/data/ingredients.json";
import assemblyData from "@/data/assembly.json";
import recipesData from "@/data/recipes.json";

// Loads images ahead of time so a level never waits on a picture mid-game: the play screen shows a
// loading bar for its level, and the title and select screens quietly fetch the next levels.
// Each image is fetched and decoded once; the browser then serves CSS backgrounds and <img>s from cache.

const loading = new Map<string, Promise<void>>();
const loaded = new Set<string>();
const kept: HTMLImageElement[] = []; // holding them keeps the decoded pictures from being dropped

export function preloadImage(url: string, priority: "high" | "low" = "high") {
  let job = loading.get(url);
  if (!job) {
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = priority;
    img.src = url;
    kept.push(img);
    // A missing picture must not hold up the game, so failures count as done.
    job = img.decode().catch(() => {}).then(() => void loaded.add(url));
    loading.set(url, job);
  }
  return job;
}

export const allLoaded = (urls: string[]) => urls.every((u) => loaded.has(u));

// Loads a list a few at a time (slow connections do better with fewer parallel downloads).
export async function preloadAll(urls: string[], { onProgress, priority = "high", parallel = 6 }: { onProgress?: (share: number) => void; priority?: "high" | "low"; parallel?: number } = {}) {
  const queue = [...urls];
  let done = 0;
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      await preloadImage(url, priority);
      onProgress?.(++done / urls.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(parallel, urls.length) }, worker));
}

const URL_RE = /\/assets\/[A-Za-z0-9_./-]+\.(?:webp|png|jpe?g|svg)/g;
const urlsIn = (value: unknown) => JSON.stringify(value).match(URL_RE) ?? [];

// Pictures every level uses that are named in code rather than data: the characters (sushi/4) and
// their reaction bubbles (sushi/7) in page.tsx, the knife and bamboo mat (sushi/2) and the spoon and
// rolling pin in StepAnimation.tsx.
const EVERY_LEVEL = [
  "/assets/food/sushi/4.webp",
  "/assets/food/sushi/7.webp",
  "/assets/food/sushi/2.webp",
  "/assets/food/thai/icons/spoon.webp",
  "/assets/food/italian/icons/rolling-pin.webp",
];

// Everything a level shows: its scenes, its kitchen's ingredients, tools, plate layers and finished dishes.
const perLevel = new Map<string, string[]>();
export function levelAssets(restaurantId: string) {
  let list = perLevel.get(restaurantId);
  if (!list) perLevel.set(restaurantId, (list = collectLevelAssets(restaurantId)));
  return list;
}

function collectLevelAssets(restaurantId: string) {
  const restaurant = restaurantsData.find((r) => r.id === restaurantId) as { kitchen?: string } | undefined;
  if (!restaurant) return [];
  const kitchen = restaurant.kitchen ?? "sushi";
  const folder = `/assets/food/${kitchen}/`;
  const bins = ingredientsData.filter((i) => !("kitchen" in i) || !i.kitchen || i.kitchen === kitchen);
  const dishes = [...urlsIn(assemblyData), ...urlsIn(recipesData)].filter((u) => u.startsWith(folder));
  return [...new Set([...urlsIn(restaurant), ...urlsIn(bins), ...dishes, ...EVERY_LEVEL])];
}

// Fetches levels in the background at low priority, one level at a time, once the page is idle.
export function prefetchLevels(ids: string[], extra: string[] = []) {
  const start = () => {
    void (async () => {
      if (extra.length) await preloadAll(extra, { priority: "low", parallel: 2 });
      for (const id of ids) await preloadAll(levelAssets(id), { priority: "low", parallel: 2 });
    })();
  };
  const idle = (window as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(start, { timeout: 2000 });
  else setTimeout(start, 800);
}
