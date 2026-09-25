"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Disc,
  Star,
  Flame,
  Music,
  Sparkles,
  Search,
  Send,
  Loader2,
  Play,
  Pause,
  ListMusic,
  LogIn,
  LogOut,
  User,
  Bookmark,
  BookmarkCheck,
  Trophy,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import AuthModal from "@/components/AuthModal";
import AudioPlayer from "@/components/AudioPlayer";
import SfxToggle from "@/components/SfxToggle";
import { sfx } from "@/lib/sfx";
import ExpandableText from "@/components/ExpandableText";
import ReviewComments from "@/components/ReviewComments";
import ToastContainer, { ToastMessage } from "@/components/Toast";
import NotificationCenter from "@/components/NotificationCenter";

interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
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
  albumId: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  releaseYear: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  likesCount?: number;
  isLikedByMe?: boolean;
}

export default function Home() {
  const { data: session } = useSession();

  // Estado do Sistema de Toast P3R
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    type: "success" | "error" | "info",
    title: string,
    message?: string,
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (type === "success") sfx.playSuccess();
    else sfx.playClick();

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedAlbum, setSelectedAlbum] = useState<Album>({
    id: "default",
    title: "Search album",
    artist: "Artist",
    coverUrl: "",
    releaseYear: "...",
  });

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"rate" | "community" | "tracks">(
    "rate",
  );

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Estados do Compendium
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Estados para filtros e Pesquisa na Comunidade
  const [communitySearch, setCommunitySearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const [sortBy, setSortBy] = useState<
    "recent" | "popular" | "rating-desc" | "rating-asc"
  >("recent");

  // Reviews filtradas para a Tab da Comunidade
  const filteredReviews = reviews
    .filter((rev) => {
      const matchesSearch =
        rev.albumTitle.toLowerCase().includes(communitySearch.toLowerCase()) ||
        rev.artistName.toLowerCase().includes(communitySearch.toLowerCase()) ||
        (rev.user?.name &&
          rev.user.name
            .toLowerCase()
            .includes(communitySearch.toLowerCase())) ||
        rev.comment.toLowerCase().includes(communitySearch.toLowerCase());

      const matchesRating =
        ratingFilter === null || rev.rating === ratingFilter;

      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === "popular") {
        return (b.likesCount || 0) - (a.likesCount || 0);
      }
      if (sortBy === "rating-desc") {
        return b.rating - a.rating;
      }
      if (sortBy === "rating-asc") {
        return a.rating - b.rating;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Verificar se o álbum está no Compendium
  const checkIsFavorite = async () => {
    if (!session || !selectedAlbum.id || selectedAlbum.id === "default") {
      setIsFavorite(false);
      return;
    }
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) return;
      const text = await res.text();
      if (!text || text.trim().startsWith("<")) return;

      const data = JSON.parse(text);
      if (data.favorites) {
        const found = data.favorites.some(
          (fav: any) => fav.albumId === selectedAlbum.id,
        );
        setIsFavorite(found);
      }
    } catch (err) {
      console.error("Erro ao verificar compendium:", err);
    }
  };

  // Adicionar / Remover do Compendium
  const toggleFavorite = async () => {
    if (!session) {
      sfx.playClick();
      setIsAuthModalOpen(true);
      return;
    }
    if (
      !selectedAlbum.id ||
      selectedAlbum.id === "default" ||
      isTogglingFavorite
    )
      return;

    sfx.playClick();
    setIsTogglingFavorite(true);

    try {
      if (isFavorite) {
        const res = await fetch(`/api/favorites?albumId=${selectedAlbum.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setIsFavorite(false);
          showToast("info", "COMPENDIUM", "Álbum removido da tua coleção.");
        } else {
          showToast(
            "error",
            "ERRO COMPENDIUM",
            "Não foi possível remover o álbum.",
          );
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            albumId: selectedAlbum.id,
            albumTitle: selectedAlbum.title,
            artistName: selectedAlbum.artist,
            coverUrl: selectedAlbum.coverUrl,
            releaseYear: selectedAlbum.releaseYear,
          }),
        });
        if (res.ok) {
          setIsFavorite(true);
          showToast(
            "success",
            "COMPENDIUM",
            "Álbum adicionado ao teu Compendium!",
          );
        } else {
          showToast(
            "error",
            "ERRO COMPENDIUM",
            "Não foi possível adicionar o álbum.",
          );
        }
      }
    } catch (err) {
      console.error("Erro ao alterar compendium:", err);
      showToast(
        "error",
        "ERRO COMPENDIUM",
        "Não foi possível atualizar o Compendium.",
      );
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Estatísticas do Álbum
  const [albumStats, setAlbumStats] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({
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
      const res = await fetch("/api/reviews");

      if (!res.ok) return;

      const text = await res.text();
      if (!text || text.trim().length === 0 || text.trim().startsWith("<"))
        return;

      const data = JSON.parse(text);
      if (data.reviews) setReviews(data.reviews);
    } catch (err) {
      console.error("Erro ao carregar críticas da comunidade:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchAlbumStats = async () => {
    if (!selectedAlbum.id || selectedAlbum.id === "default") {
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
      if (!text || text.trim().length === 0 || text.trim().startsWith("<"))
        return;

      const data = JSON.parse(text);
      setAlbumStats(data);
    } catch (err) {
      console.error("Erro ao carregar média do álbum:", err);
      setAlbumStats({ averageRating: 0, totalReviews: 0 });
    }
  };

  const handleToggleLike = async (reviewId: string) => {
    if (!session) {
      sfx.playClick();
      setIsAuthModalOpen(true);
      return;
    }

    sfx.playClick();

    const targetReview = reviews.find((r) => r.id === reviewId);
    const currentlyLiked = targetReview?.isLikedByMe || false;
    const willBeLiked = !currentlyLiked;

    if (willBeLiked) {
      showToast(
        "success",
        "OPERATIVE LIKE",
        "Registado o teu apoio a esta análise!",
      );
    } else {
      showToast(
        "info",
        "LIKE REMOVIDO",
        "Removeste o teu apoio a esta análise.",
      );
    }

    setReviews((prev) =>
      prev.map((rev) => {
        if (rev.id === reviewId) {
          const currentCount = rev.likesCount || 0;
          return {
            ...rev,
            isLikedByMe: willBeLiked,
            likesCount: willBeLiked
              ? currentCount + 1
              : Math.max(0, currentCount - 1),
          };
        }
        return rev;
      }),
    );

    try {
      const res = await fetch("/api/reviews/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      if (!res.ok) {
        showToast(
          "error",
          "ERRO LIKE",
          "Não foi possível sincronizar o teu Like.",
        );
        fetchReviews();
      }
    } catch (err) {
      console.error("Erro ao dar like:", err);
      showToast("error", "ERRO LIGAÇÃO", "Falha de rede ao registar Like.");
      fetchReviews();
    }
  };

  const handleSelectAlbumFromCommunity = (rev: Review) => {
    sfx.playClick();
    setSelectedAlbum({
      id: rev.albumId,
      title: rev.albumTitle,
      artist: rev.artistName,
      coverUrl: rev.coverUrl,
      releaseYear: rev.releaseYear || "N/A",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    fetchReviews();
  }, [session]);

  useEffect(() => {
    if (!selectedAlbum.id || selectedAlbum.id === "default") {
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
        console.error("Erro ao carregar faixas:", err);
        setTracks([]);
      } finally {
        setIsLoadingTracks(false);
      }
    };

    fetchTracks();
    fetchAlbumStats();
    checkIsFavorite();
  }, [selectedAlbum, session]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/spotify/search?q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        setSearchResults(data.albums || []);
      } catch (err) {
        console.error("Erro ao pesquisar:", err);
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
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        setComment("");
        setRating(0);
        showToast(
          "success",
          "CRÍTICA REGISTADA",
          "A tua avaliação foi guardada com sucesso!",
        );
        fetchReviews();
        fetchAlbumStats();
      } else {
        showToast(
          "error",
          "ERRO NA SUBMISSÃO",
          "Não foi possível publicar a tua crítica.",
        );
      }
    } catch (err) {
      console.error("Erro ao guardar:", err);
      showToast("error", "ERRO NA SUBMISSÃO", "Ocorreu uma falha na ligação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden flex flex-col justify-between p-4 sm:p-6 md:p-12 pb-28 p3r-grid-bg">
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-persona-blue/20 blur-[100px] md:blur-[140px] -z-10 rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-persona-cyan/10 blur-[120px] md:blur-[160px] -z-10 rounded-full" />
      <div className="absolute inset-0 p3r-scanlines pointer-events-none -z-10 opacity-40" />

      {/* Cabeçalho */}
<header className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b-2 border-persona-cyan/30 pb-4">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 md:gap-3 justify-center md:justify-start"
        >
          <div className="bg-persona-cyan text-persona-dark px-2 md:px-3 py-1 font-black text-lg md:text-xl italic -skew-x-12">
            P3R
          </div>
          <h1 className="text-xl md:text-3xl font-black italic tracking-wider uppercase">
            VELVET <span className="text-persona-cyan">RECORDS</span>
          </h1>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Grupo: Pesquisa + Botão de Rankings */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Barra de Pesquisa */}
            <div className="relative w-full sm:w-64 md:w-80">
              <div className="relative flex items-center bg-persona-dark/90 border-2 border-persona-cyan -skew-x-12 px-3 py-1.5 focus-within:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all w-full">
                {isSearching ? (
                  <Loader2 className="w-4 h-4 text-persona-cyan animate-spin skew-x-12 mr-2 shrink-0" />
                ) : (
                  <Search className="w-4 h-4 text-persona-cyan skew-x-12 mr-2 shrink-0" />
                )}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ÁLBUM..."
                  className="bg-transparent text-persona-white placeholder-persona-cyan/40 text-[10px] md:text-xs font-mono tracking-wider focus:outline-none w-full skew-x-12 uppercase min-w-0"
                />
              </div>
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 left-0 right-0 top-full mt-2 w-full bg-persona-dark border-2 border-persona-cyan shadow-[0_15px_40px_rgba(0,0,0,0.9)] max-h-60 md:max-h-80 overflow-y-auto"
                  >
                    {searchResults.map((album) => (
                      <div
                        key={album.id}
                        onMouseEnter={() => sfx.playHover()}
                        onClick={() => {
                          sfx.playClick();
                          setSelectedAlbum(album);
                          setQuery("");
                          searchResults.length = 0;
                        }}
                        className="flex items-center gap-3 p-2.5 border-b border-persona-cyan/20 hover:bg-persona-blue/40 cursor-pointer transition-colors group"
                      >
                        {album.coverUrl ? (
                          <img
                            src={album.coverUrl}
                            alt={album.title}
                            className="w-10 h-10 object-cover border border-persona-cyan shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-persona-blue flex items-center justify-center shrink-0">
                            <Disc className="w-5 h-5 text-persona-cyan" />
                          </div>
                        )}
                        <div className="overflow-hidden min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-persona-cyan uppercase italic">
                            {album.title}
                          </p>
                          <p className="text-[10px] md:text-xs font-mono text-persona-white/60 truncate uppercase">
                            {album.artist} ({album.releaseYear})
                          </p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botão Rankings à direita da barra de pesquisa */}
            <Link
              href="/rankings"
              onMouseEnter={() => sfx.playHover()}
              onClick={() => sfx.playClick()}
              className="bg-persona-blue/30 border border-persona-cyan text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark px-3 py-2 -skew-x-12 font-black italic text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 h-[35px] w-[45px] sm:w-auto"
              title="Ver Velvet Rankings"
            >
              <Trophy className="w-5 h-5 md:w-6 md:h-6 skew-x-12" />
            </Link>
          </div>

          {/* Área de Autenticação + SFX Toggle + NOTIFICAÇÕES */}
          <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
            <SfxToggle />

            {session ? (
              <>
                {/* ---> COMPONENTE DE NOTIFICAÇÕES AQUI <--- */}
                <NotificationCenter />
                
                <div className="flex items-center justify-between sm:justify-start gap-3 bg-persona-blue/20 border border-persona-cyan/40 px-3 py-1.5 -skew-x-12 w-full sm:w-auto">
                  <Link
                    href="/profile"
                    onMouseEnter={() => sfx.playHover()}
                    onClick={() => sfx.playClick()}
                    className="skew-x-12 flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer min-w-0"
                    title="Ir para o meu perfil"
                  >
                    <div className="w-6 h-6 rounded-full border border-persona-cyan flex items-center justify-center overflow-hidden shrink-0 bg-persona-blue/40">
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-persona-cyan" />
                      )}
                    </div>
                    <span className="text-[10px] md:text-xs font-mono text-persona-cyan uppercase font-bold truncate max-w-[120px] md:max-w-[100px]">
                      {session.user?.name || session.user?.email}
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      sfx.playClick();
                      signOut();
                    }}
                    onMouseEnter={() => sfx.playHover()}
                    title="Sair"
                    className="text-red-400 hover:text-red-300 ml-1 skew-x-12 cursor-pointer shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onMouseEnter={() => sfx.playHover()}
                onClick={() => {
                  sfx.playClick();
                  setIsAuthModalOpen(true);
                }}
                className="bg-persona-cyan text-persona-dark font-black px-4 py-1.5 -skew-x-12 border border-persona-cyan hover:bg-white transition-all flex items-center justify-center gap-2 text-[10px] md:text-xs uppercase italic cursor-pointer w-full sm:w-auto h-[35px]"
              >
                <LogIn className="w-4 h-4 skew-x-12 shrink-0" />
                <span className="skew-x-12 whitespace-nowrap">
                  LOGIN / SIGN UP
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 my-auto py-6 md:py-8">
        <motion.div
          key={selectedAlbum.id}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-5 relative group"
        >
          <div className="bg-persona-blue/30 border-2 border-persona-cyan p-4 md:p-6 -skew-x-3 md:-skew-x-6 shadow-[0_0_25px_rgba(0,229,255,0.25)] mx-2 md:mx-0">
            <div className="skew-x-3 md:skew-x-6">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <div className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase bg-persona-cyan text-persona-dark px-2 md:px-2.5 py-1">
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" /> Spotlight
                  Album
                </div>

                {/* BOTÃO VELVET COMPENDIUM */}
                {selectedAlbum.id !== "default" && (
                  <button
                    onClick={toggleFavorite}
                    onMouseEnter={() => sfx.playHover()}
                    disabled={isTogglingFavorite}
                    title={
                      isFavorite
                        ? "Remover do Velvet Compendium"
                        : "Registar no Velvet Compendium"
                    }
                    className={`flex items-center gap-1.5 px-2 md:px-3 py-1 -skew-x-12 border font-mono text-[9px] md:text-xs font-bold uppercase transition-all cursor-pointer ${
                      isFavorite
                        ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_10px_rgba(0,229,255,0.6)]"
                        : "bg-persona-dark/90 border-persona-cyan/50 text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark"
                    }`}
                  >
                    <div className="skew-x-12 flex items-center gap-1 md:gap-1.5">
                      {isFavorite ? (
                        <BookmarkCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      ) : (
                        <Bookmark className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      )}
                      <span>
                        {isFavorite ? "IN COMPENDIUM" : "+ COMPENDIUM"}
                      </span>
                    </div>
                  </button>
                )}
              </div>

              <div className="relative aspect-square w-[75%] md:w-full mx-auto bg-gradient-to-br from-persona-blue to-persona-dark border-2 border-persona-cyan mb-4 overflow-hidden flex items-center justify-center group">
                {selectedAlbum.coverUrl ? (
                  <img
                    src={selectedAlbum.coverUrl}
                    alt={selectedAlbum.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Disc className="w-24 h-24 md:w-32 md:h-32 text-persona-cyan/40 animate-pulse" />
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-persona-white leading-tight break-words text-center md:text-left">
                {selectedAlbum.title}
              </h2>

              <div className="text-center md:text-left">
                {selectedAlbum.id !== "default" && selectedAlbum.artistId ? (
                  <Link
                    href={`/artist/${selectedAlbum.artistId}`}
                    onMouseEnter={() => sfx.playHover()}
                    onClick={() => sfx.playClick()}
                    className="text-persona-cyan font-bold tracking-widest uppercase text-sm md:text-base mb-2 inline-block hover:underline hover:text-white transition-colors cursor-pointer"
                    title={`Ver dossiê de ${selectedAlbum.artist}`}
                  >
                    {selectedAlbum.artist} →
                  </Link>
                ) : (
                  <p className="text-persona-cyan font-bold tracking-widest uppercase text-sm md:text-base mb-2">
                    {selectedAlbum.artist}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2 md:mt-4 text-[10px] md:text-xs font-mono text-persona-white/70 border-t border-persona-cyan/20 pt-3">
                <div className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 md:w-4 md:h-4 text-persona-cyan" />{" "}
                  RELEASE YEAR: {selectedAlbum.releaseYear}
                </div>

                <div className="flex items-center gap-1.5 bg-persona-blue/60 border border-persona-cyan/50 px-3 py-1 -skew-x-12 sm:mr-4 shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                  <Star className="w-3.5 h-3.5 text-persona-cyan fill-persona-cyan skew-x-12" />
                  <span className="font-mono text-[10px] md:text-xs font-bold text-persona-cyan skew-x-12">
                    {albumStats.totalReviews > 0
                      ? `${albumStats.averageRating} / 5.0`
                      : "N/A"}
                  </span>
                  <span className="text-[8px] md:text-[9px] font-mono text-persona-white/50 skew-x-12">
                    ({albumStats.totalReviews})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-7 flex flex-col space-y-4 justify-center">
          {/* Navegação de Tabs (Deslizáveis em mobile) */}
          <div className="flex overflow-x-auto md:flex-wrap gap-2 md:gap-3 mb-2 pb-2 md:pb-0 hide-scrollbar snap-x px-2 md:px-0">
            <button
              onMouseEnter={() => sfx.playHover()}
              onClick={() => {
                sfx.playClick();
                setActiveTab("rate");
              }}
              className={`px-4 md:px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center justify-center gap-2 border-2 cursor-pointer shrink-0 snap-start ${
                activeTab === "rate"
                  ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  : "bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan"
              }`}
            >
              <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
              <span className="skew-x-12 text-[10px] md:text-base">
                01 // EVALUATE
              </span>
            </button>

            <button
              onMouseEnter={() => sfx.playHover()}
              onClick={() => {
                sfx.playClick();
                setActiveTab("community");
              }}
              className={`px-4 md:px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center justify-center gap-2 border-2 cursor-pointer shrink-0 snap-start ${
                activeTab === "community"
                  ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  : "bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan"
              }`}
            >
              <Music className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
              <span className="skew-x-12 text-[10px] md:text-base">
                02 // COMMUNITY ({reviews.length})
              </span>
            </button>

            <button
              onMouseEnter={() => sfx.playHover()}
              onClick={() => {
                sfx.playClick();
                setActiveTab("tracks");
              }}
              className={`px-4 md:px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center justify-center gap-2 border-2 cursor-pointer shrink-0 snap-start ${
                activeTab === "tracks"
                  ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]"
                  : "bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan"
              }`}
            >
              <ListMusic className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
              <span className="skew-x-12 text-[10px] md:text-base">
                03 // TRACKS ({tracks.length})
              </span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* TAB 1: Form de Rating */}
            {activeTab === "rate" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-2 md:px-0"
              >
                {!session ? (
                  <div className="bg-persona-dark/90 border-2 border-persona-cyan/40 p-6 md:p-8 text-center -skew-x-3 md:-skew-x-6 space-y-4">
                    <div className="skew-x-3 md:skew-x-6 space-y-3">
                      <p className="font-mono text-[10px] md:text-xs text-persona-cyan uppercase tracking-widest">
                        ACESSO RESTRITO A OPERATIVOS
                      </p>
                      <p className="font-mono text-[10px] md:text-xs text-persona-white/70">
                        Precisas de iniciar sessão com a tua conta para enviares
                        avaliações e guardar as tuas críticas no teu perfil.
                      </p>
                      <button
                        type="button"
                        onMouseEnter={() => sfx.playHover()}
                        onClick={() => {
                          sfx.playClick();
                          setIsAuthModalOpen(true);
                        }}
                        className="bg-persona-cyan text-persona-dark font-black px-4 md:px-6 py-2 -skew-x-12 border border-persona-cyan hover:bg-white transition-all inline-flex items-center gap-2 text-[10px] md:text-xs uppercase italic cursor-pointer mt-2"
                      >
                        <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
                        <span className="skew-x-12">FAZER LOGIN AGORA</span>
                      </button>
                    </div>
                  </div>
                ) : selectedAlbum.id === "default" ? (
                  <div className="bg-persona-dark/90 border-2 border-persona-cyan/40 p-6 md:p-8 text-center -skew-x-3 md:-skew-x-6">
                    <div className="skew-x-3 md:skew-x-6 space-y-3">
                      <p className="font-mono text-[10px] md:text-xs text-persona-cyan uppercase tracking-widest font-bold">
                        NENHUM ÁLBUM SELECCIONADO
                      </p>
                      <p className="font-mono text-[10px] md:text-xs text-persona-white/70">
                        PESQUISA E SELECCIONA UM ÁLBUM NA BARRA DE PESQUISA PARA
                        PODERES SUBMETER A TUA AVALIAÇÃO.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmitReview}
                    className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-4 md:p-6 -skew-x-3 md:-skew-x-6 space-y-5"
                  >
                    <div className="skew-x-3 md:skew-x-6 space-y-4">
                      <div>
                        <label className="block text-[10px] md:text-xs font-mono text-persona-cyan uppercase tracking-widest mb-2">
                          AVALIAÇÃO DE 1 A 5 ESTRELAS
                        </label>
                        <div className="flex gap-1 md:gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => {
                                sfx.playHover();
                                setHoverRating(star);
                              }}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => {
                                sfx.playClick();
                                setRating(star);
                              }}
                              className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                            >
                              <Star
                                className={`w-7 h-7 md:w-8 md:h-8 ${
                                  star <= (hoverRating || rating)
                                    ? "text-persona-cyan fill-persona-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
                                    : "text-persona-blue/40"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] md:text-xs font-mono text-persona-cyan uppercase tracking-widest mb-2">
                          A TUA CRÍTICA / ANÁLISE
                        </label>
                        <textarea
                          rows={4}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="ESCREVE AQUI AS TUAS IMPRESSÕES SOBRE O ÁLBUM..."
                          className="w-full bg-persona-dark/90 border border-persona-cyan/50 p-3 text-persona-white font-mono text-[10px] md:text-xs focus:border-persona-cyan focus:outline-none focus:ring-1 focus:ring-persona-cyan placeholder-persona-cyan/30"
                        />
                      </div>

                      <div className="flex justify-end items-center pt-2">
                        <button
                          type="submit"
                          onMouseEnter={() => sfx.playHover()}
                          disabled={
                            rating === 0 || !comment.trim() || isSubmitting
                          }
                          className="w-full sm:w-auto ml-auto bg-persona-blue border border-persona-cyan text-persona-white hover:bg-persona-cyan hover:text-persona-dark px-6 py-2.5 -skew-x-12 font-black italic uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
                        >
                          <span className="skew-x-12 text-[10px] md:text-base">
                            {isSubmitting ? "A GUARDAR..." : "SUBMETER"}
                          </span>
                          <Send className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* TAB 2: Comunidade */}
            {activeTab === "community" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 px-2 md:px-0"
              >
                <div className="bg-persona-dark/90 border border-persona-cyan/40 p-3 -skew-x-3 md:-skew-x-6 space-y-3">
                  <div className="skew-x-3 md:skew-x-6 flex flex-col xl:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full xl:w-80 bg-persona-dark border border-persona-cyan/50 px-2.5 py-1 flex items-center">
                      <Search className="w-3.5 h-3.5 text-persona-cyan mr-2 shrink-0" />
                      <input
                        type="text"
                        value={communitySearch}
                        onChange={(e) => setCommunitySearch(e.target.value)}
                        placeholder="FILTER BY ARTIST, ALBUM OR REVIEWER..."
                        className="bg-transparent text-persona-white placeholder-persona-cyan/40 text-[9px] md:text-[11px] font-mono tracking-wider focus:outline-none w-full uppercase min-w-0"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full xl:w-auto justify-between xl:justify-end">
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto justify-center hide-scrollbar">
                        <button
                          type="button"
                          onMouseEnter={() => sfx.playHover()}
                          onClick={() => {
                            sfx.playClick();
                            setRatingFilter(null);
                          }}
                          className={`px-2 py-0.5 font-mono text-[9px] md:text-[10px] font-bold uppercase transition-all cursor-pointer shrink-0 ${
                            ratingFilter === null
                              ? "bg-persona-cyan text-persona-dark border border-persona-cyan"
                              : "bg-persona-dark/60 text-persona-cyan/70 border border-persona-cyan/30 hover:border-persona-cyan"
                          }`}
                        >
                          TODAS
                        </button>
                        {[5, 4, 3, 2, 1].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => sfx.playHover()}
                            onClick={() => {
                              sfx.playClick();
                              setRatingFilter(
                                ratingFilter === star ? null : star,
                              );
                            }}
                            className={`flex items-center gap-0.5 px-2 py-0.5 font-mono text-[9px] md:text-[10px] font-bold transition-all cursor-pointer shrink-0 ${
                              ratingFilter === star
                                ? "bg-persona-cyan text-persona-dark border border-persona-cyan"
                                : "bg-persona-dark/60 text-persona-cyan/70 border border-persona-cyan/30 hover:border-persona-cyan"
                            }`}
                          >
                            <span>{star}</span>
                            <Star className="w-2.5 h-2.5 fill-current" />
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-1 bg-persona-dark border border-persona-cyan/50 px-2 py-1 sm:py-0.5 font-mono text-[9px] md:text-[10px] w-full sm:w-auto">
                        <span className="text-persona-cyan/60 uppercase">
                          ORDEM:
                        </span>
                        <select
                          value={sortBy}
                          onChange={(e) => {
                            sfx.playClick();
                            setSortBy(e.target.value as any);
                          }}
                          className="bg-transparent text-persona-cyan font-bold uppercase focus:outline-none cursor-pointer text-right sm:text-left"
                        >
                          <option
                            value="recent"
                            className="bg-persona-dark text-persona-white"
                          >
                            MAIS RECENTES
                          </option>
                          <option
                            value="popular"
                            className="bg-persona-dark text-persona-white"
                          >
                            MAIS POPULARES 🔥
                          </option>
                          <option
                            value="rating-desc"
                            className="bg-persona-dark text-persona-white"
                          >
                            MAIOR RATING (5★ → 1★)
                          </option>
                          <option
                            value="rating-asc"
                            className="bg-persona-dark text-persona-white"
                          >
                            MENOR RATING (1★ → 5★)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 md:pr-2 hide-scrollbar">
                  {isLoadingReviews ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-persona-cyan animate-spin mx-auto mb-2" />
                      <p className="font-mono text-[10px] md:text-xs text-persona-cyan/70">
                        A CARREGAR BASE DE DADOS...
                      </p>
                    </div>
                  ) : filteredReviews.length === 0 ? (
                    <div className="bg-persona-dark/60 border border-persona-cyan/30 p-6 md:p-8 text-center -skew-x-3 md:-skew-x-6">
                      <p className="skew-x-3 md:skew-x-6 font-mono text-[10px] md:text-xs text-persona-cyan/60">
                        {reviews.length === 0
                          ? "AINDA NÃO EXISTEM CRÍTICAS NA BASE DE DADOS. SEJA O PRIMEIRA A AVALIAR!"
                          : "NENHUMA CRÍTICA ENCONTRADA PARA OS FILTROS SELECCIONADOS."}
                      </p>
                    </div>
                  ) : (
                    filteredReviews.map((rev) => (
                      <div
                        key={rev.id}
                        onMouseEnter={() => sfx.playHover()}
                        className="bg-persona-dark border-l-4 border-persona-cyan p-3 md:p-4 -skew-x-3 md:-skew-x-6 shadow-md flex gap-3 md:gap-4 items-start"
                      >
                        {rev.coverUrl && (
                          <button
                            onClick={() => handleSelectAlbumFromCommunity(rev)}
                            className="skew-x-3 md:skew-x-6 shrink-0 cursor-pointer group"
                            title="Carregar no Spotlight Album"
                          >
                            <img
                              src={rev.coverUrl}
                              alt={rev.albumTitle}
                              className="w-12 h-12 md:w-14 md:h-14 object-cover border border-persona-cyan group-hover:opacity-80 group-hover:scale-105 transition-all"
                            />
                          </button>
                        )}

                        <div className="skew-x-3 md:skew-x-6 space-y-1 w-full min-w-0">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-persona-cyan/20 pb-1 gap-1 sm:gap-0">
                            <div className="min-w-0 w-full">
                              <button
                                onClick={() =>
                                  handleSelectAlbumFromCommunity(rev)
                                }
                                className="font-black italic text-persona-cyan text-xs md:text-sm uppercase block hover:underline text-left cursor-pointer truncate w-full"
                              >
                                {rev.albumTitle}
                              </button>
                              <span className="text-[9px] md:text-[10px] font-mono text-persona-white/60 uppercase truncate block">
                                {rev.artistName}
                              </span>
                            </div>
                            <div className="flex text-persona-cyan shrink-0">
                              {Array.from({ length: rev.rating }).map(
                                (_, i) => (
                                  <Star
                                    key={i}
                                    className="w-3 h-3 md:w-3.5 md:h-3.5 fill-persona-cyan"
                                  />
                                ),
                              )}
                            </div>
                          </div>

                          <ExpandableText text={rev.comment} maxLength={120} />

                          <div className="flex flex-wrap justify-between items-center pt-2 text-[9px] md:text-[10px] font-mono gap-2">
                            {rev.user ? (
                              <Link
                                href={`/profile/${rev.user.id}`}
                                onMouseEnter={() => sfx.playHover()}
                                onClick={() => sfx.playClick()}
                                className="flex items-center gap-1.5 text-persona-cyan hover:underline uppercase font-bold cursor-pointer min-w-0"
                              >
                                <div className="w-4 h-4 rounded-full border border-persona-cyan overflow-hidden bg-persona-blue/40 flex items-center justify-center shrink-0">
                                  {rev.user.image ? (
                                    <img
                                      src={rev.user.image}
                                      alt="Avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <User className="w-2.5 h-2.5 text-persona-cyan" />
                                  )}
                                </div>
                                <span className="truncate">
                                  BY {rev.user.name || "OPERATIVE"}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-persona-white/40 uppercase truncate">
                                BY ANONYMOUS OPERATIVE
                              </span>
                            )}

                            <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto">
                              <button
                                onClick={() => handleToggleLike(rev.id)}
                                onMouseEnter={() => sfx.playHover()}
                                className={`flex items-center gap-1 px-1.5 md:px-2 py-0.5 border -skew-x-12 transition-all cursor-pointer ${
                                  rev.isLikedByMe
                                    ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_8px_rgba(0,229,255,0.6)] font-bold"
                                    : "bg-persona-dark/80 text-persona-cyan/70 border-persona-cyan/40 hover:border-persona-cyan hover:text-persona-cyan"
                                }`}
                                title={
                                  rev.isLikedByMe ? "Remover Like" : "Dar Like"
                                }
                              >
                                <Flame
                                  className={`w-2.5 h-2.5 md:w-3 md:h-3 skew-x-12 ${
                                    rev.isLikedByMe ? "fill-persona-dark" : ""
                                  }`}
                                />
                                <span className="skew-x-12 font-mono text-[9px] md:text-[10px]">
                                  {rev.likesCount || 0}
                                </span>
                              </button>

                              <span className="text-persona-cyan/50 text-[8px] md:text-[9px]">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <ReviewComments
                              reviewId={rev.id}
                              onOpenAuthModal={() => setIsAuthModalOpen(true)}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 3: Faixas do Álbum */}
            {activeTab === "tracks" && (
              <motion.div
                key={selectedAlbum.id}
                initial={{ scale: 0.92, opacity: 0, x: -20 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.92, opacity: 0, x: 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="lg:col-span-5 relative group px-2 md:px-0"
              >
                {isLoadingTracks ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-persona-cyan animate-spin mx-auto mb-2" />
                    <p className="font-mono text-[10px] md:text-xs text-persona-cyan/70">
                      A CARREGAR FAIXAS DO SPOTIFY...
                    </p>
                  </div>
                ) : tracks.length === 0 ? (
                  <p className="font-mono text-[10px] md:text-xs text-persona-cyan/60 text-center py-8">
                    PESQUISA E SELECIONA UM ÁLBUM NO SPOTIFY PARA VER AS
                    MÚSICAS.
                  </p>
                ) : (
                  Object.entries(
                    tracks.reduce(
                      (acc, track) => {
                        const disc = track.discNumber || 1;
                        if (!acc[disc]) acc[disc] = [];
                        acc[disc].push(track);
                        return acc;
                      },
                      {} as Record<number, Track[]>,
                    ),
                  ).map(([discNumber, discTracks]) => (
                    <div
                      key={`disc-${discNumber}`}
                      className="space-y-1 md:space-y-2"
                    >
                      <div className="flex items-center gap-2 py-1 border-b-2 border-persona-cyan/60 -skew-x-3 md:-skew-x-6 bg-persona-blue/40 px-2 md:px-3 my-2">
                        <Disc className="w-3.5 h-3.5 md:w-4 md:h-4 text-persona-cyan skew-x-3 md:skew-x-6" />
                        <span className="font-black italic text-[10px] md:text-xs uppercase text-persona-cyan tracking-wider skew-x-3 md:skew-x-6">
                          DISC {discNumber}
                        </span>
                      </div>

                      {discTracks.map((track) => (
                        <div
                          key={track.id}
                          onMouseEnter={() => sfx.playHover()}
                          className="flex items-center justify-between p-2 md:p-2.5 border-b border-persona-cyan/20 hover:bg-persona-blue/30 transition-colors group -skew-x-3 md:-skew-x-6"
                        >
                          <div className="flex items-center gap-2 md:gap-3 skew-x-3 md:skew-x-6 min-w-0 pr-2">
                            <span className="font-mono text-[10px] md:text-xs text-persona-cyan shrink-0">
                              {track.trackNumber < 10
                                ? `0${track.trackNumber}`
                                : track.trackNumber}
                            </span>
                            <span className="font-bold text-[10px] md:text-xs uppercase italic group-hover:text-persona-cyan transition-colors truncate">
                              {track.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 md:gap-4 skew-x-3 md:skew-x-6 shrink-0">
                            <span className="font-mono text-[9px] md:text-[10px] text-persona-white/60">
                              {formatDuration(track.durationMs)}
                            </span>
                            {track.previewUrl ? (
                              <button
                                onClick={() => handlePlayPreview(track)}
                                onMouseEnter={() => sfx.playHover()}
                                className="p-1 md:p-1.5 bg-persona-blue text-persona-cyan border border-persona-cyan hover:bg-persona-cyan hover:text-persona-dark transition-all cursor-pointer"
                              >
                                {currentTrack?.id === track.id && isPlaying ? (
                                  <Pause className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                ) : (
                                  <Play className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="text-[8px] md:text-[9px] font-mono text-persona-white/30 uppercase">
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
          </AnimatePresence>
        </div>
      </div>

      <footer className="flex flex-col sm:flex-row justify-between items-center text-[9px] md:text-xs font-mono text-persona-cyan/50 border-t border-persona-cyan/20 pt-4 mt-auto gap-2 sm:gap-0 text-center sm:text-left">
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
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Sistema Flutuante de Toasts P3R */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </main>
  );
}
