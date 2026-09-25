"use client";

import { useState, useEffect, use } from "react";
import {
  Disc,
  Star,
  Music,
  ArrowLeft,
  Loader2,
  ListMusic,
  MessageSquare,
  Sparkles,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import SfxToggle from "@/components/SfxToggle";
import ShareButton from "@/components/ShareButton";
import { sfx } from "@/lib/sfx";
import ExpandableText from "@/components/ExpandableText";
import ReviewDetailModal from "@/components/ReviewDetailModal";
import AuthModal from "@/components/AuthModal";

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

export default function AlbumDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: albumId } = use(params);
  const { data: session } = useSession();

  const [album, setAlbum] = useState<{
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    releaseYear: string;
  } | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({
    averageRating: 0,
    totalReviews: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedReviewModal, setSelectedReviewModal] = useState<Review | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchReviews = async () => {
    try {
      const resReviews = await fetch(`/api/reviews`);
      if (resReviews.ok) {
        const dataReviews = await resReviews.json();
        const filtered = (dataReviews.reviews || []).filter(
          (r: any) => r.albumId === albumId,
        );
        setReviews(filtered);

        if (filtered.length > 0) {
          setAlbum({
            id: albumId,
            title: filtered[0].albumTitle,
            artist: filtered[0].artistName,
            coverUrl: filtered[0].coverUrl,
            releaseYear: filtered[0].releaseYear || "N/A",
          });
        }
      }
    } catch (err) {
      console.error("Erro ao buscar reviews:", err);
    }
  };

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setIsLoading(true);
        const resTracks = await fetch(`/api/spotify/album/${albumId}`);
        if (resTracks.ok) {
          const dataTracks = await resTracks.json();
          setTracks(dataTracks.tracks || []);
        }

        const resStats = await fetch(`/api/reviews/album/${albumId}`);
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setStats(dataStats);
        }

        await fetchReviews();
      } catch (err) {
        console.error("Erro ao carregar dossiê do álbum:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumData();
  }, [albumId, session]);

  const handleToggleLike = async (reviewId: string) => {
    if (!session) {
      sfx.playClick();
      setIsAuthModalOpen(true);
      return;
    }

    sfx.playClick();

    setReviews((prev) =>
      prev.map((rev) => {
        if (rev.id === reviewId) {
          const currentlyLiked = rev.isLikedByMe || false;
          const willBeLiked = !currentlyLiked;
          const currentCount = rev.likesCount || 0;
          const updatedRev = {
            ...rev,
            isLikedByMe: willBeLiked,
            likesCount: willBeLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
          };

          if (selectedReviewModal?.id === reviewId) {
            setSelectedReviewModal(updatedRev);
          }
          return updatedRev;
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

      if (!res.ok) fetchReviews();
    } catch (err) {
      console.error("Erro ao dar like:", err);
      fetchReviews();
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-persona-dark flex items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-persona-cyan animate-spin" />
      </main>
    );
  }

  const albumTitle = album?.title || "VELVET DOSSIER";
  const artistName = album?.artist || "ARTIST";

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden p-4 sm:p-6 md:p-12 pb-28 p3r-grid-bg">
      <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-persona-blue/20 blur-[100px] md:blur-[140px] -z-10 rounded-full" />
      <div className="absolute inset-0 p3r-scanlines pointer-events-none -z-10 opacity-40" />

      {/* Cabeçalho */}
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
            title={albumTitle}
            text={`Vê as análises e a lista de faixas do álbum "${albumTitle}" de ${artistName} no Velvet Records!`}
          />
          <SfxToggle />
        </div>
      </div>

      {/* Cartão do Álbum e Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-12">
        <div className="lg:col-span-5">
          <div className="bg-persona-blue/30 border-2 border-persona-cyan p-4 md:p-6 -skew-x-3 md:-skew-x-6 shadow-[0_0_25px_rgba(0,229,255,0.25)]">
            <div className="skew-x-3 md:skew-x-6">
              <div className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold uppercase bg-persona-cyan text-persona-dark px-2.5 py-1 mb-4">
                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" /> DOSSIÊ DE ÁLBUM
              </div>

              <div className="relative aspect-square w-[75%] md:w-full mx-auto bg-gradient-to-br from-persona-blue to-persona-dark border-2 border-persona-cyan mb-4 overflow-hidden flex items-center justify-center">
                {album?.coverUrl ? (
                  <img src={album.coverUrl} alt={albumTitle} className="w-full h-full object-cover" />
                ) : (
                  <Disc className="w-24 h-24 md:w-32 md:h-32 text-persona-cyan/40" />
                )}
              </div>

              <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-persona-white leading-tight text-center md:text-left">
                {albumTitle}
              </h1>
              <p className="text-persona-cyan font-bold tracking-widest uppercase text-sm md:text-base mb-2 text-center md:text-left">
                {artistName}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-[10px] md:text-xs font-mono text-persona-white/70 border-t border-persona-cyan/20 pt-3">
                <div className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 md:w-4 md:h-4 text-persona-cyan" /> RELEASE YEAR: {album?.releaseYear || "N/A"}
                </div>

                <div className="flex items-center gap-1.5 bg-persona-blue/60 border border-persona-cyan/50 px-3 py-1 -skew-x-12 shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                  <Star className="w-3 h-3 md:w-3.5 md:h-3.5 text-persona-cyan fill-persona-cyan skew-x-12" />
                  <span className="font-mono text-[10px] md:text-xs font-bold text-persona-cyan skew-x-12">
                    {stats.totalReviews > 0 ? `${stats.averageRating} / 5.0` : "N/A"}
                  </span>
                  <span className="text-[8px] md:text-[9px] font-mono text-persona-white/50 skew-x-12">({stats.totalReviews})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Faixas e Reviews */}
        <div className="lg:col-span-7 space-y-6">
          {/* Faixas */}
          <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-4 md:p-6 -skew-x-3 md:-skew-x-6 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
            <div className="skew-x-3 md:skew-x-6">
              <h2 className="text-xs md:text-sm font-mono font-bold text-persona-cyan uppercase tracking-widest mb-4 flex items-center gap-2">
                <ListMusic className="w-4 h-4" /> TRACK LIST ({tracks.length})
              </h2>

              {tracks.length === 0 ? (
                <p className="font-mono text-[10px] md:text-xs text-persona-cyan/60 uppercase text-center py-4">
                  SEM INFORMAÇÃO DE FAIXAS DISPONÍVEL.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 hide-scrollbar">
                  {tracks.map((track) => (
                    <div key={track.id} className="flex justify-between items-center p-2 bg-persona-dark/80 border border-persona-cyan/20 text-[10px] md:text-xs font-mono">
                      <span className="text-persona-cyan truncate pr-2">
                        {track.trackNumber < 10 ? `0${track.trackNumber}` : track.trackNumber}. {track.name}
                      </span>
                      <span className="text-persona-white/50 shrink-0">{(track.durationMs / 60000).toFixed(2)}m</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-4 md:p-6 -skew-x-3 md:-skew-x-6 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
            <div className="skew-x-3 md:skew-x-6">
              <h2 className="text-xs md:text-sm font-mono font-bold text-persona-cyan uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> REVIEWS ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <p className="font-mono text-[10px] md:text-xs text-persona-cyan/60 uppercase text-center py-4">
                  NO REVIEWS AVAILABLE
                </p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 hide-scrollbar">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      onClick={() => { sfx.playClick(); setSelectedReviewModal(rev); }}
                      onMouseEnter={() => sfx.playHover()}
                      className="bg-persona-dark/90 border border-persona-cyan/30 hover:border-persona-cyan p-3 space-y-1.5 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-center text-[10px] md:text-xs font-mono">
                        <span className="text-persona-cyan font-bold group-hover:underline truncate pr-2">
                          BY {rev.user?.name || "OPERATIVE"}
                        </span>
                        <div className="flex text-persona-cyan shrink-0">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-persona-cyan" />
                          ))}
                        </div>
                      </div>

                      <ExpandableText text={rev.comment} maxLength={100} />

                      <div className="flex justify-between items-center pt-1 text-[9px] md:text-[10px] font-mono text-persona-cyan/60">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-persona-cyan" /> {rev.likesCount || 0} Likes
                        </span>
                        <span>CLICA PARA ABRIR →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReviewDetailModal
        isOpen={!!selectedReviewModal}
        onClose={() => setSelectedReviewModal(null)}
        review={selectedReviewModal}
        onToggleLike={handleToggleLike}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}