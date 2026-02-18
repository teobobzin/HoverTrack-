import React from 'react';
import { SavedLog } from '../types';

interface LogGalleryProps {
  logs: SavedLog[];
  onSelect: (log: SavedLog) => void;
  onDelete: (id: string) => void;
}

const LogGallery: React.FC<LogGalleryProps> = ({ logs, onSelect, onDelete }) => {
  if (logs.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-[#064e3b] rounded-3xl bg-slate-50">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">No Saved Logs Found</h3>
        <p className="text-slate-600 font-bold">Your processed pages will appear here once saved.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {logs.map((log) => (
        <div 
          key={log.id} 
          className="bg-white border-2 border-[#064e3b] rounded-[32px] overflow-hidden shadow-sm flex flex-col p-8"
        >
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-2">
              <span className="bg-[#064e3b] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest w-fit">
                {log.year} LOG
              </span>
              <h4 className="text-3xl font-bold text-slate-900 leading-tight">{log.name}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {new Date(log.timestamp).toLocaleDateString()} AT {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(log.id); }}
              className="text-slate-900 hover:text-red-600 p-2"
            >
              <i className="fas fa-trash-alt text-lg"></i>
            </button>
          </div>
          
          <div className="flex items-center gap-12 mb-8 border-t border-slate-100 pt-8">
            <div className="flex flex-col">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">ENTRIES</p>
              <p className="text-4xl font-bold text-slate-900">{log.entries.length}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">TOTAL TIME</p>
              <p className="text-4xl font-bold text-slate-900">
                {log.entries.reduce((acc, curr) => acc + (curr.totalTime || 0), 0).toFixed(1)}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => onSelect(log)}
            className="w-full bg-[#064e3b] text-white py-4 rounded-2xl font-bold hover:bg-emerald-900 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <i className="fas fa-edit"></i> <span>Edit Log</span>
          </button>
        </div>
      ))}
    </div>
  );
};

export default LogGallery;