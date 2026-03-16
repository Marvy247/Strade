// search utilities
export type SearchFilters = { query?: string; minPrice?: number; maxPrice?: number; status?: string; category?: string };
export function filterListings(listings: any[], filters: SearchFilters) { return listings; }
// filter by query text
// filter by min price
// filter by max price
// filter by status
// filter by category
export function sortListings(listings: any[], by: string) { return listings; }
// sort price asc
