import type { RestaurantOffer } from '@/types/restaurant';

export { publicWebsite as restaurantWebsite } from '@/utils/providerDetails';

export { publicPhone as restaurantPhone } from '@/utils/publicContact';

export function restaurantOfferBadge(offer: RestaurantOffer): string {
  const percent = offer.discountPercent;
  if (typeof percent === 'number' && Number.isFinite(percent) && percent >= 0 && percent <= 100)
    return `${percent}% OFF`;
  return offer.type === 'sale' ? 'SALE' : offer.type === 'discount' ? 'DISCOUNT' : 'PERK';
}

export function restaurantMenuIcon(label: string) {
  if (/tea|coffee|espresso|drink|juice|beverage/i.test(label)) return 'cafe-outline' as const;
  if (/cake|pastry|dessert|sweet|bakery|bread/i.test(label)) return 'nutrition-outline' as const;
  if (/fish|trout|seafood/i.test(label)) return 'fish-outline' as const;
  if (/fruit|vegan|vegetarian|salad/i.test(label)) return 'leaf-outline' as const;
  return 'restaurant-outline' as const;
}
