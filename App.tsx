
import React, { useState, useEffect, useMemo } from 'react';
import { PlanMode, UserSettings, PlannerState, DaySchedule } from './types';
import { STORAGE_KEY, DEFAULT_SETTINGS, TOTAL_PAGES } from './constants';
import { calculateSchedule } from './utils/calculations';

const Header: React.FC = () => (
  <header className="text-center py-6 md:py-8 px-4 bg-slate-900 border-b border-amber-900/50 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none select-none overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
        </pattern>
        <rect width="100" height="100" fill="url(#grid)" />
      </svg>
    </div>
    <h1 className="text-3xl md:text-4xl font-amiri font-bold text-amber-500 mb-1 drop-shadow-lg">Al-Tartil</h1>
    <p className="text-amber-200/70 italic text-xs md:text-sm max-w-lg mx-auto uppercase tracking-widest font-light">
      "And recite the Quran with measured recitation." (73:4)
    </p>
  </header>
);

const App: React.FC = () => {
  const [state, setState] = useState<PlannerState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.settings) {
          if (typeof parsed.settings.pagesAlreadyRead === 'undefined') parsed.settings.pagesAlreadyRead = 0;
          if (typeof parsed.settings.dailyGoal === 'undefined') parsed.settings.dailyGoal = DEFAULT_SETTINGS.dailyGoal;
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      settings: DEFAULT_SETTINGS,
      progress: {},
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const schedule = useMemo(() => {
    return calculateSchedule(state.settings, state.progress);
  }, [state.settings, state.progress]);

  const totalPagesRead = useMemo(() => {
    const pagesInSchedule = schedule.reduce((acc, day) => {
      return acc + (day.isCompleted ? day.pagesToRead : 0);
    }, 0);
    return Math.min(TOTAL_PAGES, state.settings.pagesAlreadyRead + pagesInSchedule);
  }, [schedule, state.settings.pagesAlreadyRead]);

  const percentage = Math.min(100, Math.round((totalPagesRead / TOTAL_PAGES) * 100) || 0);

  const projections = useMemo(() => {
    const remaining = TOTAL_PAGES - totalPagesRead;
    
    // Planned completion is the end of the current generated schedule
    const plannedFinishDate = schedule.length > 0 
      ? schedule[schedule.length - 1].date 
      : 'N/A';

    // "Expected" is specifically calculated from the current dailyGoal, 
    // regardless of whether the schedule is currently driven by it.
    const daysToFinishExpected = state.settings.dailyGoal > 0 
      ? Math.ceil(remaining / state.settings.dailyGoal) 
      : 0;
    
    const expectedFinishDateObj = new Date();
    expectedFinishDateObj.setDate(expectedFinishDateObj.getDate() + daysToFinishExpected);
    
    const expectedFinishDate = remaining > 0 
      ? expectedFinishDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      : 'Completed';

    return {
      remainingPages: remaining,
      plannedFinishDate,
      expectedFinishDate,
      daysToFinishExpected
    };
  }, [totalPagesRead, schedule, state.settings.dailyGoal]);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }));
  };

  const toggleDay = (dayNumber: number) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [dayNumber]: !prev.progress[dayNumber],
      },
    }));
  };

  const resetProgress = () => {
    if (confirm("Are you sure you want to reset all progress? This will reset checked days, but not your settings.")) {
      setState(prev => ({ ...prev, progress: {} }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center pb-20">
      <Header />

      <main className="w-full max-w-4xl px-4 py-8 space-y-8">
        
        {/* Settings Card */}
        <section className="bg-slate-900 border border-amber-900/30 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-amber-500 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center text-sm">1</span>
            Plan Your Journey
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs text-amber-200/50 uppercase tracking-tighter font-semibold">Pages Already Read</label>
              <input 
                type="number"
                min="0"
                max={TOTAL_PAGES}
                value={state.settings.pagesAlreadyRead === 0 ? '' : state.settings.pagesAlreadyRead}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  handleSettingChange('pagesAlreadyRead', Math.min(TOTAL_PAGES, Math.max(0, val || 0)));
                }}
                className="w-full bg-slate-800 border border-amber-900/40 rounded-lg p-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all"
                placeholder="Enter pages read (e.g. 100)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-amber-200/50 uppercase tracking-tighter font-semibold">Start Date</label>
              <input 
                type="date"
                value={state.settings.startDate}
                onChange={(e) => handleSettingChange('startDate', e.target.value)}
                className="w-full bg-slate-800 border border-amber-900/40 rounded-lg p-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs text-amber-200/50 uppercase tracking-tighter font-semibold">Completion Mode</label>
              <div className="flex flex-wrap gap-2 mt-1">
                <button 
                  onClick={() => handleSettingChange('planMode', PlanMode.DAYS)}
                  className={`flex-1 min-w-[100px] p-3 rounded-lg text-sm font-semibold transition-all ${state.settings.planMode === PlanMode.DAYS ? 'bg-amber-600 text-slate-950 shadow-lg' : 'bg-slate-800 text-amber-500 hover:bg-slate-700'}`}
                >
                  By Days
                </button>
                <button 
                  onClick={() => handleSettingChange('planMode', PlanMode.END_DATE)}
                  className={`flex-1 min-w-[100px] p-3 rounded-lg text-sm font-semibold transition-all ${state.settings.planMode === PlanMode.END_DATE ? 'bg-amber-600 text-slate-950 shadow-lg' : 'bg-slate-800 text-amber-500 hover:bg-slate-700'}`}
                >
                  By Target Date
                </button>
                <button 
                  onClick={() => handleSettingChange('planMode', PlanMode.PACE)}
                  className={`flex-1 min-w-[100px] p-3 rounded-lg text-sm font-semibold transition-all ${state.settings.planMode === PlanMode.PACE ? 'bg-amber-600 text-slate-950 shadow-lg' : 'bg-slate-800 text-amber-500 hover:bg-slate-700'}`}
                >
                  By Daily Pace
                </button>
              </div>
            </div>

            <div className={`space-y-2 transition-opacity ${state.settings.planMode === PlanMode.PACE ? 'opacity-100' : 'opacity-80'}`}>
              <label className="text-xs text-amber-200/50 uppercase tracking-tighter font-semibold">
                Daily Goal (Pages Per Day)
              </label>
              <input 
                type="number"
                min="1"
                max={TOTAL_PAGES}
                value={state.settings.dailyGoal === 0 ? '' : state.settings.dailyGoal}
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                  handleSettingChange('dailyGoal', Math.min(TOTAL_PAGES, Math.max(0, val || 0)));
                }}
                className={`w-full bg-slate-800 border rounded-lg p-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all ${state.settings.planMode === PlanMode.PACE ? 'border-amber-500/50' : 'border-amber-900/40'}`}
                placeholder="Target pages per day"
              />
            </div>

            {state.settings.planMode === PlanMode.DAYS && (
              <div className="space-y-2">
                <label className="text-xs text-amber-200/50 uppercase tracking-tighter font-semibold">Planned Duration (Days)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="1"
                    max="1000"
                    value={state.settings.targetDays === 0 ? '' : state.settings.targetDays}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 1 : parseInt(e.target.value);
                      handleSettingChange('targetDays', Math.max(1, val || 1));
                    }}
                    className="flex-1 bg-slate-800 border border-amber-900/40 rounded-lg p-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <div className="flex gap-1">
                    {[30, 60, 90].map(d => (
                      <button 
                        key={d}
                        onClick={() => handleSettingChange('targetDays', d)}
                        className="px-3 py-3 bg-slate-800 border border-amber-900/20 rounded-lg text-xs text-amber-500 hover:bg-amber-900/20"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {state.settings.planMode === PlanMode.END_DATE && (
              <div className="space-y-2">
                <label className="text-xs text-amber-200/50 uppercase tracking-tighter font-semibold">Planned Finish Date</label>
                <input 
                  type="date"
                  value={state.settings.targetEndDate}
                  onChange={(e) => handleSettingChange('targetEndDate', e.target.value)}
                  className="w-full bg-slate-800 border border-amber-900/40 rounded-lg p-3 text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all"
                />
              </div>
            )}

            {state.settings.planMode === PlanMode.PACE && (
              <div className="space-y-2 flex flex-col justify-end">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-amber-900/20">
                  <p className="text-[10px] text-amber-200/40 uppercase font-bold">Automatic Schedule</p>
                  <p className="text-xs text-amber-500 mt-1">Generating a reading plan day-by-day until all 604 pages are covered at your pace.</p>
                </div>
              </div>
            )}

            <div className="flex items-end md:col-span-2">
              <button 
                onClick={resetProgress}
                className="w-full p-3 border border-red-900/30 text-red-500 hover:bg-red-950 rounded-lg text-sm font-medium transition-all"
              >
                Reset Progress Checklist
              </button>
            </div>
          </div>
        </section>

        {/* Projections Card */}
        <section className="bg-slate-900 border border-amber-500/20 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-amber-600/10 p-4 border-b border-amber-500/20">
             <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Insights & Projections
             </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center md:text-left">
              <p className="text-xs text-amber-200/40 uppercase mb-1">Target Completion</p>
              <p className="text-xl font-bold text-amber-200">{projections.plannedFinishDate}</p>
              <p className="text-[10px] text-amber-500/60 mt-1 italic">Based on current schedule settings</p>
            </div>
            
            <div className="text-center md:text-left border-y md:border-y-0 md:border-x border-amber-900/30 py-4 md:py-0 md:px-8">
              <p className="text-xs text-amber-200/40 uppercase mb-1">Expected Completion</p>
              <p className="text-xl font-bold text-amber-500">{projections.expectedFinishDate}</p>
              <p className="text-[10px] text-amber-500/60 mt-1 italic">At pace of {state.settings.dailyGoal} pages/day</p>
            </div>

            <div className="text-center md:text-left">
              <p className="text-xs text-amber-200/40 uppercase mb-1">Pace Difference</p>
              <p className="text-xl font-bold text-amber-200">
                {state.settings.dailyGoal > 0 ? `${projections.daysToFinishExpected} Days` : 'N/A'}
              </p>
              <p className="text-[10px] text-amber-500/60 mt-1 italic">Remaining pages: {projections.remainingPages}</p>
            </div>
          </div>
        </section>

        {/* Progress Section */}
        <section className="bg-slate-900 border border-amber-900/30 rounded-2xl p-6 shadow-2xl relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center text-sm font-sans">2</span>
              Overall Progress
            </h2>
            <div className="text-right">
              <span className="text-3xl font-bold text-amber-400">{percentage}%</span>
              <p className="text-xs text-amber-200/50 uppercase tracking-widest">{totalPagesRead} / {TOTAL_PAGES} Pages Completed</p>
            </div>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-amber-900/20">
            <div 
              className="h-full bg-gradient-to-r from-amber-900 to-amber-500 transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </section>

        {/* Schedule Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-amber-900/30 flex items-center justify-center text-sm font-sans">3</span>
                Generated Reading Schedule
            </h2>
            <div className="flex flex-col items-end">
                <span className="text-[10px] text-amber-200/40 uppercase tracking-widest font-bold">Current Pace</span>
                <span className="text-xs text-amber-500">
                    {state.settings.planMode === PlanMode.PACE ? `${state.settings.dailyGoal} pages/day` : 'Calculated automatically'}
                </span>
            </div>
          </div>
          
          {schedule.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.map((day) => (
                <div 
                    key={day.dayNumber}
                    onClick={() => toggleDay(day.dayNumber)}
                    className={`cursor-pointer group p-4 rounded-xl border transition-all duration-300 transform active:scale-95 ${
                    day.isCompleted 
                        ? 'bg-amber-600/10 border-amber-500/50' 
                        : 'bg-slate-900 border-amber-900/20 hover:border-amber-700 hover:bg-slate-800/50 shadow-sm'
                    }`}
                >
                    <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${day.isCompleted ? 'bg-amber-500 text-slate-950' : 'bg-amber-900/30 text-amber-400'}`}>
                        Day {day.dayNumber}
                    </span>
                    <span className="text-[10px] text-amber-200/40 uppercase font-medium">{day.date}</span>
                    </div>
                    
                    <div className="flex flex-col">
                    <span className="text-lg font-bold text-amber-100 mb-1">
                        Pages {day.startPage} – {day.endPage}
                    </span>
                    <span className="text-[11px] text-amber-200/60 uppercase tracking-wider">
                        Reading {day.pagesToRead} page{day.pagesToRead > 1 ? 's' : ''}
                    </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        day.isCompleted ? 'bg-amber-500 border-amber-500' : 'border-amber-900/50 group-hover:border-amber-600'
                    }`}>
                        {day.isCompleted && (
                        <svg className="w-3 h-3 text-slate-950 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                        )}
                    </div>
                    <span className={`text-xs uppercase font-bold tracking-tighter ${day.isCompleted ? 'text-amber-400' : 'text-amber-200/20'}`}>
                        {day.isCompleted ? 'Recited' : 'Mark Recited'}
                    </span>
                    </div>
                </div>
                ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-amber-900/30 rounded-2xl p-12 text-center shadow-inner">
                <p className="text-amber-400 font-amiri text-3xl mb-4">Mubarak!</p>
                <p className="text-amber-200/60 text-lg">Your journey through all 604 pages is complete.</p>
                <button 
                   onClick={() => handleSettingChange('pagesAlreadyRead', 0)}
                   className="mt-6 px-6 py-2 bg-amber-600 text-slate-950 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-amber-500 transition-colors"
                >
                    Start New Khatm
                </button>
            </div>
          )}
        </section>
      </main>

      <footer className="w-full text-center py-10 px-4 border-t border-amber-900/20 text-amber-200/30">
        <p className="text-xs uppercase tracking-widest font-light">Al-Tartil Quran Journey Planner</p>
        <p className="mt-2 text-[10px] opacity-50">&copy; {new Date().getFullYear()} — Built for spiritual excellence</p>
      </footer>
    </div>
  );
};

export default App;
