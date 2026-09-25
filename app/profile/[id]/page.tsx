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
  UserPlus,
  Check,
  Clock,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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

interface ConnectionState {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'compendium'>('reviews');

  // Estados do Social Link
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const [isSender, setIsSender] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Carregar perfil público
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

  // 2. Carregar estado da relação (Confidant / Social Link)
  const fetchConnectionState = async () => {
    if (!session || !id) return;
    try {
      const res = await fetch(`/api/confidant?targetUserId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setConnection(data.connection);
        setIsSender(data.isSender);
      }
    } catch (err) {
      console.error('Erro ao verificar ligação:', err);
    }
  };

  useEffect(() => {
    fetchConnectionState();
  }, [id, session]);

  // Handler das ações do Social Link
  const handleConfidantAction = async (action: 'REQUEST' | 'ACCEPT' | 'REMOVE') => {
    if (!session) {
      sfx.playClick();
      alert('Precisas de iniciar sessão para criar um Social Link!');
      return;
    }

    sfx.playClick();
    setActionLoading(true);

    try {
      const res = await fetch('/api/confidant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: id, action }),
      });

      if (res.ok) {
        sfx.playSuccess();
        await fetchConnectionState(); // Atualiza o botão após sucesso
      }
    } catch (err) {
      console.error('Erro ao atualizar Social Link:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-persona-dark flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-persona-cyan animate-spin" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-persona-dark text-persona-white flex flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="font-mono text-xs sm:text-sm text-persona-cyan">OPERATIVO NÃO ENCONTRADO NA BASE DE DADOS.</p>
        <Link
          href="/"
          className="bg-persona-cyan text-persona-dark font-black px-4 py-2 -skew-x-12 uppercase italic text-xs"
        >
          Homepage
        </Link>
      </main>
    );
  }

  const userReviews = profile.reviews || [];
  const favorites = profile.favorites || [];
  const totalReviews = userReviews.length;

  const topAlbum = userReviews.length > 0
      ? [...userReviews].sort((a, b) => b.rating - a.rating)[0]
      : null;

  // Lógica para saber se estou a ver o MEU PRÓPRIO perfil
  const isMyProfile = session?.user && (session.user as any).id === id;

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden p-4 sm:p-6 md:p-12">
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-persona-blue/20 blur-[100px] md:blur-[140px] -z-10 rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-persona-cyan/10 blur-[120px] md:blur-[160px] -z-10 rounded-full" />

      {/* Cabeçalho de Navegação e Partilha */}
      <div className="flex justify-between items-center border-b-2 border-persona-cyan/30 pb-4 mb-6 md:mb-8">
        <Link
          href="/"
          onMouseEnter={() => sfx.playHover()}
          onClick={() => sfx.playClick()}
          className="flex items-center gap-2 bg-persona-blue/40 border border-persona-cyan px-3 md:px-4 py-1.5 -skew-x-12 text-[10px] md:text-xs font-mono text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
          <span className="skew-x-12 font-bold uppercase">HOMEPAGE</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <ShareButton
            title={profile.name || 'Operativo'}
            text={`Confere o perfil e as análises musicais do operativo ${profile.name || 'Operativo'} no Velvet Records!`}
          />
          <SfxToggle />
        </div>
      </div>

      {/* Dossiê do Perfil Público com Botão de Social Link */}
      <div className="bg-persona-dark/90 border-2 border-persona-cyan p-4 md:p-6 -skew-x-3 mb-6 md:mb-8 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
        <div className="skew-x-3 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 md:gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-persona-cyan bg-persona-blue/40 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.4)] relative">
              {profile.image ? (
                <img src={profile.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-persona-cyan" />
              )}
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2.5 py-0.5 font-black italic text-[9px] md:text-[10px] -skew-x-12 uppercase mb-1 md:mb-2">
                <Sparkles className="w-3 h-3 skew-x-12" /> PUBLIC OPERATIVE DOSSIER
              </div>
              <h1 className="text-2xl md:text-3xl font-black italic uppercase text-white tracking-wider truncate">
                {profile.name || 'Membro do Velvet'}
              </h1>
            </div>
          </div>

          {/* ÁREA DO BOTÃO DINÂMICO DO SOCIAL LINK */}
          {session?.user && !isMyProfile && (
            <div className="mt-2 sm:mt-0 shrink-0 w-full sm:w-auto">
              {actionLoading ? (
                <div className="bg-persona-blue/40 border border-persona-cyan/50 px-4 py-2 -skew-x-12 flex items-center justify-center gap-2 text-xs font-mono text-persona-cyan">
                  <Loader2 className="w-4 h-4 animate-spin skew-x-12" />
                  <span className="skew-x-12 uppercase">PROCESSANDO...</span>
                </div>
              ) : connection?.status === 'ACCEPTED' ? (
                <button
                  onClick={() => handleConfidantAction('REMOVE')}
                  onMouseEnter={() => sfx.playHover()}
                  className="w-full sm:w-auto bg-persona-cyan text-persona-dark border-2 border-persona-cyan hover:bg-red-500 hover:text-white hover:border-red-500 px-4 py-2 -skew-x-12 font-black italic text-xs uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer flex items-center justify-center gap-2 group"
                  title="Clica para desarmar ligação"
                >
                  <UserCheck className="w-4 h-4 skew-x-12" />
                  <span className="skew-x-12 group-hover:hidden">RANK 1 CONFIDANT 🤝</span>
                  <span className="skew-x-12 hidden group-hover:inline">BREAK LINK 💔</span>
                </button>
              ) : connection?.status === 'PENDING' ? (
                isSender ? (
                  <button
                    onClick={() => handleConfidantAction('REMOVE')}
                    onMouseEnter={() => sfx.playHover()}
                    className="w-full sm:w-auto bg-persona-dark/80 border-2 border-persona-cyan/60 text-persona-cyan hover:border-red-400 hover:text-red-400 px-4 py-2 -skew-x-12 font-black italic text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-2 group"
                    title="Clica para cancelar pedido"
                  >
                    <Clock className="w-4 h-4 skew-x-12 group-hover:hidden" />
                    <span className="skew-x-12 group-hover:hidden">LINK PENDING...</span>
                    <span className="skew-x-12 hidden group-hover:inline">CANCEL REQUEST</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleConfidantAction('ACCEPT')}
                    onMouseEnter={() => sfx.playHover()}
                    className="w-full sm:w-auto bg-persona-cyan text-persona-dark border-2 border-persona-cyan hover:bg-white px-4 py-2 -skew-x-12 font-black italic text-xs uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.4)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 skew-x-12" />
                    <span className="skew-x-12">ACCEPT LINK 🤝</span>
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleConfidantAction('REQUEST')}
                  onMouseEnter={() => sfx.playHover()}
                  className="w-full sm:w-auto bg-persona-blue/40 border-2 border-persona-cyan text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark px-4 py-2 -skew-x-12 font-black italic text-xs uppercase transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4 skew-x-12" />
                  <span className="skew-x-12">+ CREATE LINK</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Painel de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-3 md:p-4 -skew-x-6 flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-persona-cyan/10 border border-persona-cyan skew-x-6 shrink-0">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-persona-cyan" />
          </div>
          <div className="skew-x-6 min-w-0">
            <span className="text-[9px] md:text-[10px] font-mono text-persona-cyan/70 uppercase block">TOTAL REVIEWS</span>
            <span className="text-xl md:text-2xl font-black italic text-white">{totalReviews}</span>
          </div>
        </div>

        <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-3 md:p-4 -skew-x-6 flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-persona-cyan/10 border border-persona-cyan skew-x-6 shrink-0">
            <BookmarkCheck className="w-5 h-5 md:w-6 md:h-6 text-persona-cyan" />
          </div>
          <div className="skew-x-6 min-w-0">
            <span className="text-[9px] md:text-[10px] font-mono text-persona-cyan/70 uppercase block">COMPENDIUM</span>
            <span className="text-xl md:text-2xl font-black italic text-white truncate block">{favorites.length} ÁLBUNS</span>
          </div>
        </div>

        <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-3 md:p-4 -skew-x-6 flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-persona-cyan/10 border border-persona-cyan skew-x-6 shrink-0">
            <Award className="w-5 h-5 md:w-6 md:h-6 text-persona-cyan" />
          </div>
          <div className="skew-x-6 min-w-0">
            <span className="text-[9px] md:text-[10px] font-mono text-persona-cyan/70 uppercase block">FAVORITO</span>
            <span className="text-xs md:text-sm font-black italic text-white truncate block">
              {topAlbum ? topAlbum.albumTitle : 'NENHUM'}
            </span>
            {topAlbum && (
              <span className="text-[9px] md:text-[10px] font-mono text-persona-cyan">{topAlbum.rating} ⭐</span>
            )}
          </div>
        </div>
      </div>

      {/* Navegação entre Abas */}
      <div className="flex overflow-x-auto gap-2 md:gap-3 mb-4 hide-scrollbar snap-x pb-2">
        <button
          onMouseEnter={() => sfx.playHover()}
          onClick={() => { sfx.playClick(); setActiveTab('reviews'); }}
          className={`px-4 md:px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer shrink-0 snap-start ${
            activeTab === 'reviews'
              ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'
          }`}
        >
          <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
          <span className="skew-x-12 text-xs md:text-sm">REVIEWS ({userReviews.length})</span>
        </button>

        <button
          onMouseEnter={() => sfx.playHover()}
          onClick={() => { sfx.playClick(); setActiveTab('compendium'); }}
          className={`px-4 md:px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer shrink-0 snap-start ${
            activeTab === 'compendium'
              ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]'
              : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
          <span className="skew-x-12 text-xs md:text-sm">COMPENDIUM ({favorites.length})</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'reviews' && (
        <div className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-4 md:p-6 -skew-x-3">
          <div className="skew-x-3 space-y-3">
            {userReviews.length === 0 ? (
              <p className="font-mono text-xs text-persona-cyan/60 uppercase py-6 text-center">
                ESTE OPERATIVO AINDA NÃO SUBMETEU NENHUMA REVIEW.
              </p>
            ) : (
              userReviews.map((rev) => (
                <div key={rev.id} className="bg-persona-dark/90 border border-persona-cyan/40 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 w-full">
                    {rev.coverUrl && (
                      <img src={rev.coverUrl} alt={rev.albumTitle} className="w-12 h-12 md:w-14 md:h-14 object-cover border border-persona-cyan shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-black italic text-xs md:text-sm text-persona-cyan uppercase truncate">{rev.albumTitle}</p>
                      <p className="text-[10px] md:text-xs font-mono text-persona-white/60 uppercase truncate">{rev.artistName}</p>
                      <div className="mt-1">
                        <ExpandableText text={rev.comment} maxLength={100} />
                      </div>
                    </div>
                  </div>
                  <div className="flex text-persona-cyan shrink-0 ml-12 sm:ml-0">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-persona-cyan" />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'compendium' && (
        <div className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-4 md:p-6 -skew-x-3">
          <div className="skew-x-3">
            {favorites.length === 0 ? (
              <p className="font-mono text-xs text-persona-cyan/60 uppercase py-6 text-center">
                O COMPENDIUM DESTE OPERATIVO ESTÁ VAZIO.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {favorites.map((fav) => (
                  <div key={fav.id} className="bg-persona-dark/90 border border-persona-cyan/40 p-3 md:p-4 flex flex-col justify-between">
                    <div>
                      <div className="w-full aspect-square bg-persona-blue/40 border border-persona-cyan/50 mb-3 overflow-hidden flex items-center justify-center">
                        {fav.coverUrl ? (
                          <img src={fav.coverUrl} alt={fav.albumTitle} className="w-full h-full object-cover" />
                        ) : (
                          <Disc className="w-10 h-10 md:w-12 md:h-12 text-persona-cyan/40" />
                        )}
                      </div>
                      <h3 className="font-black italic text-xs md:text-sm text-persona-cyan uppercase truncate">{fav.albumTitle}</h3>
                      <p className="text-[10px] md:text-xs font-mono text-persona-white/60 uppercase truncate">{fav.artistName} ({fav.releaseYear})</p>
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