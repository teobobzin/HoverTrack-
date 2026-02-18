import React from 'react';

interface HeaderProps {
  onNavigate: (view: 'terminal' | 'gallery') => void;
  currentView: 'terminal' | 'gallery';
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  return (
    <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('terminal')}>
          <div className="bg-white border-2 border-[#064e3b] p-2 rounded-xl flex items-center justify-center text-blue-600 transition-transform shadow-sm">
            <i className="fas fa-helicopter text-xl"></i>
          </div>
        </div>
        
        <nav className="flex items-center gap-6">
          <button 
            onClick={() => onNavigate('terminal')}
            className={`text-sm font-bold text-slate-900 transition-all relative ${currentView === 'terminal' ? 'after:content-[""] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900' : 'opacity-60 hover:opacity-100'}`}
          >
            Terminal
          </button>
          <button 
            onClick={() => onNavigate('gallery')}
            className={`text-sm font-bold text-slate-900 transition-all relative ${currentView === 'gallery' ? 'after:content-[""] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900' : 'opacity-60 hover:opacity-100'}`}
          >
            My Logs
          </button>
          
          <div className="flex items-center gap-2 ml-2">
            <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-700">
              <i className="fas fa-share-alt text-xs"></i>
            </button>
            <button className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
              <i className="fas fa-flask text-xs"></i>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;