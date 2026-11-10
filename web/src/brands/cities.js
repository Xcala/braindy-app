export const CITIES = [
    { id: 'bogota', es: 'Bogotá', en: 'Bogotá', tz: 'America/Bogota' },
    { id: 'medellin', es: 'Medellín', en: 'Medellín', tz: 'America/Bogota' },
    { id: 'cali', es: 'Cali', en: 'Cali', tz: 'America/Bogota' },
    { id: 'barranquilla', es: 'Barranquilla', en: 'Barranquilla', tz: 'America/Bogota' },
    { id: 'mexico', es: 'Ciudad de México', en: 'Mexico City', tz: 'America/Mexico_City' },
    { id: 'lima', es: 'Lima', en: 'Lima', tz: 'America/Lima' },
    { id: 'quito', es: 'Quito', en: 'Quito', tz: 'America/Guayaquil' },
    { id: 'panama', es: 'Panamá', en: 'Panama City', tz: 'America/Panama' },
    { id: 'santiago', es: 'Santiago', en: 'Santiago', tz: 'America/Santiago' },
    { id: 'montevideo', es: 'Montevideo', en: 'Montevideo', tz: 'America/Montevideo' },
    { id: 'buenosaires', es: 'Buenos Aires', en: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires' },
    { id: 'saopaulo', es: 'São Paulo', en: 'São Paulo', tz: 'America/Sao_Paulo' },
    { id: 'miami', es: 'Miami', en: 'Miami', tz: 'America/New_York' },
    { id: 'newyork', es: 'Nueva York', en: 'New York', tz: 'America/New_York' },
    { id: 'boston', es: 'Boston', en: 'Boston', tz: 'America/New_York' },
    { id: 'chicago', es: 'Chicago', en: 'Chicago', tz: 'America/Chicago' },
    { id: 'dallas', es: 'Dallas', en: 'Dallas', tz: 'America/Chicago' },
    { id: 'houston', es: 'Houston', en: 'Houston', tz: 'America/Chicago' },
    { id: 'denver', es: 'Denver', en: 'Denver', tz: 'America/Denver' },
    { id: 'losangeles', es: 'Los Ángeles', en: 'Los Angeles', tz: 'America/Los_Angeles' },
    { id: 'sanfrancisco', es: 'San Francisco', en: 'San Francisco', tz: 'America/Los_Angeles' },
    { id: 'toronto', es: 'Toronto', en: 'Toronto', tz: 'America/Toronto' },
    { id: 'madrid', es: 'Madrid', en: 'Madrid', tz: 'Europe/Madrid' },
    { id: 'barcelona', es: 'Barcelona', en: 'Barcelona', tz: 'Europe/Madrid' },
    { id: 'london', es: 'Londres', en: 'London', tz: 'Europe/London' },
    { id: 'paris', es: 'París', en: 'Paris', tz: 'Europe/Paris' },
];
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]+/g, '');
/** The brand's city: an id from the old list, or a searched place. */
export const cityById = (v) => !v ? undefined : typeof v === 'string' ? CITIES.find((c) => c.id === v) : { id: slug(v.name), es: v.name, en: v.name, tz: v.tz };
/** Short city tags, airport style (BOG, NYC, SF), shown on launches. Searched places use their first three letters. */
const CODES = {
    bogota: 'BOG', medellin: 'MDE', cali: 'CLO', barranquilla: 'BAQ', mexico: 'CDMX', lima: 'LIM', quito: 'UIO', panama: 'PTY',
    santiago: 'SCL', montevideo: 'MVD', buenosaires: 'BUE', saopaulo: 'SAO', miami: 'MIA', newyork: 'NYC', boston: 'BOS',
    chicago: 'CHI', dallas: 'DAL', houston: 'HOU', denver: 'DEN', losangeles: 'LA', sanfrancisco: 'SF', toronto: 'TOR',
    madrid: 'MAD', barcelona: 'BCN', london: 'LON', paris: 'PAR',
};
export const cityCode = (v) => {
    const c = cityById(v);
    return c ? CODES[c.id] ?? c.id.slice(0, 3).toUpperCase() : null;
};
