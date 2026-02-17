
import React, { useState } from 'react';
import { ColumnDefinition } from '../types';

interface ColumnManagerProps {
  columns: ColumnDefinition[];
  onToggle: (key: string) => void;
  onAdd: (label: string, type: 'text' | 'number') => void;
  onRemove: (key: string) => void;
  onClose: () => void;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({ columns, onToggle, onAdd, onRemove, onClose }) => {
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<'text' | 'number'>('text');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColLabel.trim()) {
      onAdd(newColLabel.trim(), newColType);
      setNewColLabel('');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Configure Columns</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Visible Columns</p>
          <div className="space-y-2 mb-8">
            {columns.map(col => (
              <div key={col.key} className="flex items-center justify-between group">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={col.visible} 
                    onChange={() => onToggle(col.key)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className={`text-sm ${col.visible ? 'text-slate-700 font-medium' : 'text-slate-400 italic'}`}>
                    {col.label}
                  </span>
                </label>
                {col.isCustom && (
                  <button 
                    onClick={() => onRemove(col.key)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all text-xs"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Add New Column</p>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input 
              type="text" 
              placeholder="e.g. Cross Country, PIC Multi" 
              value={newColLabel}
              onChange={(e) => setNewColLabel(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
            <div className="flex gap-2">
              <select 
                value={newColType}
                onChange={(e) => setNewColType(e.target.value as 'text' | 'number')}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="text">Text Field</option>
                <option value="number">Numeric Field</option>
              </select>
              <button 
                type="submit"
                disabled={!newColLabel.trim()}
                className="bg-sky-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-sky-500 disabled:bg-slate-300 transition-all"
              >
                Add
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-right">
          <button 
            onClick={onClose}
            className="text-slate-600 font-bold text-sm hover:text-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnManager;
