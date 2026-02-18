import React from 'react';
import { LogbookEntry } from '../types';

interface StatsProps {
  entries: LogbookEntry[];
}

const Stats: React.FC<StatsProps> = ({ entries }) => {
  const totalHours = entries.reduce((acc, curr) => acc + (curr.totalTime || 0), 0);
  const picHours = entries.reduce((acc, curr) => acc + (curr.pic || 0), 0);
  const nightHours = entries.reduce((acc, curr) => acc + (curr.night || 0), 0);
  const totalLandings = entries.reduce((acc, curr) => acc + (curr.ldgDay || 0) + (curr.ldgNight || 0), 0);

  const StatBox = ({ icon, label, val }: { icon: string, label: string, val: string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md border-2 border-[#0a1f44] flex items-center gap-5 group hover:border-blue-500 transition-all hover:translate-y-[-2px]">
      <div className="bg-slate-50 border-2 border-[#0a1f44] p-4 rounded-xl text-blue-600 flex items-center justify-center group-hover:bg-[#0a1f44] group-hover:text-white transition-all shadow-sm">
        <i className={`${icon} text-xl`}></i>
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-[#0a1f44] tracking-tighter">{val}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <StatBox icon="fas fa-stopwatch" label="TOTAL DURATION" val={totalHours.toFixed(1)} />
      <StatBox icon="fas fa-user-pilot" label="COMMAND (PIC)" val={picHours.toFixed(1)} />
      <StatBox icon="fas fa-moon-stars" label="NIGHT FLIGHT" val={nightHours.toFixed(1)} />
      <StatBox icon="fas fa-circle-dot" label="TOTAL LANDINGS" val={totalLandings.toString()} />
    </div>
  );
};

export default Stats;