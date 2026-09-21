'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Flame,
  BookmarkCheck,
  User,
  ArrowLeft,
  Loader2,
  Sparkles,
  Disc,
} from 'lucide-react';
import Link from 'next/link';
import SfxToggle from '@/components/SfxToggle';
import { sfx } from '@/lib/sfx';

interface RankedAlbum {
  albumId: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  releaseYear: string;
  averageRating: number;
  reviewsCount: number;
  compendiumCount: number;
}

interface RankedOperative {
  id: string;
  name: string | null;
  image: string | null;
  reviewsCount: number;
}

export default function RankingsPage() {
  const [topRated, setTopRated] = useState<RankedAlbum[]>([]);
  const [mostReviewed, setMostReviewed] = useState<RankedAlbum[]>([]);
  const [mostSaved, setMostSaved] = useState<RankedAlbum[]>([]);
  const [topOperatives, setTopOperatives] = useState<RankedOperative[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState<'rated' | 'popular' | 'compendium' | 'operatives'>('rated');

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/rankings');
        if (!res.ok) return;

        const data = await res.json();
        setTopRated(data.topRated || []);
        setMostReviewed(data.mostReviewed || []);
        setMostSaved(data.mostSaved || []);
        setTopOperatives(data.topOperatives || []);
      } catch (err) {
        console.error('Erro ao carregar rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-persona-dark text-persona-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-persona-cyan animate-spin mb-4" />
        <p className="font-mono text-xs text-persona-cyan tracking-widest uppercase">
          A PROCESSAR ESTATÍSTICAS GLOBAIS...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden p-6 md:p-12">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-persona-blue/20 blur-[140px] -z-10 rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-persona-cyan/10 blur-[160px] -z-10 rounded-full" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b-2 border-persona-cyan/30 pb-4">
          <Link
            href="/"
            onMouseEnter={() => sfx.playHover()}
            onClick={() => sfx.playClick()}
            className="flex items-center gap-2 bg-persona-blue/40 border border-persona-cyan px-4 py-1.5 -skew-x-12 text-xs font-mono text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 skew-x-12" />
            <span className="skew-x-12 font-bold uppercase">VOLTAR À HOMEPAGE</span>
          </Link>
          <SfxToggle />
        </div>

        {/* Título Principal */}
        <div className="bg-persona-dark/90 border-2 border-persona-cyan p-6 -skew-x-3 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
          <div className="skew-x-3 flex items-center gap-4">
            <div className="p-3 bg-persona-cyan text-persona-dark -skew-x-12">
              <Trophy className="w-8 h-8 skew-x-12" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2.5 py-0.5 font-black italic text-[10px] -skew-x-12 uppercase mb-1">
                <Sparkles className="w-3 h-3 skew-x-12" /> GLOBAL LEADERBOARDS
              </div>
              <h1 className="text-3xl font-black italic uppercase text-white tracking-wider">
                VELVET <span className="text-persona-cyan">RANKINGS</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Abas de Categoria */}
        <div className="flex flex-wrap gap-3">
          <button
            onMouseEnter={() => sfx.playHover()}
            onClick={() => { sfx.playClick(); setActiveCategory('rated'); }}
            className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${
              activeCategory === 'rated'
                ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'
            }`}
          >
            <Star className="w-4 h-4 skew-x-12" />
            <span className="skew-x-12">TOP RATED ({topRated.length})</span>
          </button>

          <button
            onMouseEnter={() => sfx.playHover()}
            onClick={() => { sfx.playClick(); setActiveCategory('popular'); }}
            className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${
              activeCategory === 'popular'
                ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'
            }`}
          >
            <Flame className="w-4 h-4 skew-x-12" />
            <span className="skew-x-12">MAIS POPULARES ({mostReviewed.length})</span>
          </button>

          <button
            onMouseEnter={() => sfx.playHover()}
            onClick={() => { sfx.playClick(); setActiveCategory('compendium'); }}
            className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${
              activeCategory === 'compendium'
                ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 skew-x-12" />
            <span className="skew-x-12">MOST SAVED IN COMPENDIUM ({mostSaved.length})</span>
          </button>

          <button
            onMouseEnter={() => sfx.playHover()}
            onClick={() => { sfx.playClick(); setActiveCategory('operatives'); }}
            className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${
              activeCategory === 'operatives'
                ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
                : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'
            }`}
          >
            <User className="w-4 h-4 skew-x-12" />
            <span className="skew-x-12">TOP OPERATIVOS ({topOperatives.length})</span>
          </button>
        </div>

        {/* Tabela de Resultados */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-6 -skew-x-3 space-y-3"
        >
          <div className="skew-x-3 space-y-3">
            {activeCategory === 'operatives' ? (
              // Tabela de Operativos
              topOperatives.length === 0 ? (
                <p className="font-mono text-xs text-persona-cyan/60 uppercase py-8 text-center">
                  SEM OPERATIVOS REGISTADOS AINDA.
                </p>
              ) : (
                topOperatives.map((op, index) => (
                  <Link
                    key={op.id}
                    href={`/profile/${op.id}`}
                    onMouseEnter={() => sfx.playHover()}
                    onClick={() => sfx.playClick()}
                    className="bg-persona-dark/90 border border-persona-cyan/40 p-4 flex items-center justify-between gap-4 hover:border-persona-cyan transition-all group block cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Posição no Ranking */}
                      <span className={`font-black italic text-xl w-8 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-persona-cyan/50'}`}>
                        #{index + 1}
                      </span>

                      {/* Avatar */}
                      <div className="w-12 h-12 border border-persona-cyan bg-persona-blue/40 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                        {op.image ? (
                          <img src={op.image} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-persona-cyan" />
                        )}
                      </div>

                      {/* Nome */}
                      <p className="font-black italic text-base text-persona-white uppercase group-hover:text-persona-cyan transition-colors truncate">
                        {op.name || 'OPERATIVE'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-persona-blue/40 border border-persona-cyan/40 px-3 py-1 -skew-x-12 shrink-0">
                      <Flame className="w-4 h-4 text-persona-cyan skew-x-12" />
                      <span className="font-mono text-xs font-bold text-persona-cyan skew-x-12">
                        {op.reviewsCount} REVIEWS
                      </span>
                    </div>
                  </Link>
                ))
              )
            ) : (
              // Tabela de Álbuns (Rated, Popular, Compendium)
              (() => {
                const list =
                  activeCategory === 'rated'
                    ? topRated
                    : activeCategory === 'popular'
                    ? mostReviewed
                    : mostSaved;

                if (list.length === 0) {
                  return (
                    <p className="font-mono text-xs text-persona-cyan/60 uppercase py-8 text-center">
                      SEM DADOS DISPONÍVEIS NESTA CATEGORIA.
                    </p>
                  );
                }

                return list.map((album, index) => (
                  <Link
                    key={album.albumId}
                    href={`/album/${album.albumId}`}
                    onMouseEnter={() => sfx.playHover()}
                    onClick={() => sfx.playClick()}
                    className="bg-persona-dark/90 border border-persona-cyan/40 p-4 flex items-center justify-between gap-4 hover:border-persona-cyan transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Posição no Ranking */}
                      <span className={`font-black italic text-xl w-8 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-persona-cyan/50'}`}>
                        #{index + 1}
                      </span>

                      {/* Capa */}
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={album.albumTitle}
                          className="w-14 h-14 object-cover border border-persona-cyan shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-persona-blue border border-persona-cyan flex items-center justify-center shrink-0">
                          <Disc className="w-6 h-6 text-persona-cyan" />
                        </div>
                      )}

                      {/* Detalhes do Álbum */}
                      <div className="min-w-0">
                        <p className="font-black italic text-base text-persona-cyan uppercase group-hover:underline truncate">
                          {album.albumTitle}
                        </p>
                        <p className="text-xs font-mono text-persona-white/60 uppercase truncate">
                          {album.artistName} ({album.releaseYear})
                        </p>
                      </div>
                    </div>

                    {/* Métrica / Badge */}
                    <div className="flex items-center gap-3 shrink-0">
                      {activeCategory === 'rated' && (
                        <div className="flex items-center gap-1.5 bg-persona-blue/60 border border-persona-cyan/50 px-3 py-1.5 -skew-x-12">
                          <Star className="w-4 h-4 text-persona-cyan fill-persona-cyan skew-x-12" />
                          <span className="font-mono text-sm font-bold text-persona-cyan skew-x-12">
                            {album.averageRating} / 5.0
                          </span>
                          <span className="text-[10px] font-mono text-persona-white/50 skew-x-12">
                            ({album.reviewsCount})
                          </span>
                        </div>
                      )}

                      {activeCategory === 'popular' && (
                        <div className="flex items-center gap-1.5 bg-persona-blue/60 border border-persona-cyan/50 px-3 py-1.5 -skew-x-12">
                          <Flame className="w-4 h-4 text-persona-cyan skew-x-12" />
                          <span className="font-mono text-sm font-bold text-persona-cyan skew-x-12">
                            {album.reviewsCount} REVIEWS
                          </span>
                        </div>
                      )}

                      {activeCategory === 'compendium' && (
                        <div className="flex items-center gap-1.5 bg-persona-blue/60 border border-persona-cyan/50 px-3 py-1.5 -skew-x-12">
                          <BookmarkCheck className="w-4 h-4 text-persona-cyan skew-x-12" />
                          <span className="font-mono text-sm font-bold text-persona-cyan skew-x-12">
                            {album.compendiumCount} SAVES
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ));
              })()
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}