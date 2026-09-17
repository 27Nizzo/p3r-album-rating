'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, Star, Flame, Music, Sparkles, Search, Send, CheckCircle2, MessageSquare, Loader2, Play, Pause, ListMusic, LogIn, LogOut, User, Bookmark, BookmarkCheck } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';
import AudioPlayer from '@/components/AudioPlayer';
import SfxToggle from '@/components/SfxToggle';
import { sfx } from '@/lib/sfx';


interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseYear: string;
}

interface Track {
  id: string;
  trackNumber: number;
  name: string;
  durationMs: number;
  discNumber: number;
  previewUrl: string | null;
}

interface Review {
  id: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  releaseYear: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function Home() {
  const { data: session } = useSession();

  // 1. Estados do Leitor de Áudio Neon
  const [currentTrack, setCurrentTrack] = useState<{
    id: string;
    name: string;
    artist: string;
    coverUrl: string;
    previewUrl: string | null;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 2. Outros Estados da Aplicação
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedAlbum, setSelectedAlbum] = useState<Album>({
    id: 'default',
    title: 'Search a album',
    artist: 'Artist',
    coverUrl: '',
    releaseYear: '...',
  });

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'rate' | 'community' | 'tracks'>('rate');
  const [successMessage, setSuccessMessage] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Estados do Compendium
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Verificar se o álbum está no Compendium
  const checkIsFavorite = async () => {
    if (!session || !selectedAlbum.id || selectedAlbum.id === 'default') {
      setIsFavorite(false);
      return;
    }
    try {
      const res = await fetch('/api/favorites');
      if (!res.ok) return;
      const text = await res.text();
      if (!text || text.trim().startsWith('<')) return;

      const data = JSON.parse(text);
      if (data.favorites) {
        const found = data.favorites.some((fav: any) => fav.albumId === selectedAlbum.id);
        setIsFavorite(found);
      }
    } catch (err) {
      console.error('Erro ao verificar compendium:', err);
    }
  };

  // Adicionar / Remover do Compendium
  const toggleFavorite = async () => {
    if (!session) {
      sfx.playClick();
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedAlbum.id || selectedAlbum.id === 'default' || isTogglingFavorite) return;

    sfx.playClick();
    setIsTogglingFavorite(true);

    try {
      if (isFavorite) {
        const res = await fetch(`/api/favorites?albumId=${selectedAlbum.id}`, { method: 'DELETE' });
        if (res.ok) setIsFavorite(false);
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            albumId: selectedAlbum.id,
            albumTitle: selectedAlbum.title,
            artistName: selectedAlbum.artist,
            coverUrl: selectedAlbum.coverUrl,
            releaseYear: selectedAlbum.releaseYear,
          }),
        });
        if (res.ok) {
          sfx.playSuccess();
          setIsFavorite(true);
        }
      }
    } catch (err) {
      console.error('Erro ao alterar compendium:', err);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Estatísticas do Álbum
  const [albumStats, setAlbumStats] = useState<{ averageRating: number; totalReviews: number }>({
    averageRating: 0,
    totalReviews: 0,
  });

  // Lógica de Reprodução de Áudio
  const handlePlayPreview = (track: Track) => {
    sfx.playClick();
    if (!track.previewUrl) return;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) audioRef.current.pause();

      audioRef.current = new Audio(track.previewUrl);
      setCurrentTrack({
        id: track.id,
        name: track.name,
        artist: selectedAlbum.artist,
        coverUrl: selectedAlbum.coverUrl,
        previewUrl: track.previewUrl,
      });

      audioRef.current.play();
      setIsPlaying(true);

      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const handleStopAudio = () => {
    sfx.playClick();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const fetchReviews = async () => {
    try {
      setIsLoadingReviews(true);
      const res = await fetch('/api/reviews');

      if (!res.ok) {
        console.warn(`[Reviews] A API respondeu com status: ${res.status}`);
        return;
      }

      const text = await res.text();
      if (!text || text.trim().length === 0) return;

      if (text.trim().startsWith('<')) {
        console.error('[Reviews] Resposta inesperada (HTML em vez de JSON)');
        return;
      }

      const data = JSON.parse(text);
      if (data.reviews) setReviews(data.reviews);
    } catch (err) {
      console.error('Erro ao carregar críticas da comunidade:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchAlbumStats = async () => {
    if (!selectedAlbum.id || selectedAlbum.id === 'default') {
      setAlbumStats({ averageRating: 0, totalReviews: 0 });
      return;
    }

    try {
      const res = await fetch(`/api/reviews/album/${selectedAlbum.id}`);

      if (!res.ok) {
        setAlbumStats({ averageRating: 0, totalReviews: 0 });
        return;
      }

      const text = await res.text();
      if (!text || text.trim().length === 0) return;

      if (text.trim().startsWith('<')) {
        console.error('[AlbumStats] Resposta inesperada (HTML em vez de JSON)');
        return;
      }

      const data = JSON.parse(text);
      setAlbumStats(data);
    } catch (err) {
      console.error('Erro ao carregar média do álbum:', err);
      setAlbumStats({ averageRating: 0, totalReviews: 0 });
    }
  };

  // Select the album from the comunity

  const handleSelectAlbumFromCommunity = (rev: any) => {
  sfx.playClick();
  setSelectedAlbum({
    id: rev.albumId,
    title: rev.albumTitle,
    artist: rev.artistName,
    coverUrl: rev.coverUrl,
    releaseYear: rev.releaseYear || 'N/A',
  });
  // Rola a página suavemente para o topo para mostrar o Spotlight Album
  window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Carregar críticas ao iniciar
  useEffect(() => {
    fetchReviews();
  }, []);

  // Obter Músicas e Estatísticas do Álbum Selecionado
  useEffect(() => {
    if (!selectedAlbum.id || selectedAlbum.id === 'default') {
      setTracks([]);
      setAlbumStats({ averageRating: 0, totalReviews: 0 });
      return;
    }

    const fetchTracks = async () => {
      setIsLoadingTracks(true);
      try {
        const res = await fetch(`/api/spotify/album/${selectedAlbum.id}`);
        if (!res.ok) throw new Error(`Resposta inválida: ${res.status}`);
        const data = await res.json();
        setTracks(data.tracks || []);
      } catch (err) {
        console.error('Erro ao carregar faixas:', err);
        setTracks([]);
      } finally {
        setIsLoadingTracks(false);
      }
    };

    fetchTracks();
    fetchAlbumStats();
    checkIsFavorite();
  }, [selectedAlbum, session]);

  // Debounce Pesquisa Spotify
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.albums || []);
      } catch (err) {
        console.error('Erro ao pesquisar:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim() || isSubmitting) return;

    sfx.playClick();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: selectedAlbum.id,
          albumTitle: selectedAlbum.title,
          artistName: selectedAlbum.artist,
          coverUrl: selectedAlbum.coverUrl,
          releaseYear: selectedAlbum.releaseYear,
          rating,
          comment,
        }),
      });

      if (res.ok) {
        sfx.playSuccess();
        setComment('');
        setRating(0);
        setSuccessMessage(true);
        setTimeout(() => setSuccessMessage(false), 3000);
        fetchReviews();
        fetchAlbumStats();
      }
    } catch (err) {
      console.error('Erro ao guardar:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden flex flex-col justify-between p-6 md:p-12 pb-28">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-persona-blue/20 blur-[140px] -z-10 rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-persona-cyan/10 blur-[160px] -z-10 rounded-full" />

      {/* Cabeçalho */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-persona-cyan/30 pb-4">
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3">
          <div className="bg-persona-cyan text-persona-dark px-3 py-1 font-black text-xl italic -skew-x-12">P3R</div>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-wider uppercase">
            VELVET <span className="text-persona-cyan">RECORDS</span>
          </h1>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Barra de Pesquisa */}
          <div className="relative w-full md:w-80">
            <div className="relative flex items-center bg-persona-dark/90 border-2 border-persona-cyan -skew-x-12 px-3 py-1.5 focus-within:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-persona-cyan animate-spin skew-x-12 mr-2" />
              ) : (
                <Search className="w-4 h-4 text-persona-cyan skew-x-12 mr-2" />
              )}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="PESQUISAR ÁLBUM..."
                className="bg-transparent text-persona-white placeholder-persona-cyan/40 text-xs font-mono tracking-wider focus:outline-none w-full skew-x-12 uppercase"
              />
            </div>

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-2 bg-persona-dark border-2 border-persona-cyan shadow-[0_10px_30px_rgba(0,0,0,0.8)] max-h-80 overflow-y-auto">
                  {searchResults.map((album) => (
                    <div 
                      key={album.id} 
                      onMouseEnter={() => sfx.playHover()}
                      onClick={() => { 
                        sfx.playClick();
                        setSelectedAlbum(album); 
                        setQuery(''); 
                        setSearchResults([]); 
                      }} 
                      className="flex items-center gap-3 p-2.5 border-b border-persona-cyan/20 hover:bg-persona-blue/40 cursor-pointer transition-colors group"
                    >
                      {album.coverUrl ? (
                        <img src={album.coverUrl} alt={album.title} className="w-10 h-10 object-cover border border-persona-cyan" />
                      ) : (
                        <div className="w-10 h-10 bg-persona-blue flex items-center justify-center"><Disc className="w-5 h-5 text-persona-cyan" /></div>
                      )}
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold truncate group-hover:text-persona-cyan uppercase italic">{album.title}</p>
                        <p className="text-xs font-mono text-persona-white/60 truncate uppercase">{album.artist} ({album.releaseYear})</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Área de Autenticação + SFX Toggle */}
          <div className="flex items-center gap-3">
            <SfxToggle />

            {session ? (
              <div className="flex items-center gap-3 bg-persona-blue/20 border border-persona-cyan/40 px-3 py-1.5 -skew-x-12">
                <Link
                  href="/profile"
                  onMouseEnter={() => sfx.playHover()}
                  onClick={() => sfx.playClick()}
                  className="skew-x-12 flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                  title="Ir para o meu perfil"
                >
                  <div className="w-6 h-6 rounded-full border border-persona-cyan flex items-center justify-center overflow-hidden shrink-0 bg-persona-blue/40">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-persona-cyan" />
                    )}
                  </div>
                  <span className="text-xs font-mono text-persona-cyan uppercase font-bold truncate max-w-[100px]">
                    {session.user?.name || session.user?.email}
                  </span>
                </Link>
                <button 
                  onClick={() => { sfx.playClick(); signOut(); }} 
                  onMouseEnter={() => sfx.playHover()}
                  title="Sair" 
                  className="text-red-400 hover:text-red-300 ml-1 skew-x-12 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onMouseEnter={() => sfx.playHover()}
                onClick={() => { sfx.playClick(); setIsAuthModalOpen(true); }}
                className="bg-persona-cyan text-persona-dark font-black px-4 py-1.5 -skew-x-12 border border-persona-cyan hover:bg-white transition-all flex items-center gap-2 text-xs uppercase italic cursor-pointer"
              >
                <LogIn className="w-4 h-4 skew-x-12" />
                <span className="skew-x-12">LOGIN / SIGN UP</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
        <motion.div key={selectedAlbum.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} className="lg:col-span-5 relative group">
          <div className="bg-persona-blue/30 border-2 border-persona-cyan p-6 -skew-x-6 shadow-[0_0_25px_rgba(0,229,255,0.25)]">
            <div className="skew-x-6">
              
              
              <div className="flex justify-between items-center mb-4">
  <div className="inline-flex items-center gap-1 text-xs font-bold uppercase bg-persona-cyan text-persona-dark px-2.5 py-1">
    <Sparkles className="w-3.5 h-3.5" /> Spotlight Album
  </div>

  {/* BOTÃO VELVET COMPENDIUM */}
  {selectedAlbum.id !== 'default' && (
    <button
      onClick={toggleFavorite}
      onMouseEnter={() => sfx.playHover()}
      disabled={isTogglingFavorite}
      title={isFavorite ? 'Remover do Velvet Compendium' : 'Registar no Velvet Compendium'}
      className={`flex items-center gap-1.5 px-3 py-1 -skew-x-12 border font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
        isFavorite
          ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_10px_rgba(0,229,255,0.6)]'
          : 'bg-persona-dark/90 border-persona-cyan/50 text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark'
      }`}
    >
      <div className="skew-x-12 flex items-center gap-1.5">
        {isFavorite ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        <span>{isFavorite ? 'IN COMPENDIUM' : '+ COMPENDIUM'}</span>
      </div>
    </button>
  )}
</div>



              <div className="relative aspect-square bg-gradient-to-br from-persona-blue to-persona-dark border-2 border-persona-cyan mb-4 overflow-hidden flex items-center justify-center group">
                {selectedAlbum.coverUrl ? (
                  <img src={selectedAlbum.coverUrl} alt={selectedAlbum.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <Disc className="w-32 h-32 text-persona-cyan/40 animate-pulse" />
                )}
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tight text-persona-white leading-tight">{selectedAlbum.title}</h2>
              <p className="text-persona-cyan font-bold tracking-widest uppercase text-base mb-2">{selectedAlbum.artist}</p>
              
              <div className="flex items-center justify-between mt-4 text-xs font-mono text-persona-white/70 border-t border-persona-cyan/20 pt-3">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-persona-cyan" /> RELEASE YEAR: {selectedAlbum.releaseYear}
                </div>

                <div className="flex items-center gap-1.5 bg-persona-blue/60 border border-persona-cyan/50 px-2.5 py-1 -skew-x-12">
                  <Star className="w-3.5 h-3.5 text-persona-cyan fill-persona-cyan skew-x-12" />
                  <span className="font-mono text-xs font-bold text-persona-cyan skew-x-12">
                    {albumStats.totalReviews > 0 ? `${albumStats.averageRating} / 5.0` : 'N/A'}
                  </span>
                  <span className="text-[9px] font-mono text-persona-white/50 skew-x-12">
                    ({albumStats.totalReviews})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-7 flex flex-col space-y-4 justify-center">
          {/* Navegação de Tabs */}
          <div className="flex flex-wrap gap-3 mb-2">
            <button 
              onMouseEnter={() => sfx.playHover()}
              onClick={() => { sfx.playClick(); setActiveTab('rate'); }} 
              className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${activeTab === 'rate' ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'}`}
            >
              <Flame className="w-4 h-4 skew-x-12" />
              <span className="skew-x-12">01 // EVALUATE</span>
            </button>

            <button 
              onMouseEnter={() => sfx.playHover()}
              onClick={() => { sfx.playClick(); setActiveTab('community'); }} 
              className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${activeTab === 'community' ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'}`}
            >
              <MessageSquare className="w-4 h-4 skew-x-12" />
              <span className="skew-x-12">02 // COMMUNITY ({reviews.length})</span>
            </button>

            <button 
              onMouseEnter={() => sfx.playHover()}
              onClick={() => { sfx.playClick(); setActiveTab('tracks'); }} 
              className={`px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer ${activeTab === 'tracks' ? 'bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan'}`}
            >
              <ListMusic className="w-4 h-4 skew-x-12" />
              <span className="skew-x-12">03 // TRACKS ({tracks.length})</span>
            </button>
          </div>

          {/* TAB 1: Form de Rating */}
          {activeTab === 'rate' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {!session ? (
                <div className="bg-persona-dark/90 border-2 border-persona-cyan/40 p-8 text-center -skew-x-6 space-y-4">
                  <div className="skew-x-6 space-y-3">
                    <p className="font-mono text-xs text-persona-cyan uppercase tracking-widest">
                      ACESSO RESTRITO A OPERATIVOS
                    </p>
                    <p className="font-mono text-xs text-persona-white/70">
                      Precisas de iniciar sessão com a tua conta para enviares avaliações e guardar as tuas críticas no teu perfil.
                    </p>
                    <button
                      type="button"
                      onMouseEnter={() => sfx.playHover()}
                      onClick={() => { sfx.playClick(); setIsAuthModalOpen(true); }}
                      className="bg-persona-cyan text-persona-dark font-black px-6 py-2 -skew-x-12 border border-persona-cyan hover:bg-white transition-all inline-flex items-center gap-2 text-xs uppercase italic cursor-pointer mt-2"
                    >
                      <LogIn className="w-4 h-4 skew-x-12" />
                      <span className="skew-x-12">FAZER LOGIN AGORA</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-6 -skew-x-6 space-y-5">
                  <div className="skew-x-6 space-y-4">
                    <div>
                      <label className="block text-xs font-mono text-persona-cyan uppercase tracking-widest mb-2">
                        AVALIAÇÃO DE 1 A 5 ESTRELAS
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button" 
                            onMouseEnter={() => { sfx.playHover(); setHoverRating(star); }}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => { sfx.playClick(); setRating(star); }} 
                            className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                          >
                            <Star className={`w-8 h-8 ${star <= (hoverRating || rating) ? 'text-persona-cyan fill-persona-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' : 'text-persona-blue/40'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-persona-cyan uppercase tracking-widest mb-2">
                        A TUA CRÍTICA / ANÁLISE
                      </label>
                      <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="ESCREVE AQUI AS TUAS IMPRESSÕES SOBRE O ÁLBUM..." className="w-full bg-persona-dark/90 border border-persona-cyan/50 p-3 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none focus:ring-1 focus:ring-persona-cyan placeholder-persona-cyan/30" />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      {successMessage && (
                        <span className="text-xs font-mono text-persona-cyan flex items-center gap-1 animate-bounce">
                          <CheckCircle2 className="w-4 h-4" /> CRÍTICA GUARDADA NA BD!
                        </span>
                      )}
                      <button 
                        type="submit" 
                        onMouseEnter={() => sfx.playHover()}
                        disabled={rating === 0 || !comment.trim() || isSubmitting} 
                        className="ml-auto bg-persona-blue border border-persona-cyan text-persona-white hover:bg-persona-cyan hover:text-persona-dark px-6 py-2.5 -skew-x-12 font-black italic uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 group cursor-pointer"
                      >
                        <span className="skew-x-12">{isSubmitting ? 'A GUARDAR...' : 'SUBMETER'}</span>
                        <Send className="w-4 h-4 skew-x-12 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}

{/* TAB 2: Comunidade */}
{activeTab === 'community' && (
  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
    {isLoadingReviews ? (
      <div className="text-center py-8">
        <Loader2 className="w-8 h-8 text-persona-cyan animate-spin mx-auto mb-2" />
        <p className="font-mono text-xs text-persona-cyan/70">A CARREGAR BASE DE DADOS...</p>
      </div>
    ) : reviews.length === 0 ? (
      <div className="bg-persona-dark/60 border border-persona-cyan/30 p-8 text-center -skew-x-6">
        <p className="skew-x-6 font-mono text-xs text-persona-cyan/60">
          AINDA NÃO EXISTEM CRÍTICAS NA BASE DE DADOS. SEJA O PRIMEIRA A AVALIAR!
        </p>
      </div>
    ) : (
      reviews.map((rev: any) => (
        <div key={rev.id} onMouseEnter={() => sfx.playHover()} className="bg-persona-dark border-l-4 border-persona-cyan p-4 -skew-x-6 shadow-md flex gap-4 items-center">
          {/* Capa clicável que carrega no Spotlight */}
          {rev.coverUrl && (
            <button 
              onClick={() => handleSelectAlbumFromCommunity(rev)} 
              className="skew-x-6 shrink-0 cursor-pointer group"
              title="Carregar no Spotlight Album"
            >
              <img 
                src={rev.coverUrl} 
                alt={rev.albumTitle} 
                className="w-14 h-14 object-cover border border-persona-cyan group-hover:opacity-80 group-hover:scale-105 transition-all" 
              />
            </button>
          )}

          <div className="skew-x-6 space-y-1 w-full">
            <div className="flex justify-between items-center border-b border-persona-cyan/20 pb-1">
              <div>
                {/* Título clicável que carrega no Spotlight */}
                <button
                  onClick={() => handleSelectAlbumFromCommunity(rev)}
                  className="font-black italic text-persona-cyan text-sm uppercase block hover:underline text-left cursor-pointer"
                >
                  {rev.albumTitle}
                </button>
                <span className="text-[10px] font-mono text-persona-white/60 uppercase">{rev.artistName}</span>
              </div>
              <div className="flex text-persona-cyan">
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-persona-cyan" />
                ))}
              </div>
            </div>

            <p className="text-xs font-mono text-persona-white/90 leading-relaxed pt-1">{rev.comment}</p>

            <div className="flex justify-between items-center pt-2 text-[10px] font-mono">
              {/* Mantém o Link para o Perfil Público do Utilizador */}
              {rev.user ? (
                <Link
                  href={`/profile/${rev.user.id}`}
                  onMouseEnter={() => sfx.playHover()}
                  onClick={() => sfx.playClick()}
                  className="flex items-center gap-1.5 text-persona-cyan hover:underline uppercase font-bold cursor-pointer"
                >
                  <div className="w-4 h-4 rounded-full border border-persona-cyan overflow-hidden bg-persona-blue/40 flex items-center justify-center shrink-0">
                    {rev.user.image ? (
                      <img src={rev.user.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-2.5 h-2.5 text-persona-cyan" />
                    )}
                  </div>
                  <span>BY {rev.user.name || 'OPERATIVE'}</span>
                </Link>
              ) : (
                <span className="text-persona-white/40 uppercase">BY ANONYMOUS OPERATIVE</span>
              )}

              <span className="text-persona-cyan/50">
                {new Date(rev.createdAt).toLocaleDateString()} {new Date(rev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      ))
    )}
  </motion.div>
)}

          {/* TAB 3: Faixas do Álbum */}
          {activeTab === 'tracks' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-4 max-h-[420px] overflow-y-auto pr-3 space-y-3 scrollbar-thin scrollbar-thumb-persona-cyan scrollbar-track-persona-dark"
            >
              {isLoadingTracks ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-persona-cyan animate-spin mx-auto mb-2" />
                  <p className="font-mono text-xs text-persona-cyan/70">A CARREGAR FAIXAS DO SPOTIFY...</p>
                </div>
              ) : tracks.length === 0 ? (
                <p className="font-mono text-xs text-persona-cyan/60 text-center py-8">
                  PESQUISA E SELECIONA UM ÁLBUM NO SPOTIFY PARA VER AS MÚSICAS.
                </p>
              ) : (
                Object.entries(
                  tracks.reduce((acc, track) => {
                    const disc = track.discNumber || 1;
                    if (!acc[disc]) acc[disc] = [];
                    acc[disc].push(track);
                    return acc;
                  }, {} as Record<number, Track[]>)
                ).map(([discNumber, discTracks]) => (
                  <div key={`disc-${discNumber}`} className="space-y-2">
                    <div className="flex items-center gap-2 py-1 border-b-2 border-persona-cyan/60 -skew-x-6 bg-persona-blue/40 px-3 my-2">
                      <Disc className="w-4 h-4 text-persona-cyan skew-x-6" />
                      <span className="font-black italic text-xs uppercase text-persona-cyan tracking-wider skew-x-6">
                        DISC {discNumber}
                      </span>
                    </div>

                    {discTracks.map((track) => (
                      <div 
                        key={track.id} 
                        onMouseEnter={() => sfx.playHover()}
                        className="flex items-center justify-between p-2.5 border-b border-persona-cyan/20 hover:bg-persona-blue/30 transition-colors group -skew-x-6"
                      >
                        <div className="flex items-center gap-3 skew-x-6 min-w-0 pr-2">
                          <span className="font-mono text-xs text-persona-cyan shrink-0">
                            {track.trackNumber < 10 ? `0${track.trackNumber}` : track.trackNumber}
                          </span>
                          <span className="font-bold text-xs uppercase italic group-hover:text-persona-cyan transition-colors truncate">
                            {track.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 skew-x-6 shrink-0">
                          <span className="font-mono text-[10px] text-persona-white/60">
                            {formatDuration(track.durationMs)}
                          </span>
                          {track.previewUrl ? (
                            <button 
                              onClick={() => handlePlayPreview(track)} 
                              onMouseEnter={() => sfx.playHover()}
                              className="p-1.5 bg-persona-blue text-persona-cyan border border-persona-cyan hover:bg-persona-cyan hover:text-persona-dark transition-all cursor-pointer"
                            >
                              {currentTrack?.id === track.id && isPlaying ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[9px] font-mono text-persona-white/30 uppercase">
                              No Preview
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>

      <footer className="flex justify-between items-center text-xs font-mono text-persona-cyan/50 border-t border-persona-cyan/20 pt-4">
        <span>PERSONA 3 RELOAD INSPIRED UI</span>
        <span>TRACKLIST & AUTHENTICATION ACTIVE</span>
      </footer>

      {/* Leitor de Áudio Neon Fixo */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          sfx.playClick();
          if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
          } else {
            audioRef.current?.play();
            setIsPlaying(true);
          }
        }}
        onClose={handleStopAudio}
      />

      {/* Modal de Autenticação */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}