import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
  color: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ icon: Icon, title, desc, onClick, color }) => (
  <button 
    onClick={onClick} 
    className="group relative w-full h-40 bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/60 rounded-[2rem] overflow-hidden hover:border-neutral-700 transition-all duration-300 hover:scale-[1.02] active:scale-95 text-left shadow-2xl hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]"
  >
    {/* Background Icon Blob */}
    <div className={`absolute -right-8 -top-8 p-4 opacity-[0.05] group-hover:opacity-15 transition-opacity duration-500 transform group-hover:scale-125 group-hover:rotate-12 ${color}`}>
      <Icon size={200} />
    </div>

    {/* Gradient Glow */}
    <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-${color.split('-')[1]}-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

    <div className="absolute inset-0 p-8 flex flex-col justify-center relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-neutral-950/80 border border-neutral-800 mb-4 ${color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
      <p className="text-xs text-neutral-500 font-bold tracking-widest uppercase mt-2 group-hover:text-neutral-400 transition-colors">{desc}</p>
    </div>
  </button>
);