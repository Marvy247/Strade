// search utilities
export type SearchFilters = { query?: string; minPrice?: number; maxPrice?: number; status?: string; category?: string };
export function filterListings(listings: any[], filters: SearchFilters) { return listings; }
// filter by query text
