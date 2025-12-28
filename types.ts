
export enum PlanMode {
  DAYS = 'DAYS',
  END_DATE = 'END_DATE',
  PACE = 'PACE'
}

export interface DaySchedule {
  dayNumber: number;
  date: string;
  startPage: number;
  endPage: number;
  pagesToRead: number;
  isCompleted: boolean;
}

export interface UserSettings {
  startDate: string;
  planMode: PlanMode;
  targetDays: number;
  targetEndDate: string;
  pagesAlreadyRead: number;
  dailyGoal: number;
}

export interface PlannerState {
  settings: UserSettings;
  progress: Record<number, boolean>; // dayNumber -> completed status
}
