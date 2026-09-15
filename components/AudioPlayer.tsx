'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Music, Disc } from 'lucide-react';

interface AudioPlayerProps {
  currentTrack: {
    id: string;
    name: string;
    artist: string;
    coverUrl: string;
    previewUrl: string | null;
  } | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

export default function AudioPlayer({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onClose,
}: AudioPlayerProps) {
  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
      >
        <div className="bg-persona-dark/95 border-2 border-persona-cyan p-3 shadow-[0_0_30px_rgba(0,229,255,0.4)] backdrop-blur-md -skew-x-6 flex items-center justify-between gap-4">
          
          {/* Capa e Informação da Faixa */}
          <div className="skew-x-6 flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 border border-persona-cyan bg-persona-blue/40 flex items-center justify-center shrink-0 overflow-hidden relative group">
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc className="w-6 h-6 text-persona-cyan animate-spin" />
              )}
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[9px] font-mono text-persona-cyan uppercase tracking-wider">
                <Music className="w-3 h-3 animate-pulse" /> NOW PLAYING PREVIEW
              </div>
              <h4 className="text-sm font-black italic uppercase text-white truncate">
                {currentTrack.name}
              </h4>
              <p className="text-xs font-mono text-persona-white/60 truncate uppercase">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Equalizador / Visualizador Neon */}
          <div className="skew-x-6 hidden sm:flex items-center gap-1 h-6 px-4 border-x border-persona-cyan/30">
            {[40, 80, 30, 90, 60, 100, 50, 70].map((height, i) => (
              <motion.div
                key={i}
                animate={{
                  height: isPlaying ? [`${height}%`, '20%', `${height}%`] : '15%',
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6 + i * 0.1,
                  ease: 'easeInOut',
                }}
                className="w-1 bg-persona-cyan shadow-[0_0_8px_rgba(0,229,255,0.8)]"
              />
            ))}
          </div>

          {/* Controlos: Play/Pause e Fechar */}
          <div className="skew-x-6 flex items-center gap-3 shrink-0">
            <button
              onClick={onTogglePlay}
              className="p-2.5 bg-persona-cyan text-persona-dark hover:bg-white transition-all cursor-pointer -skew-x-6 shadow-[0_0_15px_rgba(0,229,255,0.6)]"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              <div className="skew-x-6">
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-persona-dark" />
                ) : (
                  <Play className="w-5 h-5 fill-persona-dark" />
                )}
              </div>
            </button>

            <button
              onClick={onClose}
              className="text-persona-cyan/70 hover:text-white transition-colors p-1 cursor-pointer"
              title="Fechar Leitor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}