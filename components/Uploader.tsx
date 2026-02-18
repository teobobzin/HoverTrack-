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
        className={`relative border-2 border-dashed rounded-[40px] p-16 transition-all text-center
          ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-[#064e3b] bg-white'}
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      >
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
        
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 border-2 border-[#064e3b] bg-white rounded-full flex items-center justify-center mb-8 text-blue-600 shadow-xl">
            <i className="fas fa-camera text-3xl"></i>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-4">Digitize Logbook Page</h3>
          <p className="text-slate-700 mb-10 max-w-sm mx-auto text-lg font-medium">
            Snap a photo or upload an image of your handwritten flight records.
          </p>
          
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <button 
              onClick={() => { setUploadMode('extract'); onOpenCamera('extract'); }}
              className="w-full bg-[#064e3b] text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-900 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <i className="fas fa-camera"></i> <span>Take Photo</span>
            </button>
            <button 
              onClick={() => { setUploadMode('extract'); fileInputRef.current?.click(); }}
              className="w-full bg-white border-2 border-[#064e3b] text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <i className="fas fa-file-upload"></i> <span>Choose File</span>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-[4px] rounded-[40px] z-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600"></div>
              <p className="text-[#064e3b] font-bold mt-6 text-xl">Processing Log...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-2 border-[#064e3b] rounded-[40px] p-10 flex flex-col items-center gap-6 shadow-md">
        <div className="flex items-center gap-6 w-full">
          <div className="w-16 h-16 border-2 border-[#064e3b] rounded-full flex items-center justify-center text-blue-600">
            <i className="fas fa-magic text-2xl"></i>
          </div>
          <div className="text-left">
            <h4 className="text-xl font-bold text-slate-900 mb-1">Custom Logbook Format?</h4>
            <p className="text-sm text-slate-700 font-bold">Let AI recognize your unique logbook layout automatically.</p>
          </div>
        </div>
        <button 
          onClick={() => { setUploadMode('format'); onOpenCamera('format'); }}
          className="bg-[#064e3b] text-white px-10 py-3 rounded-2xl text-md font-bold hover:bg-emerald-900 transition-all shadow-lg"
        >
          Learn Format from Photo
        </button>
      </div>
    </div>
  );
};

export default Uploader;