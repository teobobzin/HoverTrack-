import React, { useState, useMemo } from 'react';
import { LogbookEntry, ColumnDefinition } from '../types';
import ColumnManager from './ColumnManager';

interface InputFieldProps {
  entry: LogbookEntry;
  field: string;
  className?: string;
  type?: string;
  onUpdateEntry: (id: string, updates: Partial<LogbookEntry>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ entry, field, className, type = "text", onUpdateEntry }) => {
  const value = entry[field];
  return (
    <input 
      type={type} 
      step={type === 'number' ? '0.1' : undefined}
      value={value === undefined || value === null ? '' : value as string | number} 
      onChange={(e) => {
        const val = type === 'number' ? parseFloat(e.target.value) : e.target.value;
        onUpdateEntry(entry.id, { [field]: isNaN(val as any) && type === 'number' ? null : val });
      }}
      className={`${className} transition-all border border-transparent focus:border-[#0a1f44] focus:bg-white rounded p-1 text-sm font-bold text-black bg-transparent outline-none`}
    />
  );
};

interface LogbookTableProps {
  entries: LogbookEntry[];
  onUpdateEntry: (id: string, updates: Partial<LogbookEntry>) => void;
  onDeleteEntry: (id: string) => void;
  columns: ColumnDefinition[];
  onToggleColumn: (key: string) => void;
  onAddColumn: (label: string, type: 'text' | 'number') => void;
  onRemoveColumn: (key: string) => void;
  amountForward: Record<string, number>;
  onUpdateAmountForward: (key: string, value: number) => void;
}

type SortConfig = {
  key: string | null;
  direction: 'asc' | 'desc' | null;
};

