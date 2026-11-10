import { useBrandsMaybe } from '../brands/BrandProvider';
import { cityById } from '../brands/cities';
/** NickMark's WhatsApp: his Colombian number for clients in Colombia, his US number for everyone else. */
const NUMBERS = { co: '573157854980', world: '16692633378' };
const BOGOTA = 'America/Bogota';
/** Colombia when the brand's city is in Colombia; with no city, when the visitor's own clock is on Bogotá time. */
export function inColombia(brand) {
    const city = brand?.city;
    if (city && typeof city === 'object' && /^(colombia|co)$/i.test(city.country.trim()))
        return true;
    const tz = cityById(city)?.tz;
    if (tz)
        return tz === BOGOTA;
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone === BOGOTA;
    }
    catch {
        return false;
    }
}
/** His number for this brand, digits only (same rule as WhatsApp). */
export const nicoPhone = (brand) => (inColombia(brand) ? NUMBERS.co : NUMBERS.world);
export const NICO_EMAIL = 'nicolas@braindy.co';
export const nicoWhatsApp = (brand, text) => `https://wa.me/${inColombia(brand) ? NUMBERS.co : NUMBERS.world}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
/** The link for the brand the person is looking at (or their own clock outside a brand). */
export function useNicoWhatsApp() {
    const brand = useBrandsMaybe()?.current ?? null;
    return (text) => nicoWhatsApp(brand, text);
}
