
import React, { useRef, useEffect, useState } from 'react';

interface CameraModalProps {
  onCapture: (photoBase64: string, signatureBase64?: string) => void;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please ensure permissions are granted.");
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Signature Pad Logic
  useEffect(() => {
    if (isSigning && sigCanvasRef.current) {
      const canvas = sigCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
      }
    }
  }, [isSigning]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (sigCanvasRef.current) {
      const ctx = sigCanvasRef.current.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      const ctx = sigCanvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        let signatureBase64 = undefined;
        if (sigCanvasRef.current) {
          // Check if canvas is blank (simplified check)
          const sigData = sigCanvasRef.current.toDataURL('image/png');
          signatureBase64 = sigData.split(',')[1];
        }
        
        onCapture(photoBase64, signatureBase64);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
            <p className="text-white font-medium">{error}</p>
            <button 
              onClick={onClose}
              className="mt-6 bg-slate-700 text-white px-6 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-opacity ${isSigning ? 'opacity-20' : 'opacity-100'}`}
            />
            
            {/* Guidelines Overlay */}
            {!isSigning && (
              <div className="absolute inset-10 border-2 border-white/30 rounded-lg pointer-events-none flex items-center justify-center">
                <div className="text-white/40 text-xs font-bold uppercase tracking-widest">Align Logbook Here</div>
              </div>
            )}

            {/* Signature Pad Overlay */}
            {isSigning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 p-6">
                <div className="bg-white rounded-xl shadow-2xl p-2 w-full max-w-sm">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <span className="text-[10px] font-black text-black uppercase tracking-wider">Pilot Signature Pad</span>
                    <button onClick={clearSignature} className="text-[10px] font-black text-red-600 uppercase">Clear</button>
                  </div>
                  <canvas 
                    ref={sigCanvasRef}
                    width={400}
                    height={200}
                    className="w-full h-40 bg-slate-50 border-2 border-dashed border-black/20 rounded-lg touch-none"
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                  />
                  <p className="text-[8px] text-black/40 text-center mt-2 font-bold uppercase italic">Sign above to certify entries</p>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-around px-10">
              <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
              
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={capturePhoto}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-95 transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-white shadow-inner"></div>
                </button>
              </div>

              <button 
                onClick={() => setIsSigning(!isSigning)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSigning ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-white/10 text-white'}`}
              >
                <i className={`fas ${isSigning ? 'fa-check' : 'fa-signature'} text-xl`}></i>
              </button>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-slate-400 mt-6 text-sm">
        {isSigning ? "Draw your signature on the pad" : "Hold steady and ensure good lighting"}
      </p>
    </div>
  );
};

export default CameraModal;
