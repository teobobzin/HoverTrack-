import React from 'react';

interface HeaderProps {
  onNavigate: (view: 'terminal' | 'gallery') => void;
  currentView: 'terminal' | 'gallery';
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  return (
    <header className="bg-white border-b-2 border-[#0a1f44] py-4 px-6 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('terminal')}>
          <div className="bg-white border-2 border-[#0a1f44] p-2 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shadow-sm">
            <i className="fas fa-helicopter text-xl"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter !text-[#0a1f44]">MyHeliLogs</h1>
            <p className="text-[9px] font-black !text-blue-600 uppercase tracking-[0.2em]">Pilot Digital Terminal</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-10">
          <button 
            onClick={() => onNavigate('terminal')}
            className={`text-sm font-black !text-[#0a1f44] transition-all relative ${currentView === 'terminal' ? 'after:content-[""] after:absolute after:-bottom-5 after:left-0 after:right-0 after:h-1 after:bg-[#0a1f44] after:rounded-full' : 'opacity-40 hover:opacity-100'}`}
          >
            TERMINAL
          </button>
          <button 
            onClick={() => onNavigate('gallery')}
            className={`text-sm font-black !text-[#0a1f44] transition-all relative ${currentView === 'gallery' ? 'after:content-[""] after:absolute after:-bottom-5 after:left-0 after:right-0 after:h-1 after:bg-[#0a1f44] after:rounded-full' : 'opacity-40 hover:opacity-100'}`}
          >
            ARCHIVES
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;