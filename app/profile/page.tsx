'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Review {
  id: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estados de Edição do Perfil
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Estados de Filtro e Ordenação
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews/user');

      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const text = await res.text();
      if (!text) return; // Impede o erro se a resposta vier vazia

      const data = JSON.parse(text);
      if (data.reviews) setUserReviews(data.reviews);
    } catch (err) {
      console.error('Erro ao carregar críticas do perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchUserReviews();
      setNewName(session?.user?.name || '');
      setNewImage(session?.user?.image || '');
    }
  }, [status, router, session]);

  const handleDelete = async (id: string) => {
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSavingProfile) return;

    try {
      setIsSavingProfile(true);

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, image: newImage }),
      });

      if (res.ok) {
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

  // 1. Estatísticas Rápidas
  const totalReviews = userReviews.length;
  const averageRating =
    totalReviews > 0
      ? (userReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '0.0';

  const topAlbum =
    userReviews.length > 0
      ? [...userReviews].sort((a, b) => b.rating - a.rating)[0]
      : null;

  // 2. Filtro e Ordenação da Lista
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

      {/* Botão Voltar */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-persona-blue/30 border border-persona-cyan/50 text-persona-cyan px-4 py-2 -skew-x-12 hover:bg-persona-cyan hover:text-persona-dark font-black italic text-xs uppercase transition-all"
        >
          <ArrowLeft className="w-4 h-4 skew-x-12" />
          <span className="skew-x-12">VOLTAR À PÁGINA PRINCIPAL</span>
        </Link>
      </div>

      {/* Cabeçalho do Perfil com Edição */}
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
                      className="bg-persona-cyan text-persona-dark font-black px-3 py-1 text-xs uppercase italic flex items-center gap-1 hover:bg-white transition-all cursor-pointer"
                    >
                      {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      GUARDAR
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
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
              onClick={() => setIsEditing(true)}
              className="bg-persona-blue/40 border border-persona-cyan text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark px-3 py-1.5 -skew-x-12 font-black italic text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 skew-x-12" />
              <span className="skew-x-12">EDITAR OPERATIVO</span>
            </button>
          )}
        </div>
      </div>

      {/* PAINEL DE ESTATÍSTICAS */}
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
            <Star className="w-6 h-6 text-persona-cyan fill-persona-cyan" />
          </div>
          <div className="skew-x-6">
            <span className="text-[10px] font-mono text-persona-cyan/70 uppercase block">MÉDIA DE RATING</span>
            <span className="text-2xl font-black italic text-white">{averageRating} / 5.0</span>
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

      {/* FILTROS E LISTA DE REVIEWS */}
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
                onChange={(e) =>
                  setFilterRating(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
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
                    <p className="text-xs font-mono text-persona-white/90 truncate mt-1 italic">
                      "{rev.comment}"
                    </p>
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
    </main>
  );
}