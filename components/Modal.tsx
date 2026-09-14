import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'immersive';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, variant = 'default' }) => {
  if (!isOpen) return null;

  const isImmersive = variant === 'immersive';

  return (
    <div className="modal-viewport fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isImmersive ? 'bg-black' : ''}`}
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div 
        className={`
          relative w-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isImmersive 
            ? 'modal-immersive w-full animate-in zoom-in-95 fade-in'
            : 'modal-sheet max-w-md mx-4 bg-[#121212] border border-neutral-800 rounded-3xl shadow-2xl p-0 animate-in slide-in-from-bottom-8 fade-in'
          }
        `}
      >
        {children}
        
        {!isImmersive && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-neutral-800/50 rounded-full text-white/50 hover:text-white hover:bg-neutral-800 transition-colors z-20"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
