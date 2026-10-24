export type L2 = { es: string; en: string };
export type LessonSeed = {
  id: string; area: string; order: number; minutes: number; categories: string[]; stages: string[];
  title: L2; summary: L2; body: L2; script?: L2;
};
export type ObjectionSeed = { id: string; area: string; order: number; phrase: L2; answer: L2; triggers: string[]; lessonId?: string };
