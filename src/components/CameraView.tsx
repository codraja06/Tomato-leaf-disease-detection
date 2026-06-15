import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera as CameraIcon, RefreshCw, X, AlertCircle } from "lucide-react";
import Webcam from "react-webcam";

interface CameraViewProps {
  onCapture: (image: string) => void;
  onClose: () => void;
}

export default function CameraView({ onCapture, onClose }: CameraViewProps) {
  const webcamRef = useRef<Webcam & { getScreenshot: () => string | null }>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc);
    }
  }, [webcamRef, onCapture]);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
      }
    };
    checkPermission();
  }, []);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-rose-50 rounded-3xl border border-rose-100">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <h3 className="text-xl font-black text-rose-900 mb-2">Camera Access Required</h3>
        <p className="text-slate-600 mb-6 font-medium">Please enable camera permissions in your browser settings to use the live scanner.</p>
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video md:aspect-square max-h-[600px] bg-black rounded-[32px] overflow-hidden group">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: "environment",
          width: 1280,
          height: 1280,
        }}
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-x-0 bottom-0 p-8 flex items-center justify-center gap-6">
        <button 
          onClick={onClose}
          className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
        >
          <X size={24} />
        </button>
        <button 
          onClick={capture}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-90"
        >
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-primary rounded-full" />
          </div>
        </button>
        <div className="w-14" /> {/* Spacer */}
      </div>

      <div className="absolute top-8 right-8">
        <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/20">
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Scanner Active
          </span>
        </div>
      </div>
    </div>
  );
}
