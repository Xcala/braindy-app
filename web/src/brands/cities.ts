/** Cities a client can be in, each with its time zone. The client's home studio shows their city on the second wall clock. */
export interface City { id: string; es: string; en: string; tz: string }

export const CITIES: City[] = [
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

export const cityById = (id?: string | null) => CITIES.find((c) => c.id === id);
