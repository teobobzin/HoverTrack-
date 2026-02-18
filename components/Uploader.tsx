import React, { useRef, useState } from 'react';

interface UploaderProps {
  onImageSelected: (base64: string, mode: 'extract' | 'format') => void;
  onOpenCamera: (mode: 'extract' | 'format') => void;
  isLoading: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ onImageSelected, onOpenCamera, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<'extract' | 'format'>('extract');

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a clear image of your logbook.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      onImageSelected(base64String, uploadMode);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div 
        className={`relative border-2 border-dashed rounded-3xl p-10 transition-all text-center
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-[#0a1f44] bg-white hover:bg-slate-50 shadow-lg'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
        
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 border-2 border-[#0a1f44] bg-white rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-xl group hover:scale-105 transition-transform">
            <i className="fas fa-camera-retro text-3xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">Digitize Flight Logs</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm font-medium">
            Snap a clear overhead photo of your handwritten logbook. Ensure no shadows cover the text.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button 
              onClick={() => { setUploadMode('extract'); onOpenCamera('extract'); }}
              className="flex-1 bg-[#0a1f44] text-force-white px-8 py-4 rounded-2xl font-black hover:bg-[#1e3a8a] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
            >
              <i className="fas fa-camera"></i> <span>Scan Page</span>
            </button>
            <button 
              onClick={() => { setUploadMode('extract'); fileInputRef.current?.click(); }}
              className="flex-1 bg-white border-2 border-[#0a1f44] text-[#0a1f44] px-8 py-4 rounded-2xl font-black hover:bg-slate-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
            >
              <i className="fas fa-folder-open"></i> <span>Upload</span>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-[4px] rounded-3xl z-20">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-blue-600"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white border-2 border-[#0a1f44] rounded-xl flex items-center justify-center text-blue-600 shadow-xl">
                  <i className="fas fa-helicopter animate-pulse text-xl"></i>
                </div>
              </div>
              <p className="text-[#0a1f44] font-black mt-8 text-xl uppercase tracking-widest">Processing Frames...</p>
              <p className="text-blue-600 text-xs font-black uppercase mt-2 tracking-widest">Gemini-3-Flash OCR Active</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-[#0a1f44] rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border-l-8 border-l-blue-600">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <i className="fas fa-microchip text-xl"></i>
          </div>
          <div>
            <h4 className="font-black text-slate-900">Custom Log Format Recognition</h4>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">AI will analyze your unique column structure before extraction.</p>
          </div>
        </div>
        <button 
          onClick={() => { setUploadMode('format'); onOpenCamera('format'); }}
          className="bg-blue-600 text-force-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-blue-700 transition-all flex items-center gap-3 shadow-lg active:scale-95"
        >
          <i className="fas fa-brain"></i> <span>Train AI Format</span>
        </button>
      </div>
    </div>
  );
};

export default Uploader;