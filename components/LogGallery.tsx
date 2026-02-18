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
      <div className="py-20 text-center border-2 border-dashed border-[#0a1f44] rounded-3xl bg-slate-50">
        <div className="w-24 h-24 bg-white border-2 border-[#0a1f44] rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-lg">
          <i className="fas fa-folder-open text-4xl"></i>
        </div>
        <h3 className="text-2xl font-black text-black mb-2">No Saved Logs Found</h3>
        <p className="text-black font-bold opacity-60">Your processed pages will appear here once saved.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {logs.map((log) => (
        <div 
          key={log.id} 
          className="group bg-white border-2 border-[#0a1f44] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
        >
          <div className="p-5 border-b-2 border-[#0a1f44] bg-slate-50">
            <div className="flex justify-between items-start mb-2">
              <span className="bg-[#0a1f44] text-force-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                {log.year} Log
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(log.id); }}
                className="text-black hover:text-red-600 transition-colors p-1"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
            <h4 className="text-lg font-black text-black leading-tight mb-1 truncate">{log.name}</h4>
            <p className="text-[10px] font-black text-black/50 uppercase">
              {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="p-5 flex-grow flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <p className="text-[9px] font-black text-black/40 uppercase tracking-tighter">Entries</p>
                <p className="text-xl font-black text-black">{log.entries.length}</p>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-black/40 uppercase tracking-tighter">Total Time</p>
                <p className="text-xl font-black text-black">
                  {log.entries.reduce((acc, curr) => acc + (curr.totalTime || 0), 0).toFixed(1)}
                </p>
              </div>
            </div>
            <button 
              onClick={() => onSelect(log)}
              className="w-full bg-[#0a1f44] text-force-white py-3 rounded-xl font-black hover:bg-[#1e3a8a] transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-edit text-white"></i> <span>Edit Log</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LogGallery;