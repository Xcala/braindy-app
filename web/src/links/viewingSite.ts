/** The site open in the viewer right now (or null), so the chat assistant knows which site «change this» is about. */
let viewing: string | null = null;
export const setViewingSite = (url: string | null) => { viewing = url; };
export const viewingSite = () => viewing;
