
import React from 'react';

interface HeaderProps {
  onNavigate: (view: 'terminal' | 'gallery') => void;
  currentView: 'terminal' | 'gallery';
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  return (
    <header className="bg-white border-b-2 border-[#064e3b] py-4 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('terminal')}>
          <div className="bg-white border-2 border-[#064e3b] p-2 rounded-lg flex items-center justify-center text-blue-600">
            <i className="fas fa-helicopter text-xl"></i>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight !text-black">MyHeliLogs</h1>
            <p className="text-[10px] font-black !text-[#064e3b] uppercase tracking-widest">Pilot Digital Terminal</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-8">
          <button 
            onClick={() => onNavigate('terminal')}
            className={`text-sm font-black !text-black transition-all border-b-2 ${currentView === 'terminal' ? 'border-[#064e3b] pb-1' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            Terminal
          </button>
          <button 
            onClick={() => onNavigate('gallery')}
            className={`text-sm font-black !text-black transition-all border-b-2 ${currentView === 'gallery' ? 'border-[#064e3b] pb-1' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            Logbook
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
