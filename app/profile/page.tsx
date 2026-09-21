'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Star,
  Trash2,
  Loader2,
  Sparkles,
  ArrowLeft,
  Flame,
  Award,
  BarChart3,
  Filter,
  Edit3,
  Check,
  X,
  BookmarkCheck,
  Disc,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SfxToggle from '@/components/SfxToggle';
import { sfx } from '@/lib/sfx';
import ExpandableText from '@/components/ExpandableText';
import SocialStats from '@/components/SocialStats';

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

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingFavAlbumId, setDeletingFavAlbumId] = useState<string | null>(null);

  // Estados de Edição do Perfil
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estados de Filtro, Ordenação e Abas do Perfil
  const [activeTab, setActiveTab] = useState<'reviews' | 'compendium'>('reviews');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // 1. Críticas do Utilizador
      const resReviews = await fetch('/api/reviews/user');
      if (resReviews.ok) {
        const textRev = await resReviews.text();
        if (textRev && !textRev.trim().startsWith('<')) {
          const dataRev = JSON.parse(textRev);
          if (dataRev.reviews) setUserReviews(dataRev.reviews);
        }
      }

      // 2. Velvet Compendium (Favoritos)
      const resFavs = await fetch('/api/favorites');
      if (resFavs.ok) {
        const textFav = await resFavs.text();
        if (textFav && !textFav.trim().startsWith('<')) {
          const dataFav = JSON.parse(textFav);
          if (dataFav.favorites) setFavorites(dataFav.favorites);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchUserData();
      setNewName(session?.user?.name || '');
      setNewImage(session?.user?.image || '');
    }
  }, [status, router, session]);

  const handleDelete = async (id: string) => {
    sfx.playClick();
    try {
      setDeletingId(id);
      const res = await fetch('/api/reviews/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setUserReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error('Erro ao apagar:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveFavorite = async (albumId: string) => {
    sfx.playClick();
    try {
      setDeletingFavAlbumId(albumId);
      const res = await fetch(`/api/favorites?albumId=${albumId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.albumId !== albumId));
      }
    } catch (err) {
      console.error('Erro ao remover do compendium:', err);
    } finally {
      setDeletingFavAlbumId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSavingProfile) return;

    sfx.playClick();
    try {
      setIsSavingProfile(true);

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, image: newImage }),
      });

      if (res.ok) {
        sfx.playSuccess();
        await update({ name: newName, image: newImage });
        router.refresh();
        setIsEditing(false);
      } else {
        const errorData = await res.json();
        console.error('Erro retornado pela API:', errorData);
      }
    } catch (err) {
      console.error('Erro ao guardar perfil:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Estatísticas Rápidas & Cálculo para os Social Stats
  const totalReviews = userReviews.length;
  const averageRating =
    totalReviews > 0
      ? (userReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '0.0';

  const topAlbum =
    userReviews.length > 0
      ? [...userReviews].sort((a, b) => b.rating - a.rating)[0]
      : null;

  // Cálculo de estatísticas para o SocialStats P3R
  const reviewsCount = userReviews.length;
  const totalLikes = 0; // Podes ligar à contagem real de likes se a API devolver este dado
  const compendiumCount = favorites.length;
  const uniqueArtistsCount = new Set(userReviews.map((r) => r.artistName)).size;

  // Filtro e Ordenação
  const filteredReviews = userReviews
    .filter((rev) => (filterRating === 'all' ? true : rev.rating === filterRating))
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-persona-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-persona-cyan animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden p-6 md:p-12">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-persona-blue/20 blur-[140px] -z-10 rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-persona-cyan/10 blur-[160px] -z-10 rounded-full" />

      {/* Botões de Ação Superiores */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/"
          onMouseEnter={() => sfx.playHover()}
          onClick={() => sfx.playClick()}
          className="inline-flex items-center gap-2 bg-persona-blue/30 border border-persona-cyan/50 text-persona-cyan px-4 py-2 -skew-x-12 hover:bg-persona-cyan hover:text-persona-dark font-black italic text-xs uppercase transition-all"
        >
          <ArrowLeft className="w-4 h-4 skew-x-12" />
          <span className="skew-x-12">VOLTAR À PÁGINA PRINCIPAL</span>
        </Link>
        <SfxToggle />
      </div>

      {/* Cabeçalho do Perfil */}
      <div className="bg-persona-dark/90 border-2 border-persona-cyan p-6 -skew-x-3 mb-8 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
        <div className="skew-x-3 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
            <div className="w-20 h-20 border-2 border-persona-cyan bg-persona-blue/40 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.4)] relative">
              {session?.user?.image ? (
                <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-persona-cyan" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2.5 py-0.5 font-black italic text-[10px] -skew-x-12 uppercase mb-2">
                <Sparkles className="w-3 h-3 skew-x-12" /> OPERATIVE DOSSIER
              </div>

              {!isEditing ? (
                <div>
                  <h1 className="text-3xl font-black italic uppercase text-white tracking-wider">
                    {session?.user?.name || 'Membro do Velvet'}
                  </h1>
                  <p className="font-mono text-xs text-persona-cyan/80 mt-1">
                    {session?.user?.email}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3 mt-1 max-w-md">
                  <div>
                    <label className="block text-[10px] font-mono text-persona-cyan uppercase mb-1">
                      CODENAME / NOME
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-persona-dark border border-persona-cyan px-3 py-1.5 text-xs font-mono text-white focus:outline-none uppercase"
                      placeholder="NOVO NOME..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-persona-cyan uppercase mb-1">
                      URL DO AVATAR (OPCIONAL)
                    </label>
                    <input
                      type="text"
                      value={newImage}
                      onChange={(e) => setNewImage(e.target.value)}
                      className="w-full bg-persona-dark border border-persona-cyan px-3 py-1.5 text-xs font-mono text-white focus:outline-none"
                      placeholder="HTTPS://..."
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      onMouseEnter={() => sfx.playHover()}
                      className="bg-persona-cyan text-persona-dark font-black px-3 py-1 text-xs uppercase italic flex items-center gap-1 hover:bg-white transition-all cursor-pointer"
                    >
                      {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      GUARDAR
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => sfx.playHover()}
                      onClick={() => { sfx.playClick(); setIsEditing(false); }}
                      className="bg-persona-blue/40 border border-persona-cyan/50 text-persona-cyan font-bold px-3 py-1 text-xs uppercase flex items-center gap-1 hover:bg-persona-cyan/20 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> CANCELAR
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {!isEditing && (
            <button
              onMouseEnter={() => sfx.playHover()}
              onClick={() => { sfx.playClick(); setIsEditing(true); }}
              className="bg-persona-blue/40 border border-persona-cyan text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark px-3 py-1.5 -skew-x-12 font-black italic text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 skew-x-12" />
              <span className="skew-x-12">EDITAR OPERATIVO</span>
            </button>
          )}
        </div>
      </div>

      {/* Social Stats Estilo Persona 3 Reload */}
      <div className="mb-8">
        <SocialStats
          reviewsCount={reviewsCount}
          totalLikes={totalLikes}
          compendiumCount={compendiumCount}
          uniqueArtistsCount={uniqueArtistsCount}
        />
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

      {/* NAVEGAÇÃO ENTRE REVIEWS E VELVET COMPENDIUM */}
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

      {/* ABA 1: HISTÓRICO DE REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-6 -skew-x-3">
          <div className="skew-x-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-persona-cyan/20">
            <h2 className="text-xl font-black italic uppercase text-persona-cyan flex items-center gap-2">
              <Flame className="w-5 h-5" /> HISTÓRICO DE REVIEWS ({filteredReviews.length})
            </h2>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 bg-persona-dark border border-persona-cyan/50 px-2.5 py-1 text-xs font-mono">
                <Filter className="w-3.5 h-3.5 text-persona-cyan" />
                <span className="text-persona-cyan/60 uppercase text-[10px]">RATING:</span>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="bg-transparent text-white focus:outline-none uppercase font-bold cursor-pointer"
                >
                  <option value="all" className="bg-persona-dark text-white">TODOS</option>
                  <option value="5" className="bg-persona-dark text-white">5 Estrelas</option>
                  <option value="4" className="bg-persona-dark text-white">4 Estrelas</option>
                  <option value="3" className="bg-persona-dark text-white">3 Estrelas</option>
                  <option value="2" className="bg-persona-dark text-white">2 Estrelas</option>
                  <option value="1" className="bg-persona-dark text-white">1 Estrela</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-persona-dark border border-persona-cyan/50 px-2.5 py-1 text-xs font-mono">
                <span className="text-persona-cyan/60 uppercase text-[10px]">ORDEM:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white focus:outline-none uppercase font-bold cursor-pointer"
                >
                  <option value="newest" className="bg-persona-dark text-white">Mais Recentes</option>
                  <option value="oldest" className="bg-persona-dark text-white">Mais Antigas</option>
                  <option value="highest" className="bg-persona-dark text-white">Maior Rating</option>
                  <option value="lowest" className="bg-persona-dark text-white">Menor Rating</option>
                </select>
              </div>
            </div>
          </div>

          <div className="skew-x-3 space-y-3">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-persona-cyan animate-spin mx-auto mb-2" />
                <p className="font-mono text-xs text-persona-cyan/70 uppercase">
                  A CARREGAR AS TUAS CRÍTICAS...
                </p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="bg-persona-dark/60 border border-persona-cyan/30 p-8 text-center">
                <p className="font-mono text-xs text-persona-cyan/60 uppercase">
                  NENHUMA CRÍTICA ENCONTRADA COM OS FILTROS SELECCIONADOS.
                </p>
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  onMouseEnter={() => sfx.playHover()}
                  className="bg-persona-dark/90 border border-persona-cyan/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-persona-cyan transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {rev.coverUrl && (
                      <img
                        src={rev.coverUrl}
                        alt={rev.albumTitle}
                        className="w-14 h-14 object-cover border border-persona-cyan shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-black italic text-sm text-persona-cyan uppercase truncate">
                        {rev.albumTitle}
                      </p>
                      <p className="text-xs font-mono text-persona-white/60 uppercase truncate">
                        {rev.artistName}
                      </p>
                      <div className="mt-1">
                        <ExpandableText text={rev.comment} maxLength={120} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-persona-cyan/20">
                    <div className="flex text-persona-cyan">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-persona-cyan" />
                      ))}
                    </div>

                    <button
                      onClick={() => handleDelete(rev.id)}
                      disabled={deletingId === rev.id}
                      className="text-red-400 hover:text-red-300 transition-colors p-2 border border-red-500/30 hover:border-red-500 bg-red-500/10 cursor-pointer disabled:opacity-40"
                      title="Apagar crítica"
                    >
                      {deletingId === rev.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 2: VELVET COMPENDIUM */}
      {activeTab === 'compendium' && (
        <div className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-6 -skew-x-3">
          <div className="skew-x-3 flex justify-between items-center mb-6 pb-4 border-b border-persona-cyan/20">
            <h2 className="text-xl font-black italic uppercase text-persona-cyan flex items-center gap-2">
              <BookmarkCheck className="w-5 h-5" /> VELVET COMPENDIUM ({favorites.length})
            </h2>
          </div>

          <div className="skew-x-3">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-persona-cyan animate-spin mx-auto mb-2" />
                <p className="font-mono text-xs text-persona-cyan/70 uppercase">
                  A CARREGAR COMPENDIUM...
                </p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="bg-persona-dark/60 border border-persona-cyan/30 p-8 text-center">
                <p className="font-mono text-xs text-persona-cyan/60 uppercase">
                  NENHUM ÁLBUM REGISTADO NO VELVET COMPENDIUM. ADICIONA ÁLBUNS A PARTIR DA PÁGINA PRINCIPAL!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    onMouseEnter={() => sfx.playHover()}
                    className="bg-persona-dark/90 border border-persona-cyan/40 p-4 flex flex-col justify-between group hover:border-persona-cyan transition-all relative"
                  >
                    <div>
                      <div className="w-full aspect-square bg-persona-blue/40 border border-persona-cyan/50 mb-3 overflow-hidden flex items-center justify-center relative">
                        {fav.coverUrl ? (
                          <img src={fav.coverUrl} alt={fav.albumTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Disc className="w-12 h-12 text-persona-cyan/40" />
                        )}
                      </div>

                      <h3 className="font-black italic text-sm text-persona-cyan uppercase truncate">
                        {fav.albumTitle}
                      </h3>
                      <p className="text-xs font-mono text-persona-white/60 uppercase truncate">
                        {fav.artistName} ({fav.releaseYear})
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-persona-cyan/20">
                      <span className="text-[9px] font-mono text-persona-cyan/40">
                        {new Date(fav.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => handleRemoveFavorite(fav.albumId)}
                        disabled={deletingFavAlbumId === fav.albumId}
                        className="text-red-400 hover:text-red-300 p-1.5 border border-red-500/30 hover:border-red-500 bg-red-500/10 cursor-pointer disabled:opacity-40"
                        title="Remover do Compendium"
                      >
                        {deletingFavAlbumId === fav.albumId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
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