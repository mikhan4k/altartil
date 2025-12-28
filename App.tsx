import React, { useState, useEffect, useMemo } from 'react';
import { PlanMode, UserSettings, PlannerState, DaySchedule, Theme } from './types';
import { STORAGE_KEY, DEFAULT_SETTINGS, TOTAL_PAGES } from './constants';
import { calculateSchedule } from './utils/calculations';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => (
  <header className={`text-center py-6 md:py-8 px-4 border-b relative overflow-hidden transition-colors duration-300 ${
    theme === 'dark' ? 'bg-slate-900 border-amber-900/50' : 'bg-amber-50 border-amber-200'
  }`}>
    <div className={`absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none select-none overflow-hidden ${
      theme === 'dark' ? 'text-white' : 'text-amber-900'
    }`}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
        </pattern>
        <rect width="100" height="100" fill="url(#grid)" />
      </svg>
    </div>
    
    <button 
      onClick={toggleTheme}
      className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 shadow-sm z-10 ${
        theme === 'dark' ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-white text-amber-600 hover:bg-amber-100 border border-amber-200'
      }`}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
      )}
    </button>

    <h1 className={`text-3xl md:text-4xl font-amiri font-bold mb-1 drop-shadow-lg transition-colors duration-300 ${
      theme === 'dark' ? 'text-amber-500' : 'text-amber-800'
    }`}>Al-Tartil</h1>
    <p className={`italic text-xs md:text-sm max-w-lg mx-auto uppercase tracking-widest font-light transition-colors duration-300 ${
      theme === 'dark' ? 'text-amber-200/70' : 'text-amber-900/60'
    }`}>
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
        return {
          settings: parsed.settings || DEFAULT_SETTINGS,
          progress: parsed.progress || {},
          theme: parsed.theme || 'dark'
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      settings: DEFAULT_SETTINGS,
      progress: {},
      theme: 'dark'
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
    return Math.min(TOTAL_PAGES, (state.settings.pagesAlreadyRead || 0) + pagesInSchedule);
  }, [schedule, state.settings.pagesAlreadyRead]);

  const percentage = Math.min(100, Math.round((totalPagesRead / TOTAL_PAGES) * 100) || 0);

  const projections = useMemo(() => {
    const remaining = TOTAL_PAGES - totalPagesRead;
    const plannedFinishDate = schedule.length > 0 
      ? schedule[schedule.length - 1].date 
      : 'N/A';

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

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

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
    if (confirm("Are you sure you want to reset all progress?")) {
      setState(prev => ({ ...prev, progress: {} }));
    }
  };

  const t = state.theme;

  // Theme-aware styles
  const styles = {
    bg: t === 'dark' ? 'bg-slate-950' : 'bg-stone-50',
    card: t === 'dark' ? 'bg-slate-900 border-amber-900/30' : 'bg-white border-amber-100 shadow-sm',
    label: t === 'dark' ? 'text-amber-200/50' : 'text-slate-500',
    input: t === 'dark' ? 'bg-slate-800 border-amber-900/40 text-amber-400 focus:ring-amber-600' : 'bg-stone-50 border-amber-200 text-slate-800 focus:ring-amber-500',
    accentText: t === 'dark' ? 'text-amber-500' : 'text-amber-700',
    primaryText: t === 'dark' ? 'text-amber-200' : 'text-slate-800',
    secondaryText: t === 'dark' ? 'text-amber-200/40' : 'text-slate-400',
    buttonInert: t === 'dark' ? 'bg-slate-800 text-amber-500 hover:bg-slate-700' : 'bg-stone-100 text-slate-600 hover:bg-stone-200',
    buttonActive: 'bg-amber-600 text-slate-950 shadow-lg',
  };

  return (
    <div className={`min-h-screen flex flex-col items-center pb-20 transition-colors duration-300 ${styles.bg}`}>
      <Header theme={t} toggleTheme={toggleTheme} />

      <main className="w-full max-w-4xl px-4 py-8 space-y-8">
        
        {/* Settings Card */}
        <section className={`border rounded-2xl p-6 shadow-2xl transition-all duration-300 ${styles.card}`}>
          <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${styles.accentText}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${t === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'}`}>1</span>
            Plan Your Journey
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={`text-xs uppercase tracking-tighter font-semibold ${styles.label}`}>Pages Already Read</label>
              <input 
                type="number"
                min="0"
                max={TOTAL_PAGES}
                value={state.settings.pagesAlreadyRead === 0 ? '' : state.settings.pagesAlreadyRead}
                onChange={(e) => handleSettingChange('pagesAlreadyRead', Math.min(TOTAL_PAGES, Math.max(0, parseInt(e.target.value) || 0)))}
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 transition-all ${styles.input}`}
                placeholder="Enter pages read"
              />
            </div>

            <div className="space-y-2">
              <label className={`text-xs uppercase tracking-tighter font-semibold ${styles.label}`}>Start Date</label>
              <input 
                type="date"
                value={state.settings.startDate}
                onChange={(e) => handleSettingChange('startDate', e.target.value)}
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 transition-all ${styles.input}`}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className={`text-xs uppercase tracking-tighter font-semibold ${styles.label}`}>Completion Mode</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(Object.values(PlanMode) as PlanMode[]).map((mode) => (
                  <button 
                    key={mode}
                    onClick={() => handleSettingChange('planMode', mode)}
                    className={`flex-1 min-w-[100px] p-3 rounded-lg text-sm font-semibold transition-all ${
                      state.settings.planMode === mode ? styles.buttonActive : styles.buttonInert
                    }`}
                  >
                    {mode === PlanMode.DAYS ? 'By Days' : mode === PlanMode.END_DATE ? 'By Target Date' : 'By Daily Pace'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-xs uppercase tracking-tighter font-semibold ${styles.label}`}>Daily Goal (Pages)</label>
              <input 
                type="number"
                min="1"
                max={TOTAL_PAGES}
                value={state.settings.dailyGoal === 0 ? '' : state.settings.dailyGoal}
                onChange={(e) => handleSettingChange('dailyGoal', Math.min(TOTAL_PAGES, Math.max(0, parseInt(e.target.value) || 0)))}
                className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 transition-all ${styles.input}`}
                placeholder="Target per day"
              />
            </div>

            {state.settings.planMode === PlanMode.DAYS && (
              <div className="space-y-2">
                <label className={`text-xs uppercase tracking-tighter font-semibold ${styles.label}`}>Planned Duration (Days)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="1"
                    value={state.settings.targetDays}
                    onChange={(e) => handleSettingChange('targetDays', Math.max(1, parseInt(e.target.value) || 1))}
                    className={`flex-1 border rounded-lg p-3 focus:outline-none focus:ring-2 ${styles.input}`}
                  />
                </div>
              </div>
            )}

            {state.settings.planMode === PlanMode.END_DATE && (
              <div className="space-y-2">
                <label className={`text-xs uppercase tracking-tighter font-semibold ${styles.label}`}>Target Finish Date</label>
                <input 
                  type="date"
                  value={state.settings.targetEndDate}
                  onChange={(e) => handleSettingChange('targetEndDate', e.target.value)}
                  className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 transition-all ${styles.input}`}
                />
              </div>
            )}

            <div className="flex items-end md:col-span-2">
              <button 
                onClick={resetProgress}
                className="w-full p-3 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-all"
              >
                Reset Progress Checklist
              </button>
            </div>
          </div>
        </section>

        {/* Projections Card */}
        <section className={`border rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${styles.card}`}>
          <div className={`p-4 border-b ${t === 'dark' ? 'bg-amber-600/10 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
             <h2 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${styles.accentText}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Insights & Projections
             </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center md:text-left">
              <p className={`text-xs uppercase mb-1 ${styles.secondaryText}`}>Target Finish</p>
              <p className={`text-xl font-bold ${styles.primaryText}`}>{projections.plannedFinishDate}</p>
            </div>
            <div className={`text-center md:text-left border-y md:border-y-0 md:border-x py-4 md:py-0 md:px-8 ${t === 'dark' ? 'border-amber-900/30' : 'border-amber-100'}`}>
              <p className={`text-xs uppercase mb-1 ${styles.secondaryText}`}>Expected Finish</p>
              <p className={`text-xl font-bold ${styles.accentText}`}>{projections.expectedFinishDate}</p>
            </div>
            <div className="text-center md:text-left">
              <p className={`text-xs uppercase mb-1 ${styles.secondaryText}`}>Days Remaining</p>
              <p className={`text-xl font-bold ${styles.primaryText}`}>{projections.daysToFinishExpected} Days</p>
            </div>
          </div>
        </section>

        {/* Progress Section */}
        <section className={`border rounded-2xl p-6 shadow-2xl relative transition-all duration-300 ${styles.card}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${styles.accentText}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-sans ${t === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'}`}>2</span>
              Overall Progress
            </h2>
            <div className="text-right">
              <span className={`text-3xl font-bold ${t === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>{percentage}%</span>
              <p className={`text-xs uppercase tracking-widest ${styles.secondaryText}`}>{totalPagesRead} / {TOTAL_PAGES} Pages</p>
            </div>
          </div>
          <div className={`h-4 rounded-full overflow-hidden border ${t === 'dark' ? 'bg-slate-800 border-amber-900/20' : 'bg-stone-100 border-amber-100'}`}>
            <div 
              className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </section>

        {/* Schedule Grid */}
        <section className="space-y-4">
          <h2 className={`text-xl font-bold flex items-center gap-2 ${styles.accentText}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-sans ${t === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'}`}>3</span>
              Reading Schedule
          </h2>
          
          {schedule.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.map((day) => (
                <div 
                    key={day.dayNumber}
                    onClick={() => toggleDay(day.dayNumber)}
                    className={`cursor-pointer group p-4 rounded-xl border transition-all duration-300 transform active:scale-95 ${
                    day.isCompleted 
                        ? (t === 'dark' ? 'bg-amber-600/10 border-amber-500/50' : 'bg-amber-50 border-amber-500/40')
                        : (t === 'dark' ? 'bg-slate-900 border-amber-900/20 hover:border-amber-700' : 'bg-white border-amber-100 hover:border-amber-400 shadow-sm')
                    }`}
                >
                    <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${day.isCompleted ? 'bg-amber-500 text-slate-950' : (t === 'dark' ? 'bg-amber-900/30 text-amber-400' : 'bg-stone-100 text-amber-700')}`}>
                        Day {day.dayNumber}
                    </span>
                    <span className={`text-[10px] uppercase font-medium ${styles.secondaryText}`}>{day.date}</span>
                    </div>
                    
                    <div className="flex flex-col">
                    <span className={`text-lg font-bold mb-1 ${day.isCompleted && t === 'light' ? 'text-amber-800' : styles.primaryText}`}>
                        Pages {day.startPage} – {day.endPage}
                    </span>
                    <span className={`text-[11px] uppercase tracking-wider ${styles.secondaryText}`}>
                        {day.pagesToRead} page{day.pagesToRead > 1 ? 's' : ''}
                    </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        day.isCompleted ? 'bg-amber-500 border-amber-500' : (t === 'dark' ? 'border-amber-900/50 group-hover:border-amber-600' : 'border-amber-200 group-hover:border-amber-500')
                    }`}>
                        {day.isCompleted && <svg className="w-3 h-3 text-slate-950 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-xs uppercase font-bold tracking-tighter ${day.isCompleted ? (t === 'dark' ? 'text-amber-400' : 'text-amber-700') : (t === 'dark' ? 'text-amber-200/10' : 'text-slate-300')}`}>
                        {day.isCompleted ? 'Recited' : 'Mark Recited'}
                    </span>
                    </div>
                </div>
                ))}
            </div>
          ) : (
            <div className={`border rounded-2xl p-12 text-center shadow-inner transition-all duration-300 ${styles.card}`}>
                <p className={`font-amiri text-3xl mb-4 ${styles.accentText}`}>Mubarak!</p>
                <p className={`text-lg ${styles.secondaryText}`}>Your journey through all 604 pages is complete.</p>
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

      <footer className={`w-full text-center py-10 px-4 border-t transition-colors duration-300 ${t === 'dark' ? 'border-amber-900/20 text-amber-200/30' : 'border-amber-100 text-slate-400'}`}>
        <p className="text-xs uppercase tracking-widest font-light">Al-Tartil Quran Journey Planner</p>
        <p className="mt-2 text-[10px] opacity-50">&copy; {new Date().getFullYear()} — Built for spiritual excellence</p>
      </footer>
    </div>
  );
};

export default App;