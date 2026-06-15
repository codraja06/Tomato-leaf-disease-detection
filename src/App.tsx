

import React, { useState, useEffect } from "react";
import { Camera, Upload, History as HistoryIcon, Leaf, AlertCircle, ChevronLeft, Shield, Sparkles, Users, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CameraView from "./components/CameraView";
import FileUpload from "./components/FileUpload";
import PredictionResultView from "./components/PredictionResult";
import History from "./components/History";
import { DetectionResult } from "./types";
import { analyzeLeaf } from "./services/diseaseService";

export default function App() {
  const [view, setView] = useState<"home" | "camera" | "upload" | "result" | "history">("home");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("SANGEETH");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

 
  useEffect(() => {
    const savedHistory = localStorage.getItem("tomato_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const addToHistory = (newResult: DetectionResult) => {
    const updatedHistory = [newResult, ...history].slice(0, 10);
    setHistory(updatedHistory);
    try {
      localStorage.setItem("tomato_history", JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  const handleImageCapture = async (blobUrl: string) => {
    setSelectedImage(blobUrl);
    setView("result");
    await handleAnalyze(blobUrl);
  };

  const handleAnalyze = async (imageUrl: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeLeaf(imageUrl);
      const newResult: DetectionResult = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        diseaseName: analysis.diseaseName,
        confidence: analysis.confidence,
        recommendedProduct: analysis.recommendedProduct,
        naturalTreatment: analysis.naturalTreatment,
        explanation: analysis.explanation,
        cause: analysis.cause,
        productUrl: analysis.productUrl,
        imageUrl: imageUrl
      };
      setResult(newResult);
      addToHistory(newResult);
    } catch (err: any) {
      console.error("Diagnosis Error:", err);
      setError(err.message || "Unable to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setView("home");
    setSelectedImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col text-slate-900 font-sans selection:bg-green-100 overflow-x-hidden">
      {/* Background Decor */}
      <AnimatePresence>
        {view === "home" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-0"
          >
            <img 
              src="https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=2560" 
              alt="Background"
              className="w-full h-full object-cover opacity-20"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-white/80" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={reset}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
              <Leaf size={20} />
            </div>
            <h1 className="font-black text-2xl tracking-tighter text-slate-800">TomatoGuard</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-5">
            <button 
              onClick={() => setView("history")}
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-all"
              title="History"
            >
              <HistoryIcon size={20} className="text-slate-600" />
            </button>
            <div className="flex items-center gap-3 pl-1 relative">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">User</p>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">{userName}</p>
              </div>
              <div 
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt="Profile" />
              </div>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[-1]"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50"
                    >
                      {isEditingName ? (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Change Name</p>
                          <input 
                            autoFocus
                            type="text" 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setUserName(tempName);
                                setIsEditingName(false);
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <button 
                              className="flex-1 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg hover:bg-black transition-all"
                              onClick={() => {
                                setUserName(tempName);
                                setIsEditingName(false);
                              }}
                            >
                              Save
                            </button>
                            <button 
                              className="flex-1 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all"
                              onClick={() => {
                                setTempName(userName);
                                setIsEditingName(false);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="p-3 bg-slate-50 rounded-xl mb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Profile</p>
                            <p className="text-sm font-black text-slate-800">{userName}</p>
                          </div>
                          <button 
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all text-left"
                            onClick={() => {
                              setTempName(userName);
                              setIsEditingName(true);
                            }}
                          >
                            <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                              <Leaf size={16} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">Edit Profile</span>
                          </button>
                          <button 
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all text-left"
                            onClick={() => {
                              setShowProfileMenu(false);
                              setView("history");
                            }}
                          >
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                              <HistoryIcon size={16} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">Scan History</span>
                          </button>
                          <div className="h-[1px] bg-slate-100 my-2" />
                          <button 
                            className="w-full flex items-center gap-3 p-2.5 hover:bg-rose-50 rounded-xl transition-all text-left text-rose-600"
                            onClick={() => {
                              window.location.reload();
                            }}
                          >
                            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                              <RefreshCw size={16} />
                            </div>
                            <span className="text-xs font-bold">Sign Out</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-6xl w-full mx-auto px-6 pt-20 pb-8 relative z-10">
        <AnimatePresence mode="wait">
          {view === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >

              <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-none tracking-tight mb-6">
                Tomato Leaf<br />
                <span className="text-primary italic">Disease Detector.</span>
              </h2>
              
              <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mb-10">
                Helping farmers identify crop diseases instantly and providing easy, effective solutions.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button 
                  onClick={() => setView("camera")}
                  className="px-10 py-5 bg-primary text-white rounded-[24px] font-black shadow-2xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3"
                >
                  <Camera size={24} />
                  Capture Image
                </button>
                <button 
                  onClick={() => setView("upload")}
                  className="px-10 py-5 bg-white text-slate-800 border-2 border-slate-200 rounded-[24px] font-black hover:bg-slate-50 transition-all flex items-center gap-3"
                >
                  <Upload size={24} />
                  Upload Image
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 border border-white p-5 md:p-8 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={reset} 
                  className="group flex items-center gap-2 px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
                >
                  <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </button>
              </div>

              {view === "camera" && <CameraView onCapture={handleImageCapture} onClose={reset} />}
              {view === "upload" && <FileUpload onFileSelect={handleImageCapture} />}
              {view === "result" && (
                <PredictionResultView 
                  imageUrl={selectedImage!} 
                  isAnalyzing={isAnalyzing} 
                  result={result} 
                  error={error}
                  onReset={reset}
                />
              )}
              {view === "history" && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Recent Scans</h3>
                    <p className="text-slate-500 font-medium italic underline decoration-primary/20">Archive of previous leaf evaluations.</p>
                  </div>
                  <History items={history} onSelectItem={(item) => {
                    setResult(item);
                    setSelectedImage(item.imageUrl);
                    setView("result");
                  }} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
