'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, Palette, X, Sparkles, Check } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { sfx } from '@/lib/sfx';
import { useTheme, ThemeOption } from '@/lib/themeContext';

export default function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleThemeChange = (newTheme: ThemeOption) => {
    sfx.playClick();
    setTheme(newTheme);
  };

  const handleLogout = () => {
    sfx.playClick();
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative inline-block z-50" ref={dropdownRef}>
      {/* Botão de Engrenagem Independente */}
      <button
        type="button"
        onClick={() => {
          sfx.playClick();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => sfx.playHover()}
        className="bg-persona-blue/20 border border-persona-cyan/40 hover:border-persona-cyan text-persona-cyan hover:text-white p-2 -skew-x-12 transition-all cursor-pointer flex items-center justify-center h-[35px] w-[38px]"
        title="Definições do Operativo"
      >
        <Settings className="w-4 h-4 skew-x-12 transition-transform duration-300 hover:rotate-90" />
      </button>

      {/* Menu Dropdown / Popover Corrigido (z-[100] e posicionamento no topo do ecrã em mobile) */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-4 sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-80 bg-persona-dark/95 backdrop-blur-md border-2 border-persona-cyan shadow-[0_10px_40px_rgba(0,0,0,0.95)] z-[100] p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-persona-cyan/30 pb-2">
            <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2 py-0.5 font-black italic text-[10px] -skew-x-12 uppercase">
              <Sparkles className="w-3 h-3 skew-x-12" /> CONFIGURAÇÕES
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-persona-cyan hover:text-white transition-colors cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Opção 1: Esquema de Cores */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono text-persona-cyan/80 uppercase font-bold">
              <Palette className="w-4 h-4" /> ESQUEMA DE CORES
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Tema Blue */}
              <button
                type="button"
                onClick={() => handleThemeChange('blue')}
                onMouseEnter={() => sfx.playHover()}
                className={`p-2 border text-[10px] font-black italic uppercase -skew-x-12 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  theme === 'blue'
                    ? 'border-persona-cyan bg-persona-cyan/20 text-persona-cyan shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                    : 'border-persona-cyan/30 text-persona-white/60 hover:border-persona-cyan'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#00e5ff] border border-white skew-x-12 flex items-center justify-center">
                  {theme === 'blue' && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="skew-x-12">BLUE P3R</span>
              </button>

              {/* Tema Green */}
              <button
                type="button"
                onClick={() => handleThemeChange('green')}
                onMouseEnter={() => sfx.playHover()}
                className={`p-2 border text-[10px] font-black italic uppercase -skew-x-12 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  theme === 'green'
                    ? 'border-[#00ff88] bg-[#00ff88]/20 text-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.4)]'
                    : 'border-persona-cyan/30 text-persona-white/60 hover:border-[#00ff88]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#00ff88] border border-white skew-x-12 flex items-center justify-center">
                  {theme === 'green' && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="skew-x-12">EMERALD</span>
              </button>

              {/* Tema Red */}
              <button
                type="button"
                onClick={() => handleThemeChange('red')}
                onMouseEnter={() => sfx.playHover()}
                className={`p-2 border text-[10px] font-black italic uppercase -skew-x-12 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  theme === 'red'
                    ? 'border-[#ff003c] bg-[#ff003c]/20 text-[#ff003c] shadow-[0_0_10px_rgba(255,0,60,0.4)]'
                    : 'border-persona-cyan/30 text-persona-white/60 hover:border-[#ff003c]'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#ff003c] border border-white skew-x-12 flex items-center justify-center">
                  {theme === 'red' && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="skew-x-12">CRIMSON</span>
              </button>
            </div>
          </div>

          <hr className="border-persona-cyan/20" />

          {/* Opção 2: Terminar Sessão */}
          <button
            type="button"
            onClick={handleLogout}
            onMouseEnter={() => sfx.playHover()}
            className="w-full bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all py-2 -skew-x-12 font-black italic text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          >
            <LogOut className="w-4 h-4 skew-x-12" />
            <span className="skew-x-12">TERMINAR SESSÃO</span>
          </button>
        </div>
      )}
    </div>
  );
}