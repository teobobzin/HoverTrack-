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
      className={`${className} transition-all border border-transparent focus:border-[#064e3b] focus:bg-white rounded p-1 text-sm font-bold text-slate-900 bg-transparent outline-none`}
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

  if (entries.length === 0) return null;
  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <button onClick={() => setIsColManagerOpen(true)} className="flex items-center gap-2 bg-white border-2 border-[#064e3b] text-slate-900 px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 shadow-sm">
          <i className="fas fa-columns"></i> Configure Columns
        </button>
      </div>
      
      <div className="relative w-full">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#064e3b] text-sm"></i>
        <input 
          type="text" 
          placeholder="Search logs..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-12 pr-6 py-3 bg-white border-2 border-[#064e3b] rounded-2xl text-sm font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-3xl border-2 border-[#064e3b]">
        <table className="min-w-full divide-y divide-[#064e3b]">
          <thead className="bg-emerald-50/50">
            <tr>
              {visibleColumns.map(col => (
                <th key={col.key} className="px-6 py-6 text-left text-xs font-bold text-slate-900 uppercase tracking-widest cursor-pointer hover:bg-emerald-100/50" onClick={() => handleSort(col.key)}>
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-6"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredAndSortedEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                {visibleColumns.map(col => (
                  <td key={`${entry.id}-${col.key}`} className="px-6 py-5 whitespace-nowrap">
                    {col.key === 'route' ? (
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                        <InputField entry={entry} field="routeFrom" className="w-16" onUpdateEntry={onUpdateEntry} />
                        <span>-</span>
                        <InputField entry={entry} field="routeTo" className="w-16" onUpdateEntry={onUpdateEntry} />
                      </div>
                    ) : (
                      <InputField entry={entry} field={col.key} type={col.type === 'number' ? 'number' : 'text'} className="w-32 font-bold" onUpdateEntry={onUpdateEntry} />
                    )}
                  </td>
                ))}
                <td className="px-6 py-5 text-right">
                  <button onClick={() => onDeleteEntry(entry.id)} className="text-slate-400 hover:text-red-600">
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isColManagerOpen && <ColumnManager columns={columns} onToggle={onToggleColumn} onAdd={onAddColumn} onRemove={onRemoveColumn} onClose={() => setIsColManagerOpen(false)} />}
    </div>
  );
};

export default LogbookTable;