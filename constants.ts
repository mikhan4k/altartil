
export const TOTAL_PAGES = 604;
export const STORAGE_KEY = 'al_tartil_planner_v1';

export const DEFAULT_SETTINGS = {
  startDate: new Date().toISOString().split('T')[0],
  planMode: 'DAYS' as any,
  targetDays: 30,
  targetEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  pagesAlreadyRead: 0,
  dailyGoal: 20, // Default to ~1 Juz/day pace
};
