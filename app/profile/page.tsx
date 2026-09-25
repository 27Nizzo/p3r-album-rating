"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SfxToggle from "@/components/SfxToggle";
import { sfx } from "@/lib/sfx";
import ExpandableText from "@/components/ExpandableText";
import SocialStats from "@/components/SocialStats";

interface Review {
  id: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
  likesCount?: number;
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

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      sfx.playClick();
      alert("Por favor, seleciona um ficheiro de imagem válido.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setNewImage(reader.result as string);
        sfx.playSuccess();
      }
    };
    reader.readAsDataURL(file);
  };

  const [activeTab, setActiveTab] = useState<"reviews" | "compendium" | "stats">("reviews");
  const [filterRating, setFilterRating] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const resReviews = await fetch("/api/reviews/user");
      if (resReviews.ok) {
        const textRev = await resReviews.text();
        if (textRev && !textRev.trim().startsWith("<")) {
          const dataRev = JSON.parse(textRev);
          if (dataRev.reviews) setUserReviews(dataRev.reviews);
        }
      }

      const resFavs = await fetch("/api/favorites");
      if (resFavs.ok) {
        const textFav = await resFavs.text();
        if (textFav && !textFav.trim().startsWith("<")) {
          const dataFav = JSON.parse(textFav);
          if (dataFav.favorites) setFavorites(dataFav.favorites);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados do perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated") {
      fetchUserData();
      setNewName(session?.user?.name || "");
      setNewImage(session?.user?.image || "");
    }
  }, [status, router, session]);

  const handleDelete = async (id: string) => {
    sfx.playClick();
    try {
      setDeletingId(id);
      const res = await fetch("/api/reviews/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setUserReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Erro ao apagar:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveFavorite = async (albumId: string) => {
    sfx.playClick();
    try {
      setDeletingFavAlbumId(albumId);
      const res = await fetch(`/api/favorites?albumId=${albumId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.albumId !== albumId));
      }
    } catch (err) {
      console.error("Erro ao remover do compendium:", err);
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
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, image: newImage }),
      });

      if (res.ok) {
        sfx.playSuccess();
        await update({ name: newName, image: newImage });
        router.refresh();
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Erro ao guardar perfil:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const totalReviews = userReviews.length;
  const topAlbum = userReviews.length > 0 ? [...userReviews].sort((a, b) => b.rating - a.rating)[0] : null;

  const reviewsCount = userReviews.length;
  const totalLikes = userReviews.reduce((acc, rev) => acc + (rev.likesCount || 0), 0);
  const compendiumCount = favorites.length;
  const uniqueArtistsCount = new Set(userReviews.map((r) => r.artistName)).size;

  const filteredReviews = userReviews
    .filter((rev) => (filterRating === "all" ? true : rev.rating === filterRating))
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0;
    });

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-persona-dark flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-persona-cyan animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden p-4 sm:p-6 md:p-12">
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-persona-blue/20 blur-[100px] md:blur-[140px] -z-10 rounded-full" />
      <div className="absolute -bottom-20 -left-20 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-persona-cyan/10 blur-[120px] md:blur-[160px] -z-10 rounded-full" />

      {/* Botões de Ação Superiores */}
      <div className="flex justify-between items-center mb-6">
        <Link
          href="/"
          onMouseEnter={() => sfx.playHover()}
          onClick={() => sfx.playClick()}
          className="inline-flex items-center gap-2 bg-persona-blue/30 border border-persona-cyan/50 text-persona-cyan px-3 md:px-4 py-2 -skew-x-12 hover:bg-persona-cyan hover:text-persona-dark font-black italic text-[10px] md:text-xs uppercase transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
          <span className="skew-x-12">Homepage</span>
        </Link>
        <SfxToggle />
      </div>

      {/* Cabeçalho do Perfil */}
      <div className="bg-persona-dark/90 border-2 border-persona-cyan p-4 md:p-6 -skew-x-3 mb-6 md:mb-8 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
        <div className="skew-x-3 flex flex-col md:flex-row items-center md:items-start justify-between gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 w-full text-center md:text-left">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

            <div
              onClick={() => {
                if (isEditing && fileInputRef.current) {
                  sfx.playClick();
                  fileInputRef.current.click();
                }
              }}
              className={`w-16 h-16 md:w-20 md:h-20 border-2 border-persona-cyan bg-persona-blue/40 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_15px_rgba(0,229,255,0.4)] relative group ${
                isEditing ? "cursor-pointer hover:border-white transition-all" : ""
              }`}
            >
              {(isEditing ? newImage : session?.user?.image) ? (
                <img src={isEditing ? newImage : session?.user?.image || ""} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 md:w-10 md:h-10 text-persona-cyan" />
              )}
            </div>

            <div className="flex-1 w-name min-w-0 w-full">
              <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2.5 py-0.5 font-black italic text-[9px] md:text-[10px] -skew-x-12 uppercase mb-1 md:mb-2">
                <Sparkles className="w-3 h-3 skew-x-12" /> OPERATIVE DOSSIER
              </div>

              {!isEditing ? (
                <div>
                  <h1 className="text-2xl md:text-3xl font-black italic uppercase text-white tracking-wider truncate">
                    {session?.user?.name || "Membro do Velvet"}
                  </h1>
                  <p className="font-mono text-[10px] md:text-xs text-persona-cyan/80 mt-1 truncate">
                    {session?.user?.email}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3 mt-1 max-w-md mx-auto md:mx-0">
                  <div>
                    <label className="block text-[9px] md:text-[10px] font-mono text-persona-cyan uppercase mb-1">CODENAME / NOME</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-persona-dark border border-persona-cyan px-3 py-1.5 text-xs font-mono text-white focus:outline-none uppercase"
                      placeholder="NOVO NOME..."
                    />
                  </div>
                  <div className="flex gap-2 justify-center md:justify-start pt-1">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      onMouseEnter={() => sfx.playHover()}
                      className="bg-persona-cyan text-persona-dark font-black px-3 py-1 text-[10px] md:text-xs uppercase italic flex items-center gap-1 hover:bg-white transition-all cursor-pointer"
                    >
                      {isSavingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      GUARDAR
                    </button>
                    <button
                      type="button"
                      onMouseEnter={() => sfx.playHover()}
                      onClick={() => { sfx.playClick(); setIsEditing(false); }}
                      className="bg-persona-blue/40 border border-persona-cyan/50 text-persona-cyan font-bold px-3 py-1 text-[10px] md:text-xs uppercase flex items-center gap-1 hover:bg-persona-cyan/20 transition-all cursor-pointer"
                    >
                      <X className="w-3 h-3" /> CANCELAR
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
              className="bg-persona-blue/40 border border-persona-cyan text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark px-3 py-1.5 -skew-x-12 font-black italic text-[10px] md:text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
            >
              <Edit3 className="w-3.5 h-3.5 skew-x-12" />
              <span className="skew-x-12">EDITAR OPERATIVO</span>
            </button>
          )}
        </div>
      </div>

      {/* Estatísticas Rápidas */}
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
            <span className="text-xs md:text-sm font-black italic text-white truncate block">{topAlbum ? topAlbum.albumTitle : "NENHUM"}</span>
            {topAlbum && <span className="text-[9px] md:text-[10px] font-mono text-persona-cyan">{topAlbum.rating} ⭐</span>}
          </div>
        </div>
      </div>

      {/* Navegação entre Abas (Scroll horizontal em mobile) */}
      <div className="flex overflow-x-auto gap-2 md:gap-3 mb-4 hide-scrollbar snap-x pb-2">
        <button
          onMouseEnter={() => sfx.playHover()}
          onClick={() => { sfx.playClick(); setActiveTab("reviews"); }}
          className={`px-4 md:px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer shrink-0 snap-start ${
            activeTab === "reviews"
              ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]"
              : "bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan"
          }`}
        >
          <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
          <span className="skew-x-12 text-xs md:text-sm">01 // REVIEWS ({userReviews.length})</span>
        </button>

        <button
          onMouseEnter={() => sfx.playHover()}
          onClick={() => { sfx.playClick(); setActiveTab("compendium"); }}
          className={`px-4 md:px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer shrink-0 snap-start ${
            activeTab === "compendium"
              ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]"
              : "bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan"
          }`}
        >
          <BookmarkCheck className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
          <span className="skew-x-12 text-xs md:text-sm">02 // COMPENDIUM ({favorites.length})</span>
        </button>

        <button
          onMouseEnter={() => sfx.playHover()}
          onClick={() => { sfx.playClick(); setActiveTab("stats"); }}
          className={`px-4 md:px-5 py-2 -skew-x-12 font-black italic uppercase transition-all flex items-center gap-2 border-2 cursor-pointer shrink-0 snap-start ${
            activeTab === "stats"
              ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_15px_rgba(0,229,255,0.4)]"
              : "bg-persona-dark/80 text-persona-white border-persona-blue hover:border-persona-cyan"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 skew-x-12" />
          <span className="skew-x-12 text-xs md:text-sm">03 // VELVET STATS</span>
        </button>
      </div>

      {/* ABA 1: HISTÓRICO DE REVIEWS */}
      {activeTab === "reviews" && (
        <div className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-4 md:p-6 -skew-x-3">
          <div className="skew-x-3 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 mb-6 pb-4 border-b border-persona-cyan/20">
            <h2 className="text-lg md:text-xl font-black italic uppercase text-persona-cyan flex items-center gap-2">
              <Flame className="w-4 h-4 md:w-5 md:h-5" /> REVIEWS ({filteredReviews.length})
            </h2>

            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full xl:w-auto">
              <div className="flex items-center gap-1 bg-persona-dark border border-persona-cyan/50 px-2 py-1 text-[10px] md:text-xs font-mono">
                <Filter className="w-3 h-3 text-persona-cyan" />
                <span className="text-persona-cyan/60 uppercase text-[9px]">RATING:</span>
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value === "all" ? "all" : Number(e.target.value))}
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

              <div className="flex items-center gap-1 bg-persona-dark border border-persona-cyan/50 px-2 py-1 text-[10px] md:text-xs font-mono">
                <span className="text-persona-cyan/60 uppercase text-[9px]">ORDEM:</span>
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
                <p className="font-mono text-xs text-persona-cyan/70 uppercase">A CARREGAR AS TUAS CRÍTICAS...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="bg-persona-dark/60 border border-persona-cyan/30 p-6 text-center">
                <p className="font-mono text-[10px] md:text-xs text-persona-cyan/60 uppercase">NENHUMA CRÍTICA ENCONTRADA.</p>
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div
                  key={rev.id}
                  onMouseEnter={() => sfx.playHover()}
                  className="bg-persona-dark/90 border border-persona-cyan/40 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 group hover:border-persona-cyan transition-all"
                >
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

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-persona-cyan/20">
                    <div className="flex text-persona-cyan">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-persona-cyan" />
                      ))}
                    </div>

                    <button
                      onClick={() => handleDelete(rev.id)}
                      disabled={deletingId === rev.id}
                      className="text-red-400 hover:text-red-300 transition-colors p-1.5 md:p-2 border border-red-500/30 hover:border-red-500 bg-red-500/10 cursor-pointer disabled:opacity-40"
                      title="Apagar crítica"
                    >
                      {deletingId === rev.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 2: VELVET COMPENDIUM */}
      {activeTab === "compendium" && (
        <div className="bg-persona-dark/80 border-2 border-persona-cyan/40 p-4 md:p-6 -skew-x-3">
          <div className="skew-x-3 flex justify-between items-center mb-6 pb-4 border-b border-persona-cyan/20">
            <h2 className="text-lg md:text-xl font-black italic uppercase text-persona-cyan flex items-center gap-2">
              <BookmarkCheck className="w-4 h-4 md:w-5 md:h-5" /> VELVET COMPENDIUM ({favorites.length})
            </h2>
          </div>

          <div className="skew-x-3">
            {favorites.length === 0 ? (
              <div className="bg-persona-dark/60 border border-persona-cyan/30 p-6 text-center">
                <p className="font-mono text-[10px] md:text-xs text-persona-cyan/60 uppercase">NENHUM ÁLBUM REGISTADO NO COMPENDIUM.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    onMouseEnter={() => sfx.playHover()}
                    className="bg-persona-dark/90 border border-persona-cyan/40 p-3 md:p-4 flex flex-col justify-between group hover:border-persona-cyan transition-all"
                  >
                    <div>
                      <div className="w-full aspect-square bg-persona-blue/40 border border-persona-cyan/50 mb-3 overflow-hidden flex items-center justify-center relative">
                        {fav.coverUrl ? (
                          <img src={fav.coverUrl} alt={fav.albumTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Disc className="w-10 h-10 md:w-12 md:h-12 text-persona-cyan/40" />
                        )}
                      </div>
                      <h3 className="font-black italic text-xs md:text-sm text-persona-cyan uppercase truncate">{fav.albumTitle}</h3>
                      <p className="text-[10px] md:text-xs font-mono text-persona-white/60 uppercase truncate">{fav.artistName} ({fav.releaseYear})</p>
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-persona-cyan/20">
                      <span className="text-[8px] md:text-[9px] font-mono text-persona-cyan/40">{new Date(fav.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleRemoveFavorite(fav.albumId)}
                        disabled={deletingFavAlbumId === fav.albumId}
                        className="text-red-400 hover:text-red-300 p-1 border border-red-500/30 hover:border-red-500 bg-red-500/10 cursor-pointer disabled:opacity-40"
                        title="Remover"
                      >
                        {deletingFavAlbumId === fav.albumId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: STATS */}
      {activeTab === "stats" && (
        <SocialStats
          reviewsCount={reviewsCount}
          totalLikes={totalLikes}
          compendiumCount={compendiumCount}
          uniqueArtistsCount={uniqueArtistsCount}
        />
      )}
    </main>
  );
}