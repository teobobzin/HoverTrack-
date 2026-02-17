
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
      alert('Please upload an image file.');
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
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div 
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center
          ${isDragging ? 'border-[#064e3b] bg-slate-50' : 'border-[#064e3b] bg-white hover:bg-slate-50 shadow-sm'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={onFileChange} 
        />
        
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-[#064e3b] bg-white rounded-full flex items-center justify-center mb-4 text-blue-600 shadow-lg">
            <i className="fas fa-camera-retro text-2xl"></i>
          </div>
          <h3 className="text-xl font-black text-black mb-1">Digitize Logbook Page</h3>
          <p className="text-black mb-6 max-w-sm mx-auto text-sm font-medium">
            Snap a photo or upload an image of your handwritten flight records.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button 
              onClick={() => { setUploadMode('extract'); onOpenCamera('extract'); }}
              className="flex-1 bg-[#064e3b] text-force-white px-6 py-3 rounded-xl font-black hover:bg-[#065f46] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <i className="fas fa-camera text-white"></i> <span>Take Photo</span>
            </button>
            <button 
              onClick={() => { setUploadMode('extract'); fileInputRef.current?.click(); }}
              className="flex-1 bg-white border-2 border-[#064e3b] text-black px-6 py-3 rounded-xl font-black hover:bg-slate-50 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <i className="fas fa-file-upload text-black"></i> <span>Choose File</span>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-[2px] rounded-2xl z-20">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-2 border-[#064e3b] rounded-full flex items-center justify-center text-blue-600 shadow-md">
                  <i className="fas fa-helicopter animate-pulse"></i>
                </div>
              </div>
              <p className="text-black font-black mt-6 text-lg uppercase tracking-tight">AI Processing...</p>
              <p className="text-black text-sm font-bold">Detecting structure and handwriting</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-[#064e3b] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border-2 border-[#064e3b] rounded-full flex items-center justify-center text-blue-600 shadow-md">
            <i className="fas fa-wand-magic-sparkles"></i>
          </div>
          <div>
            <h4 className="font-black text-black">Custom Logbook Format?</h4>
            <p className="text-xs text-black font-bold">Let AI recognize your unique logbook layout automatically.</p>
          </div>
        </div>
        <button 
          onClick={() => { setUploadMode('format'); onOpenCamera('format'); }}
          className="bg-[#064e3b] text-force-white px-6 py-2 rounded-xl text-sm font-black hover:bg-[#065f46] transition-all flex items-center gap-2"
        >
          <i className="fas fa-scan text-white"></i> <span>Learn Format from Photo</span>
        </button>
      </div>
    </div>
  );
};

export default Uploader;
