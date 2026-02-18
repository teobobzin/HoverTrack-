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
const AUTO_SAVE_DELAY = 3000;

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
  { key: 'instrApp', label: 'No.\nInstr.\nAppr.', visible: true, isCustom: false, type: 'number' },
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
  const [logbookYear, setLogbookYear] = useState<string>("2026");
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

  useEffect(() => {
    const saved = localStorage.getItem('hovertrack_saved_logs');
    if (saved) {
      try {
        setSavedLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved logs", e);
      }
    }
  }, []);

  const saveToLogs = useCallback((currentEntries: LogbookEntry[], currentCols: ColumnDefinition[], year: string, existingId?: string | null) => {
    if (currentEntries.length === 0 && !existingId) return;

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
      localStorage.setItem('hovertrack_saved_logs', JSON.stringify(updated));
      return updated;
    });

    if (!existingId) {
      setActiveLogId(`log-${Date.now()}`);
    }
    
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 800);
  }, []);

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
          signature: e.signature || (sigBase64 ? "Digitally Certified" : e.signature),
          remarks: sigBase64 ? `${e.remarks || ''} [Digital Signature Applied]`.trim() : e.remarks
        })) as LogbookEntry[];

        const newPresent = [...entries, ...processedEntries];
        updateEntriesWithHistory(newPresent);
        saveToLogs(newPresent, columns, logbookYear, activeLogId);
        setStatus(AppStatus.REVIEW);
      }
    } catch (err: any) {
      console.error(err);
      setError("AI analysis failed. Please ensure the logbook is well-lit and flat.");
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
    if (!activeLogId) {
      saveToLogs(newEntries, columns, logbookYear);
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const visibleCols = columns.filter(c => c.visible);
    const headers = visibleCols.map(c => c.label).join(',');
    const rows = entries.map(entry => {
      return visibleCols.map(col => {
        let val = entry[col.key] || '';
        if (col.key === 'route') val = `${entry.routeFrom || ''}-${entry.routeTo || ''}`;
        if (col.key === 'ldgSub') val = `D:${entry.ldgDay || 0} N:${entry.ldgNight || 0}`;
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HoverTrack_Export_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportImage = async () => {
    if (!tableRef.current || entries.length === 0) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `HoverTrack_Report_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      setError("Image export failed. Try CSV export instead.");
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
    if (confirm("Delete this log permanently?")) {
      setSavedLogs(prev => {
        const updated = prev.filter(l => l.id !== id);
        localStorage.setItem('hovertrack_saved_logs', JSON.stringify(updated));
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
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={setView} currentView={view} />
      
      <main className="flex-grow max-w-5xl mx-auto px-4 py-8 w-full animate-fade-in">
        {view === 'terminal' ? (
          <>
            <section className="mb-10">
              <div className="flex flex-col gap-6 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                    Digital Terminal
                  </h2>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                      <i className="fas fa-share-alt text-slate-700"></i>
                    </button>
                    <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                      <i className="fas fa-flask text-emerald-600"></i>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-3 bg-white border-2 border-[#064e3b] px-6 py-3 rounded-xl shadow-sm w-fit">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">LOGBOOK YEAR</span>
                    <input 
                      type="number" 
                      value={logbookYear} 
                      onChange={(e) => setLogbookYear(e.target.value)}
                      className="w-16 font-bold text-slate-900 outline-none bg-transparent text-lg"
                    />
                  </div>
                  
                  <button 
                    onClick={addBlankEntry}
                    className="bg-white border-2 border-[#064e3b] text-slate-900 px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <i className="fas fa-plus"></i> Add Entry
                  </button>
                </div>
              </div>

              {entries.length > 0 && <Stats entries={entries} />}
              
              <Uploader 
                onImageSelected={(base64, mode) => { setCameraMode(mode); handleImageCaptured(base64); }}
                onOpenCamera={(mode) => { setCameraMode(mode); setIsCameraOpen(true); }}
                isLoading={status === AppStatus.PROCESSING} 
              />
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-bold animate-fade-in">
                  <i className="fas fa-triangle-exclamation"></i>
                  <span>{error}</span>
                </div>
              )}
            </section>

            {entries.length > 0 && (
              <section className="mb-20">
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <i className="fas fa-helicopter text-[#064e3b]"></i> Rotorcraft Log Records
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={handleExportCSV} className="text-xs font-bold text-[#064e3b] hover:underline uppercase tracking-widest">
                      Export CSV
                    </button>
                  </div>
                </div>
                
                <div ref={tableRef} className="bg-white rounded-3xl shadow-xl border-2 border-[#064e3b] overflow-hidden">
                  <LogbookTable 
                    entries={entries} 
                    onUpdateEntry={(id, updates) => {
                      const newEntries = entries.map(entry => entry.id === id ? { ...entry, ...updates } : entry);
                      updateEntriesWithHistory(newEntries);
                    }} 
                    onDeleteEntry={(id) => {
                      const newEntries = entries.filter(entry => entry.id !== id);
                      updateEntriesWithHistory(newEntries);
                    }}
                    columns={columns}
                    onToggleColumn={(key) => {
                      setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
                    }}
                    onAddColumn={(label, type) => {
                      const key = label.toLowerCase().replace(/\s+/g, '_');
                      if (columns.find(c => c.key === key)) return alert("Column exists.");
                      setColumns(prev => [...prev, { key, label, visible: true, isCustom: true, type }]);
                      updateEntriesWithHistory(entries.map(e => ({ ...e, [key]: type === 'number' ? 0 : '' })));
                    }}
                    onRemoveColumn={(key) => {
                      if (confirm("Delete column data?")) {
                        setColumns(prev => prev.filter(c => c.key !== key));
                        updateEntriesWithHistory(entries.map(({ [key]: _, ...rest }) => rest as LogbookEntry));
                      }
                    }}
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
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight">My Logs</h2>
              <button 
                onClick={() => setView('terminal')}
                className="bg-[#064e3b] text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-900 transition-all shadow-md"
              >
                <i className="fas fa-plus"></i> New Log Page
              </button>
            </div>
            <LogGallery logs={savedLogs} onSelect={handleSelectSavedLog} onDelete={handleDeleteSavedLog} />
          </section>
        )}
      </main>

      {isCameraOpen && <CameraModal onCapture={handleImageCaptured} onClose={() => setIsCameraOpen(false)} />}
      
      <footer className="bg-[#064e3b] py-16 px-6 mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-xl flex items-center justify-center text-[#064e3b] shadow-xl">
              <i className="fas fa-helicopter text-3xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-white leading-none">HoverTrack</span>
              <span className="text-[10px] font-bold uppercase text-emerald-200 tracking-[0.2em] mt-2">HELICOPTER OPERATIONS TERMINAL</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-white/90">PROFESSIONAL EDITION</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">© 2025 HOVERTRACK SYSTEMS</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;