const LogbookTable: React.FC<LogbookTableProps> = ({ 
  entries, onUpdateEntry, onDeleteEntry, columns, onToggleColumn, onAddColumn, onRemoveColumn,
  amountForward, onUpdateAmountForward
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
  const [isColManagerOpen, setIsColManagerOpen] = useState(false);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key: direction ? key : null, direction });
  };

  const filteredAndSortedEntries = useMemo(() => {
    let result = [...entries];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(entry => Object.values(entry).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)));
    }
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];
        if (valA === undefined || valB === undefined) return 0;
        if (typeof valA === 'number' && typeof valB === 'number') return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [entries, searchTerm, sortConfig]);

  // Group entries by batchId for page summary rows
  const groupedBatches = useMemo(() => {
    const batches: { id: string; entries: LogbookEntry[] }[] = [];
    filteredAndSortedEntries.forEach(entry => {
      const lastBatch = batches[batches.length - 1];
      if (lastBatch && lastBatch.id === entry.batchId) {
        lastBatch.entries.push(entry);
      } else {
        batches.push({ id: entry.batchId || 'unbatched', entries: [entry] });
      }
    });
    return batches;
  }, [filteredAndSortedEntries]);

  if (entries.length === 0) return null;
  const visibleColumns = columns.filter(c => c.visible);

  const calculateBatchTotals = (batchEntries: LogbookEntry[]) => {
    const totals: Record<string, number> = {};
    batchEntries.forEach(entry => {
      Object.keys(entry).forEach(key => {
        if (typeof entry[key] === 'number' && key !== 'id') {
          totals[key] = (totals[key] || 0) + (entry[key] || 0);
        }
      });
    });
    return totals;
  };

  const renderSummaryCell = (col: ColumnDefinition, totals: Record<string, number>, carryForward: Record<string, number>, isEditable: boolean = false) => {
    if (col.type !== 'number' && col.key !== 'ldgSub' && col.key !== 'route') {
      return null;
    }

    if (col.key === 'ldgSub') {
      const dayVal = totals['ldgDay'] || 0;
      const nightVal = totals['ldgNight'] || 0;
      const dayCarry = carryForward['ldgDay'] || 0;
      const nightCarry = carryForward['ldgNight'] || 0;

      return (
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 border-r border-[#0a1f44] pr-2">
            {isEditable ? (
              <input type="number" value={dayCarry} onChange={(e) => onUpdateAmountForward('ldgDay', parseFloat(e.target.value) || 0)} className="w-8 text-center bg-transparent border-b border-[#0a1f44] text-[10px] font-black text-black" />
            ) : (
              <span className="text-[10px] text-black font-black">{(dayVal + dayCarry)}</span>
            )}
          </div>
          <div className="flex items-center gap-1 pl-1">
             {isEditable ? (
              <input type="number" value={nightCarry} onChange={(e) => onUpdateAmountForward('ldgNight', parseFloat(e.target.value) || 0)} className="w-8 text-center bg-transparent border-b border-[#0a1f44] text-[10px] font-black text-black" />
            ) : (
              <span className="text-[10px] text-black font-black">{(nightVal + nightCarry)}</span>
            )}
          </div>
        </div>
      );
    }

    const val = totals[col.key] || 0;
    const carry = carryForward[col.key] || 0;

    if (isEditable) {
      return (
        <input 
          type="number" 
          step="0.1"
          value={carry} 
          onChange={(e) => onUpdateAmountForward(col.key, parseFloat(e.target.value) || 0)} 
          className="w-12 text-center bg-transparent border-b border-[#0a1f44] text-[10px] font-black text-black outline-none" 
        />
      );
    }

    return <span className="text-[10px] font-black text-black">{(val + carry).toFixed(1)}</span>;
  };

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <button onClick={() => setIsColManagerOpen(true)} className="flex items-center gap-2 bg-white border-2 border-[#0a1f44] text-black px-4 py-2 rounded-xl text-sm font-black hover:bg-slate-50 shadow-sm">
          <i className="fas fa-columns text-black"></i> Configure Columns
        </button>
        <div className="relative w-full sm:w-72">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-black text-sm"></i>
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0a1f44] rounded-xl text-sm font-bold text-black focus:ring-2 focus:ring-[#0a1f44] outline-none shadow-sm placeholder-black/50"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-xl border-2 border-[#0a1f44] bg-white">
        <table className="min-w-full divide-y divide-[#0a1f44]">
          <thead className="bg-[#0a1f44]/5">
            <tr>
              {visibleColumns.map(col => (
                <th key={col.key} className="px-3 py-3 text-left text-[11px] font-black text-black uppercase tracking-wider cursor-pointer hover:bg-[#0a1f44]/10 whitespace-pre-line leading-tight" onClick={() => handleSort(col.key)}>
                  {col.label} {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              ))}
              <th className="px-3 py-3 text-center text-[11px] font-black text-black uppercase">Del</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#0a1f44]/20">
            {(() => {
              let cumulativeTotals: Record<string, number> = { ...amountForward };
              
              return groupedBatches.map((batch, bIndex) => {
                const batchTotals = calculateBatchTotals(batch.entries);
                const batchAmountForward = { ...cumulativeTotals };
                const batchTotalToDate = {};
                
                Object.keys(batchTotals).forEach(key => {
                  (batchTotalToDate as any)[key] = batchTotals[key] + (batchAmountForward[key] || 0);
                });
                
                // Update cumulative for the next batch
                cumulativeTotals = { ...batchTotalToDate };

                return (
                  <React.Fragment key={`batch-${batch.id}`}>
                    {batch.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        {visibleColumns.map(col => (
                          <td key={`${entry.id}-${col.key}`} className="px-3 py-2 whitespace-nowrap">
                            {col.key === 'route' ? (
                              <div className="flex items-center gap-1">
                                <InputField entry={entry} field="routeFrom" className="w-12 text-[11px] font-black text-center" onUpdateEntry={onUpdateEntry} />
                                <span className="text-black text-[11px] font-black">/</span>
                                <InputField entry={entry} field="routeTo" className="w-12 text-[11px] font-black text-center" onUpdateEntry={onUpdateEntry} />
                              </div>
                            ) : col.key === 'ldgSub' ? (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-1 border-r border-[#0a1f44] pr-2">
                                  <span className="text-[9px] text-black font-black uppercase">D:</span>
                                  <InputField entry={entry} field="ldgDay" type="number" className="w-8 text-center" onUpdateEntry={onUpdateEntry} />
                                </div>
                                <div className="flex items-center gap-1 pl-1">
                                  <span className="text-[9px] text-black font-black uppercase">N:</span>
                                  <InputField entry={entry} field="ldgNight" type="number" className="w-8 text-center" onUpdateEntry={onUpdateEntry} />
                                </div>
                              </div>
                            ) : (
                              <InputField entry={entry} field={col.key} type={col.type === 'number' ? 'number' : 'text'} className={`${col.type === 'number' ? 'w-14 text-center font-black' : col.key === 'signature' ? 'w-48 italic' : 'w-32'} text-[11px]`} onUpdateEntry={onUpdateEntry} />
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <button onClick={() => onDeleteEntry(entry.id)} className="text-black hover:text-red-600 p-1">
                            <i className="fas fa-trash-alt text-sm"></i>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Summary Rows for this specific batch (page) */}
                    <tr className="bg-slate-50/50 border-t border-[#0a1f44]/40">
                      {visibleColumns.map((col, idx) => (
                        <td key={`batch-pt-${batch.id}-${col.key}`} className="px-3 py-1 whitespace-nowrap">
                          {idx === 0 ? <span className="text-[9px] font-black text-black uppercase opacity-60">Page Total</span> : renderSummaryCell(col, batchTotals, {}, false)}
                        </td>
                      ))}
                      <td></td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      {visibleColumns.map((col, idx) => (
                        <td key={`batch-af-${batch.id}-${col.key}`} className="px-3 py-1 whitespace-nowrap">
                          {idx === 0 ? <span className="text-[9px] font-black text-black uppercase opacity-60">Amt Forward</span> : renderSummaryCell(col, {}, batchAmountForward, bIndex === 0)}
                        </td>
                      ))}
                      <td></td>
                    </tr>
                    <tr className="bg-slate-50 border-b border-[#0a1f44]/40">
                      {visibleColumns.map((col, idx) => (
                        <td key={`batch-ttd-${batch.id}-${col.key}`} className="px-3 py-2 whitespace-nowrap">
                          {idx === 0 ? <span className="text-[10px] font-black text-blue-600 uppercase">Total to Date</span> : renderSummaryCell(col, batchTotals, batchAmountForward, false)}
                        </td>
                      ))}
                      <td></td>
                    </tr>

                    {/* Blue Gap Separator after the batch summary */}
                    {bIndex < groupedBatches.length - 1 && (
                      <tr>
                        <td colSpan={visibleColumns.length + 1} className="p-0">
                          <div className="h-4 bg-blue-600 shadow-inner flex items-center justify-center">
                            <div className="h-[1px] w-full bg-white/20"></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
      {isColManagerOpen && <ColumnManager columns={columns} onToggle={onToggleColumn} onAdd={onAddColumn} onRemove={onRemoveColumn} onClose={() => setIsColManagerOpen(false)} />}
    </div>
  );
};

export default LogbookTable;