"use client";

import { Sparkles, Flame, Zap, Compass } from "lucide-react";

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
    <div className="bg-persona-dark/95 border-2 border-persona-cyan p-6 -skew-x-3 shadow-[0_0_30px_rgba(0,229,255,0.25)] relative overflow-hidden">
      <div className="skew-x-3 space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b-2 border-persona-cyan/40 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-persona-cyan animate-pulse" />
            <h2 className="text-xl font-black italic uppercase tracking-wider text-persona-white">
              Velvet <span className="text-persona-cyan">STATS</span>
            </h2>
          </div>
          <span className="text-xs font-mono text-persona-cyan/70 uppercase">
            P3R // VELVET SYSTEM
          </span>
        </div>

        {/* Contentor Compacto (Fixa o aspeto mobile em qualquer ecrã) */}
        <div className="relative w-full py-4 bg-persona-blue/10 border border-persona-cyan/30 flex flex-col items-center justify-center">
          
          {/* Círculo de Cima: INFLUENCE */}
          <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-cyan-500/25 border-2 border-persona-cyan/75 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center shadow-[0_0_25px_rgba(0,229,255,0.3)] z-20 transition-transform hover:scale-105">
            <div className="text-persona-cyan font-mono text-[10px] tracking-widest uppercase flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3" /> INFLUENCE
            </div>
            <div className="text-4xl font-black italic text-white drop-shadow-lg my-0.5">
              {influence.rank}
            </div>
            <div className="bg-persona-dark/90 border border-persona-cyan/60 px-2 py-0.5 -skew-x-12">
              <span className="text-[10px] font-mono text-persona-cyan uppercase font-bold skew-x-12 block truncate max-w-[130px]">
                {influence.title}
              </span>
            </div>
            <span className="text-[9px] font-mono text-persona-white/70 mt-1">{influence.raw} likes</span>
          </div>

          {/* Linha de Baixo: EXPLORATION e CRITICISM (Com margem negativa subtil para encostar à pílula de cima) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 -mt-6 z-15">
            
            {/* Círculo Esquerda: EXPLORATION */}
            <div className="w-42 h-42 sm:w-48 sm:h-48 rounded-full bg-blue-600/25 border-2 border-persona-cyan/75 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center shadow-[0_0_25px_rgba(0,150,255,0.3)] transition-transform hover:scale-105">
              <div className="text-persona-cyan font-mono text-[10px] tracking-widest uppercase flex items-center gap-1 font-bold">
                <Compass className="w-3 h-3" /> EXPLORATION
              </div>
              <div className="text-4xl font-black italic text-white drop-shadow-lg my-0.5">
                {exploration.rank}
              </div>
              <div className="bg-persona-dark/90 border border-persona-cyan/60 px-2 py-0.5 -skew-x-12">
                <span className="text-[10px] font-mono text-persona-cyan uppercase font-bold skew-x-12 block truncate max-w-[120px]">
                  {exploration.title}
                </span>
              </div>
              <span className="text-[9px] font-mono text-persona-white/70 mt-1">{exploration.raw} pts</span>
            </div>

            {/* Círculo Direita: CRITICISM */}
            <div className="w-42 h-42 sm:w-48 sm:h-48 rounded-full bg-indigo-600/25 border-2 border-persona-cyan/75 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center shadow-[0_0_25px_rgba(100,100,255,0.3)] transition-transform hover:scale-105">
              <div className="text-persona-cyan font-mono text-[10px] tracking-widest uppercase flex items-center gap-1 font-bold">
                <Flame className="w-3 h-3" /> CRITICISM
              </div>
              <div className="text-4xl font-black italic text-white drop-shadow-lg my-0.5">
                {criticism.rank}
              </div>
              <div className="bg-persona-dark/90 border border-persona-cyan/60 px-2 py-0.5 -skew-x-12">
                <span className="text-[10px] font-mono text-persona-cyan uppercase font-bold skew-x-12 block truncate max-w-[120px]">
                  {criticism.title}
                </span>
              </div>
              <span className="text-[9px] font-mono text-persona-white/70 mt-1">{criticism.raw} reviews</span>
            </div>

          </div>

        </div>

        {/* Barras de Progresso Inferiores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { label: "CRITICISM", data: criticism },
            { label: "INFLUENCE", data: influence },
            { label: "EXPLORATION", data: exploration },
          ].map((item, idx) => (
            <div key={idx} className="bg-persona-dark/80 border border-persona-cyan/40 p-3 -skew-x-6">
              <div className="skew-x-6 flex justify-between text-xs font-mono mb-1.5">
                <span className="text-persona-cyan font-bold uppercase">{item.label}</span>
                <span className="text-persona-white font-bold">{item.data.progress.toFixed(0)}%</span>
              </div>
              <div className="skew-x-6 w-full bg-persona-blue/40 h-2 border border-persona-cyan/30 overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-persona-blue to-persona-cyan h-full transition-all duration-500"
                  style={{ width: `${item.data.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}