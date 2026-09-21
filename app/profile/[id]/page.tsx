'use client';

import { useState, useEffect, use } from 'react';
import {
  User,
  Star,
  Loader2,
  Sparkles,
  ArrowLeft,
  Flame,
  Award,
  BarChart3,
  BookmarkCheck,
  Disc,
} from 'lucide-react';
import Link from 'next/link';
import SfxToggle from '@/components/SfxToggle';
import { sfx } from '@/lib/sfx';
import ExpandableText from '@/components/ExpandableText';
import ShareButton from '@/components/ShareButton';

interface Review {
  id: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Favorite {
  id: string;
  albumId: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  releaseYear: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  image: string | null;
  reviews: Review[];
  favorites: Favorite[];
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'compendium'>('reviews');

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user/${id}`);
        if (!res.ok) return;

        const text = await res.text();
        if (!text || text.trim().startsWith('<')) return;

        const data = JSON.parse(text);
        if (data.user) setProfile(data.user);
      } catch (err) {
        console.error('Erro ao carregar perfil público:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-persona-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-persona-cyan animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-persona-dark text-persona-white flex flex-col items-center justify-center gap-4">
        <p className="font-mono text-sm text-persona-cyan">OPERATIVO NÃO ENCONTRADO NA BASE DE DADOS.</p>
        <Link
          href="/"
          className="bg-persona-cyan text-persona-dark font-black px-4 py-2 -skew-x-12 uppercase italic"
        >
          Homepage
        </Link>
      </div>
    );
  }

  const userReviews = profile.reviews || [];
  const favorites = profile.favorites || [];

  const totalReviews = userReviews.length;

  const topAlbum =
    userReviews.length > 0
      ? [...userReviews].sort((a, b) => b.rating - a.rating)[0]
      : null;

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden p-6 md:p-12">
      {/* Cabeçalho de Navegação e Partilha Corrigido */}
      <div className="flex justify-between items-center border-b-2 border-persona-cyan/30 pb-4 mb-8">
        <Link
          href="/"
          onMouseEnter={() => sfx.playHover()}
          onClick={() => sfx.playClick()}
          className="flex items-center gap-2 bg-persona-blue/40 border border-persona-cyan px-4 py-1.5 -skew-x-12 text-xs font-mono text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 skew-x-12" />
          <span className="skew-x-12 font-bold uppercase">HOMEPAGE</span>
        </Link>

        <div className="flex items-center gap-3">
          <ShareButton
            title={profile.name || 'Operativo'}
            text={`Confere o perfil e as análises musicais do operativo ${profile.name || 'Operativo'} no Velvet Records!`}
          />
          <SfxToggle />
        </div>
      </div>

      {/* Cabeçalho do Perfil Público */}
      <div className="bg-persona-dark/90 border-2 border-persona-cyan p-6 -skew-x-3 mb-8 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
        <div className="skew-x-3 flex items-center gap-6">
          <div className="w-20 h-20 border-2 border-persona-cyan bg-persona-blue/40 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.4)] relative">
            {profile.image ? (
              <img src={profile.image} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-persona-cyan" />
            )}
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2.5 py-0.5 font-black italic text-[10px] -skew-x-12 uppercase mb-2">
              <Sparkles className="w-3 h-3 skew-x-12" /> PUBLIC OPERATIVE DOSSIER
            </div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-wider">
              {profile.name || 'Membro do Velvet'}
            </h1>
          </div>
        </div>
      </div>

      {/* Painel de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-4 -skew-x-6 flex items-center gap-4">
          <div className="p-3 bg-persona-cyan/10 border border-persona-cyan skew-x-6">
            <BarChart3 className="w-6 h-6 text-persona-cyan" />
          </div>
          <div className="skew-x-6">
            <span className="text-[10px] font-mono text-persona-cyan/70 uppercase block">TOTAL REVIEWS</span>
            <span className="text-2xl font-black italic text-white">{totalReviews}</span>
          </div>
        </div>

        <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-4 -skew-x-6 flex items-center gap-4">
          <div className="p-3 bg-persona-cyan/10 border border-persona-cyan skew-x-6">
            <BookmarkCheck className="w-6 h-6 text-persona-cyan" />
          </div>
          <div className="skew-x-6">
            <span className="text-[10px] font-mono text-persona-cyan/70 uppercase block">COMPENDIUM</span>
            <span className="text-2xl font-black italic text-white">{favorites.length} ÁLBUNS</span>
          </div>
        </div>

        <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-4 -skew-x-6 flex items-center gap-4">
          <div className="p-3 bg-persona-cyan/10 border border-persona-cyan skew-x-6">
            <Award className="w-6 h-6 text-persona-cyan" />
          </div>
          <div className="skew-x-6 min-w-0">
            <span className="text-[10px] font-mono text-persona-cyan/70 uppercase block">FAVORITO</span>
            <span className="text-sm font-black italic text-white truncate block">
              {topAlbum ? topAlbum.albumTitle : 'NENHUM'}
            </span>
            {topAlbum && (
              <span className="text-[10px] font-mono text-persona-cyan">{topAlbum.rating} ⭐</span>
            )}
          </div>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex gap-3 mb-4">
        <button
          onMouseEnter={() => sfx.playHover()}
          onClick={() => { sfx.playClick(); setActiveTab('reviews'); }}
          className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'
          }`}
        >
          <Flame className="w-4 h-4 skew-x-12" />
          <span className="skew-x-12">REVIEWS ({userReviews.length})</span>
        </button>

