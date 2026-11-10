/** Lowercase, accent-free text for search ("Namén" matches "namen"). */
export const normalizeSearch = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
