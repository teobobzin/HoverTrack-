
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-[#064e3b] flex items-center gap-4">
        <div className="bg-white border-2 border-[#064e3b] p-3 rounded-lg text-blue-600 flex items-center justify-center">
          <i className="fas fa-hourglass-half text-xl"></i>
        </div>
        <div>
          <p className="text-black text-[10px] font-black uppercase tracking-widest">Total Duration</p>
          <p className="text-2xl font-black text-black">{totalHours.toFixed(1)}</p>
        </div>
      </div>
      
      <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-[#064e3b] flex items-center gap-4">
        <div className="bg-white border-2 border-[#064e3b] p-3 rounded-lg text-blue-600 flex items-center justify-center">
          <i className="fas fa-user-shield text-xl"></i>
        </div>
        <div>
          <p className="text-black text-[10px] font-black uppercase tracking-widest">PIC Hours</p>
          <p className="text-2xl font-black text-black">{picHours.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-[#064e3b] flex items-center gap-4">
        <div className="bg-white border-2 border-[#064e3b] p-3 rounded-lg text-blue-600 flex items-center justify-center">
          <i className="fas fa-moon text-xl"></i>
        </div>
        <div>
          <p className="text-black text-[10px] font-black uppercase tracking-widest">Night Time</p>
          <p className="text-2xl font-black text-black">{nightHours.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border-2 border-[#064e3b] flex items-center gap-4">
        <div className="bg-white border-2 border-[#064e3b] p-3 rounded-lg text-blue-600 flex items-center justify-center">
          <i className="fas fa-plane-arrival text-xl"></i>
        </div>
        <div>
          <p className="text-black text-[10px] font-black uppercase tracking-widest">Total Landings</p>
          <p className="text-2xl font-black text-black">{totalLandings}</p>
        </div>
      </div>
    </div>
  );
};

export default Stats;
