'use client';

import { Sparkles, Star, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface DossierCardProps {
  userName: string;
  userEmail: string;
  userImage?: string | null;
  totalReviews: number;
  averageRating: string;
  topAlbumTitle?: string;
  topAlbumRating?: number;
}

export default function DossierCard({
  userName,
  userEmail,
  userImage,
  totalReviews,
  averageRating,
  topAlbumTitle,
  topAlbumRating,
}: DossierCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative bg-gradient-to-br from-persona-dark via-persona-blue/40 to-persona-dark border-2 border-persona-cyan p-6 -skew-x-6 shadow-[0_0_35px_rgba(0,229,255,0.3)] overflow-hidden"
    >
      {/* Marca d'água geométrica */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 border-4 border-persona-cyan/10 rotate-45 pointer-events-none" />
      <div className="absolute top-2 right-4 text-[9px] font-mono text-persona-cyan/40 tracking-widest skew-x-6">
        S.E.E.S. OPERATIVE ID // 03-RELOAD
      </div>

      <div className="skew-x-6 space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-persona-cyan/40 pb-2">
          <ShieldCheck className="w-5 h-5 text-persona-cyan" />
          <span className="font-black italic text-sm tracking-wider uppercase text-persona-cyan">
            VELVET OPERATIVE DOSSIER
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border-2 border-persona-cyan bg-persona-blue/60 overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.4)]">
            {userImage ? (
              <img src={userImage} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-persona-cyan" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-xl font-black italic uppercase text-white truncate">
              {userName}
            </h3>
            <p className="text-xs font-mono text-persona-cyan/80 truncate">{userEmail}</p>
            <div className="inline-flex items-center gap-1 bg-persona-cyan text-persona-dark px-2 py-0.5 font-mono text-[9px] font-bold uppercase mt-1">
              <Sparkles className="w-3 h-3" /> ACTIVE OPERATIVE
            </div>
          </div>
        </div>

        {/* Grelha de Estatísticas do Cartão */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-persona-cyan/20">
          <div className="bg-persona-dark/80 p-2 border border-persona-cyan/30 text-center">
            <span className="text-[9px] font-mono text-persona-cyan/60 uppercase block">REVIEWS</span>
            <span className="text-lg font-black italic text-white">{totalReviews}</span>
          </div>
          <div className="bg-persona-dark/80 p-2 border border-persona-cyan/30 text-center">
            <span className="text-[9px] font-mono text-persona-cyan/60 uppercase block">AVG RATING</span>
            <span className="text-lg font-black italic text-persona-cyan">{averageRating}</span>
          </div>
          <div className="bg-persona-dark/80 p-2 border border-persona-cyan/30 text-center min-w-0">
            <span className="text-[9px] font-mono text-persona-cyan/60 uppercase block">FAV</span>
            <span className="text-xs font-black italic text-white truncate block">
              {topAlbumTitle || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}