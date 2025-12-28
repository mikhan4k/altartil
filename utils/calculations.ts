
import { DaySchedule, UserSettings, PlanMode } from '../types';
import { TOTAL_PAGES } from '../constants';

export const calculateSchedule = (settings: UserSettings, completedDays: Record<number, boolean>): DaySchedule[] => {
  const startDate = new Date(settings.startDate);
  const alreadyRead = Math.min(settings.pagesAlreadyRead, TOTAL_PAGES);
  const remainingPages = TOTAL_PAGES - alreadyRead;

  if (remainingPages <= 0) {
    return [];
  }

  let duration = settings.targetDays;
  let pagesPerDay: number[] = [];

  if (settings.planMode === PlanMode.END_DATE) {
    const endDate = new Date(settings.targetEndDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    const base = Math.floor(remainingPages / duration);
    const extra = remainingPages % duration;
    for (let i = 1; i <= duration; i++) {
      pagesPerDay.push(i <= extra ? base + 1 : base);
    }
  } else if (settings.planMode === PlanMode.DAYS) {
    const base = Math.floor(remainingPages / duration);
    const extra = remainingPages % duration;
    for (let i = 1; i <= duration; i++) {
      pagesPerDay.push(i <= extra ? base + 1 : base);
    }
  } else if (settings.planMode === PlanMode.PACE) {
    const goal = settings.dailyGoal || 1;
    duration = Math.ceil(remainingPages / goal);
    for (let i = 1; i <= duration; i++) {
      if (i === duration) {
        // Last day might have fewer pages
        const consumed = (duration - 1) * goal;
        pagesPerDay.push(remainingPages - consumed);
      } else {
        pagesPerDay.push(goal);
      }
    }
  }

  const schedule: DaySchedule[] = [];
  let currentPage = alreadyRead + 1;

  for (let i = 1; i <= pagesPerDay.length; i++) {
    const pagesForToday = pagesPerDay[i - 1];
    if (pagesForToday <= 0 && currentPage > TOTAL_PAGES) break;

    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (i - 1));

    const endPage = Math.min(currentPage + pagesForToday - 1, TOTAL_PAGES);

    if (currentPage <= TOTAL_PAGES) {
      schedule.push({
        dayNumber: i,
        date: dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        startPage: currentPage,
        endPage: endPage,
        pagesToRead: Math.max(0, endPage - currentPage + 1),
        isCompleted: !!completedDays[i],
      });
      currentPage = endPage + 1;
    } else {
      break;
    }
  }

  return schedule;
};
