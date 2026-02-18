
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import Header from './components/Header';
import Uploader from './components/Uploader';
import LogbookTable from './components/LogbookTable';
import LogGallery from './components/LogGallery';
import Stats from './components/Stats';
import CameraModal from './components/CameraModal';
import { extractLogbookData, recognizeLogbookFormat } from './services/geminiService';
import { LogbookEntry, AppStatus, ColumnDefinition, SavedLog } from './types';

const MAX_HISTORY = 20;
const AUTO_SAVE_DELAY = 3000; // 3 seconds

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { key: 'date', label: 'Date', visible: true, isCustom: false, type: 'text' },
  { key: 'aircraftType', label: 'Make & Model', visible: true, isCustom: false, type: 'text' },
  { key: 'registration', label: 'Ident #', visible: true, isCustom: false, type: 'text' },
  { key: 'route', label: 'Departure/Arrival', visible: true, isCustom: false, type: 'text' },
  { key: 'rotorcraft', label: 'Rotorcraft', visible: true, isCustom: false, type: 'number' },
  { key: 'solo', label: 'Solo', visible: true, isCustom: false, type: 'number' },
  { key: 'dualReceived', label: 'Dual', visible: true, isCustom: false, type: 'number' },
  { key: 'pic', label: 'PIC', visible: true, isCustom: false, type: 'number' },
  { key: 'sic', label: 'SIC', visible: true, isCustom: false, type: 'number' },
  { key: 'cfi', label: 'Instructor', visible: true, isCustom: false, type: 'number' },
  { key: 'groundTrainer', label: 'Ground', visible: true, isCustom: false, type: 'number' },
  { key: 'day', label: 'Day', visible: true, isCustom: false, type: 'number' },
  { key: 'night', label: 'Night', visible: true, isCustom: false, type: 'number' },
  { key: 'crossCountry', label: 'X-Country', visible: true, isCustom: false, type: 'number' },
  { key: 'actualInstrument', label: 'Actual Inst', visible: true, isCustom: false, type: 'number' },
  { key: 'simulatedInstrument', label: 'Sim Inst', visible: true, isCustom: false, type: 'number' },
  { key: 'instrApp', label: 'NO.\nINSTR.\nAPPR.', visible: true, isCustom: false, type: 'number' },
  { key: 'ldgSub', label: 'No LDG (D/N)', visible: true, isCustom: false, type: 'number' },
  { key: 'totalTime', label: 'Total Dur.', visible: true, isCustom: false, type: 'number' },
  { key: 'remarks', label: 'Remarks', visible: true, isCustom: false, type: 'text' },
  { key: 'signature', label: 'Signature/Cert', visible: true, isCustom: false, type: 'text' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'terminal' | 'gallery'>('terminal');
  const [history, setHistory] = useState<{
    past: LogbookEntry[][];
    present: LogbookEntry[];
    future: LogbookEntry[][];
  }>({
    past: [],
    present: [],
    future: [],
  });

  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [logbookYear, setLogbookYear] = useState<string>(new Date().getFullYear().toString());
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'extract' | 'format'>('extract');
  const [isExporting, setIsExporting] = useState(false);
  const [amountForward, setAmountForward] = useState<Record<string, number>>({});
  const [savedLogs, setSavedLogs] = useState<SavedLog[]>([]);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const entries = history.present;

  // Persistence logic - Initial Load
  useEffect(() => {
    const saved = localStorage.getItem('skylog_saved_logs');
    if (saved) {
      try {
        setSavedLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved logs", e);
      }
    }
  }, []);

  const saveToLogs = useCallback((currentEntries: LogbookEntry[], currentCols: ColumnDefinition[], year: string, existingId?: string | null) => {
    if (currentEntries.length === 0) return;

    setIsSaving(true);
    
    setSavedLogs(prev => {
      const existingLog = existingId ? prev.find(l => l.id === existingId) : null;
      const timestamp = Date.now();
      const logId = existingId || `log-${timestamp}`;
      const name = existingLog ? existingLog.name : `Log Page ${new Date(timestamp).toLocaleDateString()}`;

      const newLog: SavedLog = {
        id: logId,
        name,
        timestamp,
        entries: currentEntries,
        columns: currentCols,
        year
      };

      const filtered = prev.filter(l => l.id !== logId);
      const updated = [newLog, ...filtered];
      localStorage.setItem('skylog_saved_logs', JSON.stringify(updated));
      return updated;
    });

    if (!existingId) {
      const newId = `log-${Date.now()}`;
      setActiveLogId(newId);
    }
    
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 800);
  }, []);

  // AUTO-SAVE EFFECT
  useEffect(() => {
    if (!activeLogId || entries.length === 0) return;

    const timer = setTimeout(() => {
      saveToLogs(entries, columns, logbookYear, activeLogId);
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [entries, columns, logbookYear, activeLogId, saveToLogs]);

  const updateEntriesWithHistory = useCallback((newEntries: LogbookEntry[]) => {
    setHistory(curr => {
      const newPast = [curr.present, ...curr.past].slice(0, MAX_HISTORY);
      return { past: newPast, present: newEntries, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(curr => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[0];
      const newPast = curr.past.slice(1);
      return { past: newPast, present: previous, future: [curr.present, ...curr.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(curr => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      return { past: [curr.present, ...curr.past], present: next, future: newFuture };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleImageCaptured = useCallback(async (base64: string, sigBase64?: string) => {
    setIsCameraOpen(false);
    setStatus(AppStatus.PROCESSING);
    setError(null);
    
    try {
      if (cameraMode === 'format') {
        const suggestedCols = await recognizeLogbookFormat(base64);
        const newCols: ColumnDefinition[] = suggestedCols.map((sc, i) => ({
          key: `ai_${sc.label?.toLowerCase().replace(/\s+/g, '_') || i}`,
          label: sc.label || `Col ${i+1}`,
          visible: true,
          isCustom: true,
          type: (sc.type as any) || 'text'
        }));
        setColumns(newCols);
        setStatus(AppStatus.IDLE);
      } else {
        const extractedEntries = await extractLogbookData(base64, columns.filter(c => c.visible), logbookYear);
        
        const batchId = `batch-${Date.now()}`;
        const processedEntries = extractedEntries.map(e => ({
          ...e,
          batchId,
          signature: e.signature || (sigBase64 ? "Digitally Signed" : e.signature),
          remarks: sigBase64 ? `${e.remarks || ''} [Certified: Digital Signature Attached]`.trim() : e.remarks
        })) as LogbookEntry[];

        const newPresent = [...entries, ...processedEntries];
        updateEntriesWithHistory(newPresent);
        saveToLogs(newPresent, columns, logbookYear, activeLogId);
        setStatus(AppStatus.REVIEW);
      }
    } catch (err: any) {
      console.error(err);
      setError("AI operation failed. Please try a clearer photo.");
      setStatus(AppStatus.ERROR);
    }
  }, [entries, updateEntriesWithHistory, cameraMode, columns, logbookYear, saveToLogs, activeLogId]);

  const addBlankEntry = () => {
    const newEntry: LogbookEntry = {
      id: `manual-${Date.now()}`,
      batchId: 'manual',
      date: `${logbookYear}-01-01`,
      aircraftType: '',
      registration: '',
      routeFrom: '',
      routeTo: '',
      rotorcraft: 0,
      solo: 0,
      dualReceived: 0,
      pic: 0,
      sic: 0,
      cfi: 0,
      groundTrainer: 0,
      day: 0,
      night: 0,
      crossCountry: 0,
      actualInstrument: 0,
      simulatedInstrument: 0,
      instrApp: 0,
      ldgDay: 0,
      ldgNight: 0,
      totalTime: 0,
      remarks: '',
      signature: '',
    };
    const newEntries = [newEntry, ...entries];
    updateEntriesWithHistory(newEntries);
    setStatus(AppStatus.REVIEW);
    saveToLogs(newEntries, columns, logbookYear, activeLogId);
  };

  const updateEntry = (id: string, updates: Partial<LogbookEntry>) => {
    const newEntries = entries.map(entry => entry.id === id ? { ...entry, ...updates } : entry);
    updateEntriesWithHistory(newEntries);
  };

  const deleteEntry = (id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    updateEntriesWithHistory(newEntries);
  };

  const toggleColumnVisibility = (key: string) => {
    setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const addCustomColumn = (label: string, type: 'text' | 'number') => {
    const key = label.toLowerCase().replace(/\s+/g, '_');
    if (columns.find(c => c.key === key)) {
      alert("A column with this name already exists.");
      return;
    }
    setColumns(prev => [...prev, { key, label, visible: true, isCustom: true, type }]);
    const newEntries = entries.map(e => ({ ...e, [key]: type === 'number' ? 0 : '' }));
    updateEntriesWithHistory(newEntries);
  };

  const removeCustomColumn = (key: string) => {
    if (confirm("Remove this column and its data?")) {
      setColumns(prev => prev.filter(c => c.key !== key));
      const newEntries = entries.map(e => {
        const { [key]: _, ...rest } = e;
        return rest;
      });
      updateEntriesWithHistory(newEntries);
    }
  };

  const clearLogbook = () => {
    if (confirm("Clear all active entries?")) {
      updateEntriesWithHistory([]);
      setActiveLogId(null);
      setLastSaved(null);
      setStatus(AppStatus.IDLE);
    }
  };

  const handleExportImage = async () => {
    if (!tableRef.current || entries.length === 0) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `MyHeliLogs_Export_${logbookYear}_${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectSavedLog = (log: SavedLog) => {
    setHistory({ past: [], present: log.entries, future: [] });
    setColumns(log.columns);
    setLogbookYear(log.year);
    setActiveLogId(log.id);
    setView('terminal');
    setStatus(AppStatus.REVIEW);
    setLastSaved(new Date(log.timestamp));
  };

  const handleDeleteSavedLog = (id: string) => {
    if (confirm("Are you sure you want to delete this log permanently?")) {
      setSavedLogs(prev => {
        const updated = prev.filter(l => l.id !== id);
        localStorage.setItem('skylog_saved_logs', JSON.stringify(updated));
        return updated;
      });
      if (activeLogId === id) {
        setActiveLogId(null);
        setLastSaved(null);
        updateEntriesWithHistory([]);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header onNavigate={setView} currentView={view} />
      
      <main className="flex-grow max-w-7xl mx-auto px-6 py-10 w-full">
        {view === 'terminal' ? (
          <>
            <section className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-black text-black tracking-tight">
                      {activeLogId ? 'Log Editor' : 'Digital Terminal'}
                    </h2>
                    
                    {activeLogId && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                        {isSaving ? (
                          <>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-blue-600 uppercase">Saving...</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">
                              {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Local Sync Active'}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 bg-white border-2 border-[#064e3b] px-4 py-2 rounded-xl shadow-sm w-fit">
                    <span className="text-[10px] font-black text-black uppercase tracking-widest">Logbook Year</span>
                    <input 
                      type="number" 
                      value={logbookYear} 
                      onChange={(e) => setLogbookYear(e.target.value)}
                      className="w-20 font-black text-black outline-none bg-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {(history.past.length > 0 || history.future.length > 0) && (
                    <div className="flex bg-white border-2 border-[#064e3b] rounded-xl overflow-hidden shadow-sm mr-2">
                      <button onClick={undo} disabled={history.past.length === 0} className={`p-2 px-3 border-r-2 border-[#064e3b] transition-colors ${history.past.length === 0 ? 'opacity-20' : 'hover:bg-slate-100'}`}><i className="fas fa-rotate-left text-black"></i></button>
                      <button onClick={redo} disabled={history.future.length === 0} className={`p-2 px-3 transition-colors ${history.future.length === 0 ? 'opacity-20' : 'hover:bg-slate-100'}`}><i className="fas fa-rotate-right text-black"></i></button>
                    </div>
                  )}

                  <button 
                    onClick={addBlankEntry}
                    className="bg-white border-2 border-[#064e3b] text-black px-4 py-2 rounded-xl text-sm font-black hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <i className="fas fa-plus text-black"></i> Add Entry
                  </button>

                  {entries.length > 0 && (
                    <>
                      <button onClick={clearLogbook} className="bg-white border-2 border-[#064e3b] text-black px-4 py-2 rounded-xl text-sm font-black hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                        <i className="fas fa-trash-alt text-black"></i> Clear
                      </button>
                      <button onClick={handleExportImage} disabled={isExporting} className="bg-[#064e3b] text-force-white px-4 py-2 rounded-xl text-sm font-black hover:bg-[#065f46] transition-all shadow-sm flex items-center gap-2">
                        {isExporting ? <i className="fas fa-spinner animate-spin text-white"></i> : <i className="fas fa-file-image text-white"></i>} <span>Export PNG</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {entries.length > 0 && <Stats entries={entries} />}
              
              <Uploader 
                onImageSelected={(base64, mode) => { setCameraMode(mode); handleImageCaptured(base64); }}
                onOpenCamera={(mode) => { setCameraMode(mode); setIsCameraOpen(true); }}
                isLoading={status === AppStatus.PROCESSING} 
              />
            </section>

            {entries.length > 0 && (
              <section className="mb-20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-black flex items-center gap-2">
                    <i className="fas fa-helicopter text-black"></i> Rotorcraft Log Records
                  </h3>
                </div>
                
                <div ref={tableRef} className="bg-white rounded-xl">
                  <LogbookTable 
                    entries={entries} 
                    onUpdateEntry={updateEntry} 
                    onDeleteEntry={deleteEntry}
                    columns={columns}
                    onToggleColumn={toggleColumnVisibility}
                    onAddColumn={addCustomColumn}
                    onRemoveColumn={removeCustomColumn}
                    amountForward={amountForward}
                    onUpdateAmountForward={(key, val) => setAmountForward(prev => ({ ...prev, [key]: val }))}
                  />
                </div>
              </section>
            )}
          </>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-black tracking-tight">My Logs</h2>
              <button 
                onClick={() => setView('terminal')}
                className="bg-[#064e3b] text-force-white px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2"
              >
                <i className="fas fa-plus text-white"></i> New Log Page
              </button>
            </div>
            <LogGallery logs={savedLogs} onSelect={handleSelectSavedLog} onDelete={handleDeleteSavedLog} />
          </section>
        )}
      </main>

      {isCameraOpen && <CameraModal onCapture={handleImageCaptured} onClose={() => setIsCameraOpen(false)} />}
      
      <footer className="bg-[#064e3b] py-10 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            {/* Header logo copy */}
            <div className="bg-white border-2 border-[#064e3b] p-2 rounded-lg flex items-center justify-center text-blue-600">
              <i className="fas fa-helicopter text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white leading-none">MyHeliLogs</span>
              <span className="text-[10px] font-black uppercase text-white/60 tracking-tighter mt-1">Helicopter Operations Terminal</span>
            </div>
          </div>
          <div className="flex flex-col md:items-end gap-2">
             <span className="text-xs font-black uppercase text-white/80">Professional Edition</span>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">© 2025 MyHeliLogs Systems</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
