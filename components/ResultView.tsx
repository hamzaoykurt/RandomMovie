import React, { useState, useEffect } from 'react';
import { Film, Loader2, Star, Search, Check, X, RefreshCw } from 'lucide-react';
import { MediaItem } from '../types';
import { TMDB_IMAGE_BASE } from '../services/tmdb';

interface ResultViewProps {
  item: MediaItem;
  loading: boolean;
  onClose: () => void;
  onMarkWatched: () => void;
  hasApiKey: boolean;
  onOpenSettings: () => void;
  onShuffle: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ 
  item, loading, onClose, onMarkWatched, hasApiKey, onOpenSettings, onShuffle 
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reset image loaded state when item changes
  useEffect(() => {
    setImgLoaded(false);
  }, [item]);

  // Handle Swipe Down to Close
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchMove, setTouchMove] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchMove(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchMove) return;
    const distance = touchMove - touchStart;
    const isDownSwipe = distance > 150; // Threshold
    if (isDownSwipe) {
      onClose();
    }
    setTouchStart(null);
    setTouchMove(null);
  };

  // Dynamic style for dragging
  const dragStyle = (touchStart && touchMove && touchMove > touchStart) ? {
    transform: `translateY(${touchMove - touchStart}px)`,
    transition: 'none',
  } : {};

  const watchNow = () => {
    window.open(
      `https://www.google.com/search?q=${encodeURIComponent(item.t + ' izle')}`,
      '_blank',
      'noopener,noreferrer'
    );
    onMarkWatched();
  };

  return (
    <div 
      className="result-viewport relative w-full bg-black overflow-hidden flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={dragStyle}
    >
      
      {/* --- HERO IMAGE LAYER --- */}
      <div className="absolute inset-0 z-0">
        {item.img ? (
          <>
            {/* Background Blur for ambiance (fallback or edge fill) */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-125 transition-opacity duration-1000"
              style={{ backgroundImage: `url(${TMDB_IMAGE_BASE}${item.img})` }} 
            />
            
            {/* Main Poster Image - Object Cover for "Full Screen" feel */}
            <img 
              src={`${TMDB_IMAGE_BASE}${item.img}`} 
              alt={item.t} 
              onLoad={() => setImgLoaded(true)}
              className={`
                w-full h-full object-cover object-top transition-all duration-1000 ease-out md:object-contain
                ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
              `}
            />
          </>
        ) : (
          /* Fallback No Image */
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900/50 backdrop-blur-sm">
            <Film size={80} className="text-neutral-700 mb-4" />
            <p className="text-neutral-500 font-medium">Poster Bulunamadı</p>
          </div>
        )}

        {/* Cinematic Gradients - Crucial for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent z-10" />
      </div>

      {/* --- TOP BAR --- */}
      <div className="result-topbar relative z-50 flex justify-between items-start px-5 sm:px-6 pb-5">
        <div className="flex flex-col">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/60 mb-1">
            RandomMovie
          </span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${item.type === 'movie' ? 'bg-red-600' : 'bg-blue-600'} text-white shadow-lg shadow-red-900/20`}>
              {item.type === 'movie' ? 'Film' : 'Dizi'}
            </span>
            {item.r > 0 && (
              <div className="flex items-center gap-1 bg-yellow-500/10 backdrop-blur-md border border-yellow-500/20 px-2 py-0.5 rounded text-yellow-500 text-[10px] font-bold">
                <Star size={10} fill="currentColor" /> {item.r.toFixed(1)}
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white hover:text-black transition-all duration-300 group shadow-2xl"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* --- LOADING STATE --- */}
      {loading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <Loader2 size={48} className="text-white animate-spin mb-4" />
          <span className="text-white/70 text-sm font-medium tracking-wide animate-pulse">Seçim Yapılıyor...</span>
        </div>
      )}

      {/* --- CONTENT LAYER --- */}
      <div className="result-content relative z-40 mt-auto px-5 sm:px-6 pt-6 w-full max-w-2xl mx-auto animate-slide-up">
        
        {/* Title & Year */}
        <div className="mb-8 text-shadow-lg">
          <h1 className="text-4xl md:text-6xl font-black text-white leading-[0.9] tracking-tight mb-3">
            {item.t}
          </h1>
          <p className="text-white/60 text-lg font-medium tracking-wide">
            {item.y || 'Yıl Bilinmiyor'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={watchNow}
            className="group relative flex items-center justify-center gap-3 py-4 bg-white text-black rounded-2xl font-bold overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Search size={20} className="group-hover:scale-110 transition-transform" />
            <span>İzle</span>
          </button>
          
          <button 
            onClick={onMarkWatched}
            className="group flex items-center justify-center gap-3 py-4 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-2xl font-bold hover:bg-white/20 hover:border-white/30 transition-all duration-300 active:scale-95"
          >
            <Check size={20} className="text-green-400 group-hover:scale-110 transition-transform" />
            <span>İzledim</span>
          </button>
        </div>

        {/* Shuffle Button */}
        <button 
          onClick={onShuffle}
          className="w-full group flex items-center justify-center gap-3 py-4 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-neutral-400 rounded-2xl font-bold hover:bg-neutral-800 hover:text-white hover:border-neutral-700 transition-all duration-300 active:scale-95"
        >
          <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          <span>Başka Bir {item.type === 'movie' ? 'Film' : 'Dizi'} Öner</span>
        </button>

        {!hasApiKey && !loading && (
           <div className="mt-6 text-center">
              <button onClick={onOpenSettings} className="text-xs text-white/40 hover:text-white underline decoration-white/20 underline-offset-4 transition-colors">
                Poster görünmüyor mu? API Ayarları
              </button>
           </div>
        )}
      </div>

    </div>
  );
};