        <button
          onMouseEnter={() => sfx.playHover()}
          onClick={() => { sfx.playClick(); setActiveTab('compendium'); }}
          className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${
            activeTab === 'compendium'
              ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'
          }`}
        >
          <BookmarkCheck className="w-4 h-4 skew-x-12" />
          <span className="skew-x-12">VELVET COMPENDIUM ({favorites.length})</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'reviews' && (
        <div className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-6 -skew-x-3">
          <div className="skew-x-3 space-y-3">
            {userReviews.length === 0 ? (
              <p className="font-mono text-xs text-persona-cyan/60 uppercase py-6 text-center">
                ESTE OPERATIVO AINDA NÃO SUBMETEU NENHUMA REVIEWS.
              </p>
            ) : (
              userReviews.map((rev) => (
                <div key={rev.id} className="bg-persona-dark/90 border border-persona-cyan/40 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {rev.coverUrl && (
                      <img src={rev.coverUrl} alt={rev.albumTitle} className="w-14 h-14 object-cover border border-persona-cyan shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-black italic text-sm text-persona-cyan uppercase truncate">{rev.albumTitle}</p>
                      <p className="text-xs font-mono text-persona-white/60 uppercase truncate">{rev.artistName}</p>
                      <div className="mt-1">
                        <ExpandableText text={rev.comment} maxLength={120} />
                      </div>
                    </div>
                  </div>
                  <div className="flex text-persona-cyan shrink-0">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-persona-cyan" />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'compendium' && (
        <div className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-6 -skew-x-3">
          <div className="skew-x-3">
            {favorites.length === 0 ? (
              <p className="font-mono text-xs text-persona-cyan/60 uppercase py-6 text-center">
                O COMPENDIUM DESTE OPERATIVO ESTÁ VAZIO.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="bg-persona-dark/90 border border-persona-cyan/40 p-4 flex flex-col justify-between">
                    <div>
                      <div className="w-full aspect-square bg-persona-blue/40 border border-persona-cyan/50 mb-3 overflow-hidden flex items-center justify-center">
                        {fav.coverUrl ? (
                          <img src={fav.coverUrl} alt={fav.albumTitle} className="w-full h-full object-cover" />
                        ) : (
                          <Disc className="w-12 h-12 text-persona-cyan/40" />
                        )}
                      </div>
                      <h3 className="font-black italic text-sm text-persona-cyan uppercase truncate">{fav.albumTitle}</h3>
                      <p className="text-xs font-mono text-persona-white/60 uppercase truncate">{fav.artistName} ({fav.releaseYear})</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}