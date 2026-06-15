import React, { useState } from "react";
import { Upload as UploadIcon, AlertCircle } from "lucide-react";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface FileUploadProps {
  onFileSelect: (image: string) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSizeError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = ""; // reset the input
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onFileSelect(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-3">
      <label className="relative flex flex-col items-center justify-center w-full h-[400px] bg-slate-50 border-4 border-dashed border-slate-200 rounded-[40px] cursor-pointer hover:bg-white hover:border-primary/40 transition-all group overflow-hidden">
        <div className="absolute inset-0 bg-primary/2 rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000" />
        
        <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-24 h-24 bg-white text-primary rounded-[32px] flex items-center justify-center shadow-xl shadow-primary/5 transition-transform group-hover:scale-110 group-hover:rotate-6">
             <UploadIcon size={40} />
          </div>
          
          <div className="space-y-2">
            <p className="text-2xl font-black text-slate-800 tracking-tight">Drop your image here</p>
            <p className="text-slate-500 font-medium">Supported: JPG, PNG, WEBP (Max 10MB)</p>
          </div>

          <div className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-200">
            or click to browse files
          </div>
        </div>

        <input 
          type="file" 
          className="hidden" 
          accept="image/jpeg,image/png,image/webp" 
          onChange={handleFileChange} 
        />
      </label>

      {sizeError && (
        <div className="flex items-center gap-3 px-5 py-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700">
          <AlertCircle size={18} className="shrink-0" />
          <p className="text-sm font-semibold">{sizeError}</p>
        </div>
      )}
    </div>
  );
}
