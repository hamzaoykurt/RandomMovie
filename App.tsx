import React, { useState, useRef, useEffect } from 'react';
import { 
  Film, Tv, Plus, Settings, RefreshCw,
  AlertTriangle, Check, ExternalLink, Download, Sparkles
} from 'lucide-react';

import { MediaItem, Database, ViewState, ModalState, ToastMessage } from './types';
import { parseCSV, parseJSON } from './utils/parsers';
import { fetchPoster } from './services/tmdb';

import { Modal } from './components/Modal';
import { Welcome } from './components/Welcome';
import { ActionButton } from './components/ActionButton';
import { ResultView } from './components/ResultView';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function App() {
  // --- STATE INITIALIZATION WITH LOCALSTORAGE ---
  
  // 1. Load Database from Storage
  const [db, setDb] = useState<Database>(() => {
    try {
      const saved = localStorage.getItem('moviebase_db');
      return saved ? JSON.parse(saved) : { movies: [], shows: [], watched: [] };
    } catch (e) {
      return { movies: [], shows: [], watched: [] };
    }
  });

  // 2. Load View State (Are we on dashboard or welcome?)
  const [view, setView] = useState<ViewState>(() => {
    return (localStorage.getItem('moviebase_view') as ViewState) || 'welcome';
  });

  const [modal, setModal] = useState<ModalState>(null); 
  const [currentPick, setCurrentPick] = useState<MediaItem | null>(null);
  const [loadingPoster, setLoadingPoster] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  // 3. Load API Key
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('tmdb_api_key') || "");
  
  const [addForm, setAddForm] = useState({ title: '', type: 'movie', year: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE EFFECTS ---

  // Save DB whenever it changes
  useEffect(() => {
    localStorage.setItem('moviebase_db', JSON.stringify(db));
  }, [db]);

  // Save View whenever it changes
  useEffect(() => {
    localStorage.setItem('moviebase_view', view);
  }, [view]);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setIsInstalled(standalone);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      showToast('RandomMovie uygulama olarak yüklendi.');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  // Save API Key handled in handler, but good to ensure consistency
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('tmdb_api_key', key);
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClearData = () => {
    setDb({ movies: [], shows: [], watched: [] });
    setView('welcome');
    setModal(null);
    localStorage.removeItem('moviebase_db');
    localStorage.removeItem('moviebase_view');
    // We optionally keep the API key, or clear it too if desired. 
    // Usually users prefer keeping the key.
    showToast('Tüm veriler temizlendi.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      let data = { movies: [] as MediaItem[], shows: [] as MediaItem[] };
      const isJson = file.name.toLowerCase().endsWith('.json');
      
      data = isJson ? parseJSON(text) : parseCSV(text);

      if (data.movies.length === 0 && data.shows.length === 0) {
        showToast('Dosyada geçerli medya bulunamadı.', 'error');
        return;
      }

      setDb({ ...data, watched: [] });
      setView('dashboard');
      showToast(`${data.movies.length} Film, ${data.shows.length} Dizi Yüklendi`);
    };
    reader.readAsText(file);
  };

  const pickRandom = async (type: 'movie' | 'show') => {
    const list = type === 'movie' ? db.movies : db.shows;
    if (list.length === 0) return showToast('Liste boş!', 'error');
    
    const randomItem = list[Math.floor(Math.random() * list.length)];
    
    setModal('result');
    setLoadingPoster(true); 
    setCurrentPick(randomItem);

    if (!randomItem.img && randomItem.id && apiKey) {
        const enrichedItem = await fetchPoster(randomItem, apiKey);
        setCurrentPick(prev => {
          if (!prev) return null;
          return { ...prev, ...enrichedItem };
        });
    }
    setLoadingPoster(false);
  };

  const markAsWatched = () => {
    if (!currentPick) return;
    setDb(prev => ({
      ...prev,
      movies: currentPick.type === 'movie' ? prev.movies.filter(m => m.id !== currentPick.id) : prev.movies,
      shows: currentPick.type !== 'movie' ? prev.shows.filter(s => s.id !== currentPick.id) : prev.shows,
      watched: [...prev.watched, currentPick]
    }));
    setModal(null);
    showToast('Listeden kaldırıldı, izlenenlere eklendi.');
  };

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      setInstallPrompt(null);
      if (result.outcome === 'dismissed') showToast('Kurulum iptal edildi.', 'error');
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    showToast(
      isIOS
        ? 'Safari: Paylaş → Ana Ekrana Ekle'
        : 'Tarayıcı menüsünden “Uygulamayı yükle”yi seç.',
      'error'
    );
  };

  const handleManualAdd = () => {
      if(!addForm.title) return;

      const newItem: MediaItem = {
          id: `manual-${Date.now()}`,
          t: addForm.title,
          y: addForm.year ? parseInt(addForm.year) : 0,
          r: 0,
          u: '#',
          type: addForm.type as any,
          img: null
      };

      setDb(prev => ({
        ...prev,
        [addForm.type === 'movie' ? 'movies' : 'shows']: [...prev[addForm.type === 'movie' ? 'movies' : 'shows'], newItem]
      }));
      setModal(null);
      setAddForm({ title: '', type: 'movie', year: '' });
      showToast('Listeye Eklendi');
  }

  return (
    <div className="app-viewport font-sans flex flex-col items-center">
      
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.json" className="hidden" />

      <div className="w-full max-w-lg app-viewport flex flex-col px-5 sm:px-6 relative z-10 safe-shell">
        
        {/* Navbar */}
        <div className="flex justify-between items-center py-5 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="brand-mark w-11 h-11 rounded-[14px] flex items-center justify-center">
              <img src="/icon-192.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-black text-white tracking-tight text-xl block leading-none">RandomMovie</span>
              <span className="text-[10px] font-bold text-neutral-500 tracking-[0.2em] uppercase">Akşamın seçimi</span>
            </div>
          </div>
          
          {view === 'dashboard' && (
            <div className="flex gap-2 animate-fade-in">
              <button 
                onClick={() => setModal('settings')} 
                className="w-10 h-10 flex items-center justify-center bg-neutral-900/50 border border-neutral-800 backdrop-blur-md rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors relative" 
                title="Ayarlar"
              >
                <Settings size={20} />
                {!apiKey && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              </button>
              <button 
                onClick={() => setModal('add')} 
                className="w-10 h-10 flex items-center justify-center bg-neutral-900/50 border border-neutral-800 backdrop-blur-md rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors" 
                title="Ekle"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        {/* --- VIEWS --- */}
        {view === 'welcome' && (
          <Welcome 
            onFileUpload={handleFileUpload} 
            onSkip={() => setView('dashboard')} 
            hasApiKey={!!apiKey}
          />
        )}

        {view === 'dashboard' && (
          <div className="flex-1 flex flex-col gap-6 animate-slide-up pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="flex items-end justify-between gap-4 pt-2">
              <div>
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black tracking-[0.22em] uppercase">Kütüphanen hazır</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-[-0.04em] leading-none">Ne izliyoruz?</h1>
              </div>
              <span className="text-xs text-neutral-600 font-bold whitespace-nowrap">{db.movies.length + db.shows.length} seçenek</span>
            </div>
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="stat-card p-4 rounded-2xl text-center">
                <span className="block text-2xl font-bold text-white">{db.movies.length}</span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Film</span>
              </div>
              <div className="stat-card p-4 rounded-2xl text-center">
                <span className="block text-2xl font-bold text-white">{db.shows.length}</span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Dizi</span>
              </div>
              <div className="stat-card p-4 rounded-2xl text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 group-hover:w-full group-hover:opacity-10 transition-all duration-500" />
                <span className="block text-2xl font-bold text-white">{db.watched.length}</span>
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">İzlendi</span>
              </div>
            </div>

            <div className="h-px bg-neutral-800/50 w-full" />

            {/* Main Actions */}
            <div className="space-y-4">
              <ActionButton 
                title="FİLM GECESİ" 
                desc="Rastgele film seç" 
                icon={Film} 
                color="text-red-600" 
                onClick={() => pickRandom('movie')} 
              />
              <ActionButton 
                title="DİZİ MARATONU" 
                desc="Bir bölüm seç" 
                icon={Tv} 
                color="text-blue-600" 
                onClick={() => pickRandom('show')} 
              />
            </div>

            <div className="mt-auto pt-6 flex flex-col items-center gap-3">
               {!isInstalled && (
                 <button
                   onClick={() => void handleInstall()}
                   className="install-button w-full min-h-12 flex items-center justify-center gap-3 px-5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
                 >
                   <Download size={17} />
                   Uygulama olarak yükle
                 </button>
               )}
               <button 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center gap-2 text-xs font-bold text-neutral-500 bg-neutral-900/50 px-4 py-2 rounded-full hover:text-white hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-800"
               >
                  <RefreshCw size={12} />
                  LİSTEYİ GÜNCELLE
               </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      <Modal isOpen={modal === 'result'} onClose={() => setModal(null)} variant="immersive">
        {currentPick && (
          <ResultView 
            item={currentPick}
            loading={loadingPoster}
            onClose={() => setModal(null)}
            onMarkWatched={markAsWatched}
            hasApiKey={!!apiKey}
            onOpenSettings={() => { setModal('settings'); }}
            onShuffle={() => pickRandom(currentPick.type === 'movie' ? 'movie' : 'show')}
          />
        )}
      </Modal>

      <Modal isOpen={modal === 'settings'} onClose={() => setModal(null)}>
        <div className="p-6 safe-modal-bottom">
          <h3 className="text-lg font-bold text-white mb-6">Ayarlar</h3>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">TMDB API Anahtarı</label>
              <input 
                className="w-full bg-neutral-900 border border-neutral-800 p-3 rounded-xl text-white text-sm focus:border-red-600 outline-none transition-colors placeholder:text-neutral-700"
                placeholder="Buraya yapıştırın..."
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
              />
              <div className="flex items-start gap-2 mt-3">
                <ExternalLink size={12} className="text-blue-500 mt-0.5" />
                <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-400 hover:underline">
                  API Anahtarı Al (Ücretsiz)
                </a>
              </div>
            </div>
            
            <div className="pt-4 border-t border-neutral-800">
               <button 
                 onClick={handleClearData}
                 className="w-full py-3 bg-red-900/10 text-red-500 rounded-xl font-bold text-sm hover:bg-red-900/30 border border-red-900/20 transition-colors flex items-center justify-center gap-2"
               >
                 <AlertTriangle size={16} />
                 Verileri Temizle ve Çık
               </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modal === 'add'} onClose={() => setModal(null)}>
        <div className="p-6 space-y-4 safe-modal-bottom">
          <h3 className="text-lg font-bold text-white">Manuel Ekle</h3>
          <input 
            className="w-full bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-white outline-none focus:border-red-600"
            placeholder="Başlık (Örn: Inception)"
            value={addForm.title}
            onChange={e => setAddForm({...addForm, title: e.target.value})}
          />
          <div className="flex gap-2">
            <select 
              className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-white outline-none w-1/2"
              value={addForm.type}
              onChange={e => setAddForm({...addForm, type: e.target.value})}
            >
              <option value="movie">Film</option>
              <option value="show">Dizi</option>
            </select>
            <input 
              type="number"
              className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl text-white outline-none w-1/2"
              placeholder="Yıl"
              value={addForm.year}
              onChange={e => setAddForm({...addForm, year: e.target.value})}
            />
          </div>
          <button 
            onClick={handleManualAdd} 
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-neutral-200"
          >
            Kaydet
          </button>
        </div>
      </Modal>

      {/* TOAST */}
      {toast && (
        <div className={`toast-position fixed left-1/2 -translate-x-1/2 z-[60] bg-neutral-900 border border-neutral-800 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 max-w-[calc(100vw-2rem)]`}>
          {toast.type === 'error' ? <AlertTriangle size={16} className="text-red-500" /> : <Check size={16} className="text-green-500" />}
          <span className="text-sm font-bold">{toast.msg}</span>
        </div>
      )}

    </div>
  );
}
