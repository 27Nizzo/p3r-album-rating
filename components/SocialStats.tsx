"use client";

import { Sparkles, Flame, Zap, Compass, Info } from "lucide-react";

interface SocialStatsProps {
  reviewsCount: number;
  totalLikes: number;
  compendiumCount: number;
  uniqueArtistsCount: number;
}

export default function SocialStats({
  reviewsCount,
  totalLikes,
  compendiumCount,
  uniqueArtistsCount,
}: SocialStatsProps) {
  const criticismThresholds = [0, 5, 15, 30, 50];
  const influenceThresholds = [0, 10, 25, 50, 100];
  const explorationThresholds = [0, 5, 15, 30, 50];

  const getStatData = (value: number, thresholds: number[], titles: string[]) => {
    let rank = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i]) {
        rank = i + 1;
        break;
      }
    }
    const isMax = rank >= 5;
    const progress = isMax
      ? 100
      : ((value - thresholds[rank - 1]) / (thresholds[rank] - thresholds[rank - 1])) * 100;

    return {
      rank: isMax ? "MAX" : rank,
      title: titles[isMax ? 4 : rank - 1],
      progress: Math.min(100, Math.max(0, progress)),
      raw: value,
    };
  };

  const criticism = getStatData(reviewsCount, criticismThresholds, [
    "Casual Listener",
    "Attentive Ear",
    "Music Reviewer",
    "Sharp Analyst",
    "Velvet Scholar",
  ]);

  const influence = getStatData(totalLikes, influenceThresholds, [
    "Quiet Operative",
    "Noticed Voice",
    "Trendsetter",
    "Crowd Favorite",
    "Velvet Icon",
  ]);

  const explorationScore = compendiumCount * 2 + uniqueArtistsCount;
  const exploration = getStatData(explorationScore, explorationThresholds, [
    "Genre Tourist",
    "Curious Ear",
    "Deep Diver",
    "Crate Digger",
    "Sonic Pioneer",
  ]);

  return (
    <div className="bg-persona-dark/95 border-2 border-persona-cyan p-5 sm:p-6 -skew-x-3 shadow-[0_0_35px_rgba(0,229,255,0.25)] relative overflow-hidden">
      <div className="skew-x-3 space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b-2 border-persona-cyan/40 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-persona-cyan animate-pulse" />
            <h2 className="text-xl font-black italic uppercase tracking-wider text-persona-white">
              Velvet <span className="text-persona-cyan">STATS</span>
            </h2>
          </div>
          <span className="text-[11px] font-mono text-persona-cyan/70 uppercase tracking-widest">
            P3R // VELVET SYSTEM
          </span>
        </div>

        {/* Contentor do Diagrama em Tríade */}
        <div className="relative w-full max-w-[420px] h-[310px] sm:h-[340px] mx-auto bg-persona-blue/10 border border-persona-cyan/20 rounded-xl flex items-center justify-center overflow-hidden p-2">

          {/* CÍRCULO 1: INFLUENCE (Topo) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-cyan-500/20 border-2 border-persona-cyan/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center shadow-[0_0_25px_rgba(0,229,255,0.35)] z-20 transition-all duration-300 hover:scale-105 group cursor-pointer">
            {/* Overlay Explicativo em Hover */}
            <div className="absolute inset-0 bg-persona-dark/95 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-4 text-center z-40 border-2 border-persona-cyan">
              <Info className="w-4 h-4 text-persona-cyan mb-1" />
              <p className="text-[10px] font-mono text-persona-cyan font-bold uppercase mb-0.5">INFLUENCE</p>
              <p className="text-[9px] font-mono text-persona-white/90 leading-tight">
                Mede a tua relevância e popularidade na comunidade através dos likes acumulados nas tuas críticas.
              </p>
            </div>

            <div className="absolute inset-1.5 rounded-full border border-persona-cyan/30 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-dashed border-persona-cyan/20 pointer-events-none" />

            <div className="text-persona-cyan font-mono text-[9px] sm:text-[10px] tracking-widest uppercase flex items-center gap-1 font-bold z-10">
              <Zap className="w-3 h-3" /> INFLUENCE
            </div>

            <div className="text-4xl sm:text-5xl font-black italic text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.8)] my-0.5 z-10">
              {influence.rank}
            </div>

            <span className="text-[9px] font-mono text-persona-white/70 z-10">{influence.raw} likes</span>

            <div className="absolute -bottom-1 bg-persona-dark border-2 border-persona-cyan px-2.5 py-0.5 -skew-x-12 shadow-[0_0_10px_rgba(0,229,255,0.5)] z-30 group-hover:bg-persona-cyan transition-colors">
              <span className="text-[10px] font-mono text-persona-cyan group-hover:text-persona-dark uppercase font-black skew-x-12 block truncate max-w-[120px]">
                {influence.title}
              </span>
            </div>
          </div>

          {/* CÍRCULO 2: EXPLORATION (Baixo Esquerda) */}
          <div className="absolute bottom-2 left-1 sm:left-3 w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-blue-600/20 border-2 border-persona-cyan/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center shadow-[0_0_25px_rgba(0,150,255,0.35)] z-10 transition-all duration-300 hover:scale-105 group cursor-pointer">
            {/* Overlay Explicativo em Hover */}
            <div className="absolute inset-0 bg-persona-dark/95 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-4 text-center z-40 border-2 border-persona-cyan">
              <Info className="w-4 h-4 text-persona-cyan mb-1" />
              <p className="text-[10px] font-mono text-persona-cyan font-bold uppercase mb-0.5">EXPLORATION</p>
              <p className="text-[9px] font-mono text-persona-white/90 leading-tight">
                Mede a tua biblioteca musical com base nos álbuns no Compendium e variedade de artistas explorados.
              </p>
            </div>

            <div className="absolute inset-1.5 rounded-full border border-persona-cyan/30 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-dashed border-persona-cyan/20 pointer-events-none" />

            <div className="text-persona-cyan font-mono text-[9px] sm:text-[10px] tracking-widest uppercase flex items-center gap-1 font-bold z-10">
              <Compass className="w-3 h-3" /> EXPLORATION
            </div>

            <div className="text-4xl sm:text-5xl font-black italic text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.8)] my-0.5 z-10">
              {exploration.rank}
            </div>

            <span className="text-[9px] font-mono text-persona-white/70 z-10">{exploration.raw} pts</span>

            <div className="absolute -bottom-1 bg-persona-dark border-2 border-persona-cyan px-2.5 py-0.5 -skew-x-12 shadow-[0_0_10px_rgba(0,229,255,0.5)] z-30 group-hover:bg-persona-cyan transition-colors">
              <span className="text-[10px] font-mono text-persona-cyan group-hover:text-persona-dark uppercase font-black skew-x-12 block truncate max-w-[110px]">
                {exploration.title}
              </span>
            </div>
          </div>

          {/* CÍRCULO 3: CRITICISM (Baixo Direita) */}
          <div className="absolute bottom-2 right-1 sm:right-3 w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-indigo-600/20 border-2 border-persona-cyan/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center shadow-[0_0_25px_rgba(100,100,255,0.35)] z-10 transition-all duration-300 hover:scale-105 group cursor-pointer">
            {/* Overlay Explicativo em Hover */}
            <div className="absolute inset-0 bg-persona-dark/95 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-4 text-center z-40 border-2 border-persona-cyan">
              <Info className="w-4 h-4 text-persona-cyan mb-1" />
              <p className="text-[10px] font-mono text-persona-cyan font-bold uppercase mb-0.5">CRITICISM</p>
              <p className="text-[9px] font-mono text-persona-white/90 leading-tight">
                Mede o teu rigor e constância analítica com base no número total de análises submetidas.
              </p>
            </div>

            <div className="absolute inset-1.5 rounded-full border border-persona-cyan/30 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-dashed border-persona-cyan/20 pointer-events-none" />

            <div className="text-persona-cyan font-mono text-[9px] sm:text-[10px] tracking-widest uppercase flex items-center gap-1 font-bold z-10">
              <Flame className="w-3 h-3" /> CRITICISM
            </div>

            <div className="text-4xl sm:text-5xl font-black italic text-white drop-shadow-[0_0_12px_rgba(0,229,255,0.8)] my-0.5 z-10">
              {criticism.rank}
            </div>

            <span className="text-[9px] font-mono text-persona-white/70 z-10">{criticism.raw} reviews</span>

            <div className="absolute -bottom-1 bg-persona-dark border-2 border-persona-cyan px-2.5 py-0.5 -skew-x-12 shadow-[0_0_10px_rgba(0,229,255,0.5)] z-30 group-hover:bg-persona-cyan transition-colors">
              <span className="text-[10px] font-mono text-persona-cyan group-hover:text-persona-dark uppercase font-black skew-x-12 block truncate max-w-[110px]">
                {criticism.title}
              </span>
            </div>
          </div>

        </div>

        {/* Barras de Progresso Inferiores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { label: "CRITICISM", data: criticism, icon: Flame },
            { label: "INFLUENCE", data: influence, icon: Zap },
            { label: "EXPLORATION", data: exploration, icon: Compass },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-persona-dark/90 border border-persona-cyan/40 p-3 -skew-x-6 hover:border-persona-cyan transition-colors">
                <div className="skew-x-6 flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-persona-cyan font-black uppercase flex items-center gap-1">
                    <Icon className="w-3 h-3" /> {item.label}
                  </span>
                  <span className="text-persona-white font-mono text-[11px] font-bold">
                    {item.data.progress.toFixed(0)}%
                  </span>
                </div>
                <div className="skew-x-6 w-full bg-persona-blue/40 h-2 border border-persona-cyan/30 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-persona-blue via-persona-cyan to-white h-full transition-all duration-500"
                    style={{ width: `${item.data.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}