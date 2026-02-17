
import React, { useState } from 'react';

interface HeaderProps {
  onNavigate: (view: 'terminal' | 'gallery') => void;
  currentView: 'terminal' | 'gallery';
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView }) => {
  const [showCopied, setShowCopied] = useState(false);

  const handleShare = async () => {
    // Uses full location to ensure scanners get the exact public link
    const shareUrl = window.location.href;
    const shareData = {
      title: 'HoverTrack - Pilot Electronic Logbook',
      text: 'Check out HoverTrack, a high-performance electronic logbook for pilots that uses AI to convert handwritten logs to digital records.',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        console.error('Error copying link:', err);
      }
    }
  };

  const verifyPwa = () => {
    const siteUrl = encodeURIComponent(window.location.origin);
    window.open(`https://www.pwabuilder.com/reportcard?site=${siteUrl}`, '_blank');
  };

  return (
    <header className="bg-white border-b-2 border-[#064e3b] py-4 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('terminal')}>
          <div className="bg-white border-2 border-[#064e3b] p-2 rounded-lg flex items-center justify-center text-blue-600">
            <i className="fas fa-helicopter text-xl"></i>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold tracking-tight !text-black">HoverTrack</h1>
            <p className="text-xs font-bold !text-black uppercase tracking-tighter">Heli-Ops Digital Terminal</p>
          </div>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-8">
          <button 
            onClick={() => onNavigate('terminal')}
            className={`text-sm font-black !text-black transition-colors border-b-2 ${currentView === 'terminal' ? 'border-[#064e3b]' : 'border-transparent hover:border-[#064e3b]/30'}`}
          >
            Terminal
          </button>
          <button 
            onClick={() => onNavigate('gallery')}
            className={`text-sm font-black !text-black transition-colors border-b-2 ${currentView === 'gallery' ? 'border-[#064e3b]' : 'border-transparent hover:border-[#064e3b]/30'}`}
          >
            My Logs
          </button>
          
          <div className="relative flex items-center gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 bg-white border-2 border-[#064e3b] text-black px-3 py-1.5 rounded-lg text-xs font-black hover:bg-slate-50 transition-all shadow-sm group"
            >
              <i className="fas fa-share-nodes text-[#064e3b] group-hover:scale-110 transition-transform"></i>
              <span className="hidden md:inline">Share App</span>
            </button>

            <button 
              onClick={verifyPwa}
              title="Verify PWA Status with PWABuilder"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-[#064e3b]/20 text-[#064e3b] hover:bg-[#064e3b] hover:text-white transition-all opacity-40 hover:opacity-100"
            >
              <i className="fas fa-vial-circle-check"></i>
            </button>
            
            {showCopied && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#064e3b] text-white text-[10px] font-black py-1 px-3 rounded shadow-lg animate-bounce whitespace-nowrap">
                LINK COPIED!
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
