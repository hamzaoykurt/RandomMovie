import React, { useRef } from 'react';
import { Upload, AlertTriangle, ArrowRight } from 'lucide-react';

interface WelcomeProps {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSkip: () => void;
  hasApiKey: boolean;
}

export const Welcome: React.FC<WelcomeProps> = ({ onFileUpload, onSkip, hasApiKey }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 flex flex-col justify-center animate-in fade-in duration-700 pb-20 relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileUpload} 
        accept=".csv,.json" 
        className="hidden" 
      />
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="text-center space-y-10 relative z-10">
        <div className="space-y-4 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]">
            Bu Akşam<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600">
              Ne İzlesem?
            </span>
          </h1>
          <p className="text-neutral-500 text-lg max-w-xs mx-auto leading-relaxed font-medium">
            Arşivini yükle, yapay zeka senin için en iyi seçimi yapsın.
          </p>
        </div>

        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="group relative border border-dashed border-neutral-800 bg-neutral-900/40 backdrop-blur-sm rounded-[2rem] h-64 flex flex-col items-center justify-center cursor-pointer hover:border-red-600/50 hover:bg-neutral-900/60 transition-all duration-300 overflow-hidden w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="w-20 h-20 bg-neutral-800/50 rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-300 border border-neutral-700 group-hover:border-red-500">
              <Upload size={32} className="text-neutral-400 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-white text-lg group-hover:translate-y-[-2px] transition-transform">Dosya Yükle</span>
            <span className="text-sm text-neutral-500 mt-2 font-medium">CSV veya JSON</span>
          </div>
          
          {!hasApiKey && (
            <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-neutral-400 bg-neutral-900/50 py-3 rounded-xl border border-neutral-800/50">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>Posterler için Ayarlar'dan API Anahtarı girin.</span>
            </div>
          )}
        </div>

        <button 
          onClick={onSkip} 
          className="group flex items-center justify-center gap-2 mx-auto text-sm font-bold text-neutral-600 hover:text-white transition-colors animate-fade-in"
          style={{ animationDelay: '200ms' }}
        >
          <span>Dosyasız Devam Et</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};