import React from "react";
import { Calendar, Trash2, ChevronRight, Clock, Star } from "lucide-react";
import { format } from "date-fns";
import { DetectionResult } from "../types";

interface HistoryProps {
  items: DetectionResult[];
  onSelectItem: (item: DetectionResult) => void;
}

export default function History({ items, onSelectItem }: HistoryProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-slate-50 rounded-[40px] border border-slate-100">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-6 shadow-sm">
          <Clock size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">No Archive Data</h3>
        <p className="text-slate-500 font-medium max-w-xs">Your diagnostic history will appear here once you've completed a health scan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="group relative flex items-center gap-6 p-5 bg-white border border-slate-100 rounded-[32px] text-left hover:shadow-2xl hover:shadow-slate-200/50 hover:bg-slate-50 transition-all duration-500 overflow-hidden"
          >
            <div className="relative w-32 h-32 shrink-0 rounded-[24px] overflow-hidden bg-slate-100 shadow-inner">
              <img 
                src={item.imageUrl} 
                alt={item.diseaseName} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{format(item.timestamp, 'MMM dd, yyyy')}</span>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   {Math.round(item.confidence * 100)}% Match
                </div>
              </div>
              
              <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-primary transition-colors">
                {item.diseaseName}
              </h4>
            </div>

            <div className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/10 transition-all">
              <ChevronRight size={20} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
