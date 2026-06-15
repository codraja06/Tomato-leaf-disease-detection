import React from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  ShoppingBag, 
  ExternalLink,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DetectionResult } from "../types";

interface PredictionResultProps {
  imageUrl: string;
  isAnalyzing: boolean;
  result: DetectionResult | null;
  error: string | null;
  onReset: () => void;
}

export default function PredictionResult({ imageUrl, isAnalyzing, result, error, onReset }: PredictionResultProps) {
  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 min-h-[500px]">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <motion.div
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 2 }}
             >
               <Loader2 className="text-primary" size={32} />
             </motion.div>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-black text-slate-800">Analyzing Sample...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-black text-rose-900">Analysis Failed</h3>
          <p className="text-slate-500 font-medium max-w-md">{error}</p>
        </div>
        <button 
          onClick={onReset}
          className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Try Another Photo
        </button>
      </div>
    );
  }

  if (!result) return null;

  const confidencePercent = Math.round(result.confidence * 100);
  const confidenceLevel = result.confidence > 0.7 
    ? { label: 'High Precision', color: 'bg-green-100 text-green-700 border-green-200' }
    : result.confidence > 0.4 ? { label: 'Medium Certainty', color: 'bg-amber-100 text-amber-700 border-amber-200' }
    : { label: 'Re-scan Suggested', color: 'bg-rose-100 text-rose-700 border-rose-200' };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Left Section: Image Display */}
        <div className="w-full md:w-2/5 shrink-0 max-w-sm md:max-w-none">
          <div className="relative group rounded-[24px] overflow-hidden shadow-xl border-4 border-white aspect-square bg-slate-100">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-800 tracking-tight bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md">TomatoGuard</span>
            </div>
            <img 
              src={imageUrl} 
              alt="Analyzed leaf" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Right Section: Core Prediction */}
        <div className="flex-1 space-y-4 flex flex-col justify-center py-1">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 group/hist">
                <RefreshCw size={14} className="text-slate-400" />
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${confidenceLevel.color}`}>
                {confidenceLevel.label} • {confidencePercent}%
              </div>
              {result.isCachedFallback && (
                <>
                  <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
                  <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-ping" />
                    Cached Fallback Active
                  </div>
                </>
              )}
            </div>

            <div className="space-y-3">
              <div className="relative">
                <h3 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tight uppercase">
                  {result.diseaseName.split(' ').map((word, i) => (
                    <span key={i} className={`block ${i > 0 ? 'text-[#2e7d32]' : 'text-slate-800'}`}>
                      {word}
                    </span>
                  ))}
                </h3>
                <div className="w-12 h-1 bg-slate-100 rounded-full mt-3" />
              </div>

              <div className="bg-[#cfd8dc]/40 border border-slate-200 rounded-[20px] p-6 space-y-3 shadow-sm relative overflow-hidden max-w-2xl">
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#2e7d32] rounded-full" />
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2e7d32]">Infection Cause</span>
                </div>
                <p className="text-slate-800 text-base font-bold leading-relaxed max-w-xl">
                  {result.cause || "Environmental factors favoring pathogen development."}
                </p>
              </div>


            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Recommended Product */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#cfd8dc]/40 p-5 rounded-[24px] border border-slate-200 shadow-sm flex flex-col relative group w-full h-full"
        >
          <div className="bg-white rounded-[16px] p-5 w-full flex-1 flex flex-col justify-start">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 border border-slate-100 bg-[#e8f5e9] text-[#2e7d32] rounded-lg flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Recommended Product</span>
            </div>
            
            <div className="absolute top-10 right-10 w-6 h-6 border border-slate-100 rounded-full flex items-center justify-center text-slate-300">
               <ShoppingCart size={10} />
            </div>

            <div className="flex-1 flex items-center justify-center py-4">
              <p className="text-2xl font-black text-slate-900 text-center leading-snug">{result.recommendedProduct}</p>
            </div>
          </div>
        </motion.div>

        {/* Treatment */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-[#cfd8dc]/40 p-5 rounded-[24px] border border-slate-200 shadow-sm flex flex-col w-full h-full"
        >
          <div className="bg-white rounded-[16px] p-5 w-full flex-1 flex flex-col justify-start">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                <Lightbulb size={16} />
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">treatment</span>
            </div>
            
            <p className="text-lg font-bold text-slate-800 leading-relaxed mt-2 animate-in fade-in duration-500">
              {result.naturalTreatment}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-center pt-4">
        <button 
          onClick={onReset}
          className="px-10 py-4 bg-slate-900 text-white rounded-[20px] font-black shadow-xl hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 text-xs uppercase tracking-widest"
        >
          <RefreshCw size={18} />
          Scan New Sample
        </button>
      </div>
    </div>
  );
}
