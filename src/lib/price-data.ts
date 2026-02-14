import priceGuide from '@/data/price-guide.json';

type PriceItem = { local: string; tourist: string; unit: string };
type PriceGuide = { categories: Record<string, Record<string, PriceItem>> };

export function getPriceData(): PriceGuide {
  return priceGuide as PriceGuide;
}
