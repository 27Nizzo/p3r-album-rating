'use client';

import { useState, useEffect, use } from 'react';
import {
  Disc,
  Star,
  Music,
  ArrowLeft,
  Loader2,
  ListMusic,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import SfxToggle from '@/components/SfxToggle';
import ShareButton from '@/components/ShareButton';
import { sfx } from '@/lib/sfx';
import ExpandableText from '@/components/ExpandableText';

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
  rating: number;
  comment: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

export default function AlbumDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: albumId } = use(params);

  const [album, setAlbum] = useState<{
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    releaseYear: string;
  } | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ averageRating: number; totalReviews: number }>({
    averageRating: 0,
    totalReviews: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setIsLoading(true);

        // 1. Carregar Músicas do Spotify
        const resTracks = await fetch(`/api/spotify/album/${albumId}`);
        if (resTracks.ok) {
          const dataTracks = await resTracks.json();
          setTracks(dataTracks.tracks || []);
          if (dataTracks.tracks && dataTracks.tracks.length > 0) {
            // Tentar extrair dados básicos se disponíveis
          }
        }

        // 2. Carregar Estatísticas e Reviews do Álbum
        const resStats = await fetch(`/api/reviews/album/${albumId}`);
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setStats(dataStats);
        }

        // 3. Carregar Reviews da Comunidade para este Álbum
        const resReviews = await fetch(`/api/reviews`);
        if (resReviews.ok) {
          const dataReviews = await resReviews.json();
          const filtered = (dataReviews.reviews || []).filter(
            (r: any) => r.albumId === albumId
          );
          setReviews(filtered);

          if (filtered.length > 0) {
            setAlbum({
              id: albumId,
              title: filtered[0].albumTitle,
              artist: filtered[0].artistName,
              coverUrl: filtered[0].coverUrl,
              releaseYear: filtered[0].releaseYear || 'N/A',
            });
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dossiê do álbum:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumData();
  }, [albumId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-persona-dark flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-persona-cyan animate-spin" />
      </div>
    );
  }

  const albumTitle = album?.title || 'VELVET DOSSIER';
  const artistName = album?.artist || 'ARTIST';

  return (
    <main className="min-h-screen bg-persona-dark text-persona-white relative overflow-hidden p-6 md:p-12 pb-28 p3r-grid-bg">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-persona-blue/20 blur-[140px] -z-10 rounded-full" />
      <div className="absolute inset-0 p3r-scanlines pointer-events-none -z-10 opacity-40" />

      {/* CABEÇALHO COM BOTÃO DE PARTILHA */}
      <div className="flex justify-between items-center border-b-2 border-persona-cyan/30 pb-4 mb-8">
        <Link
          href="/"
          onMouseEnter={() => sfx.playHover()}
          onClick={() => sfx.playClick()}
          className="flex items-center gap-2 bg-persona-blue/40 border border-persona-cyan px-4 py-1.5 -skew-x-12 text-xs font-mono text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 skew-x-12" />
          <span className="skew-x-12 font-bold uppercase">VOLTAR À HOMEPAGE</span>
        </Link>

        <div className="flex items-center gap-3">
          <ShareButton
            title={albumTitle}
            text={`Vê as análises e a lista de faixas do álbum "${albumTitle}" de ${artistName} no Velvet Records!`}
          />
          <SfxToggle />
        </div>
      </div>

      {/* CARTÃO PRINCIPAL DO ÁLBUM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className="lg:col-span-5">
          <div className="bg-persona-blue/30 border-2 border-persona-cyan p-6 -skew-x-6 shadow-[0_0_25px_rgba(0,229,255,0.25)]">
            <div className="skew-x-6">
              <div className="inline-flex items-center gap-1 text-xs font-bold uppercase bg-persona-cyan text-persona-dark px-2.5 py-1 mb-4">
                <Sparkles className="w-3.5 h-3.5" /> DOSSIÊ DE ÁLBUM
              </div>

              <div className="relative aspect-square bg-gradient-to-br from-persona-blue to-persona-dark border-2 border-persona-cyan mb-4 overflow-hidden flex items-center justify-center">
                {album?.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={albumTitle}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className="w-32 h-32 text-persona-cyan/40" />
                )}
              </div>

              <h1 className="text-3xl font-black uppercase italic tracking-tight text-persona-white leading-tight">
                {albumTitle}
              </h1>
              <p className="text-persona-cyan font-bold tracking-widest uppercase text-base mb-2">
                {artistName}
              </p>

              <div className="flex items-center justify-between mt-4 text-xs font-mono text-persona-white/70 border-t border-persona-cyan/20 pt-3">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-persona-cyan" /> RELEASE YEAR:{' '}
                  {album?.releaseYear || 'N/A'}
                </div>

                <div className="flex items-center gap-1.5 bg-persona-blue/60 border border-persona-cyan/50 px-2.5 py-1 -skew-x-12">
                  <Star className="w-3.5 h-3.5 text-persona-cyan fill-persona-cyan skew-x-12" />
                  <span className="font-mono text-xs font-bold text-persona-cyan skew-x-12">
                    {stats.totalReviews > 0 ? `${stats.averageRating} / 5.0` : 'N/A'}
                  </span>
                  <span className="text-[9px] font-mono text-persona-white/50 skew-x-12">
                    ({stats.totalReviews})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAIXAS E REVIEWS DO ÁLBUM */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECÇÃO 1: FAIXAS DO ÁLBUM */}
          <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-6 -skew-x-3">
            <div className="skew-x-3">
              <h2 className="text-sm font-mono font-bold text-persona-cyan uppercase tracking-widest mb-4 flex items-center gap-2">
                <ListMusic className="w-4 h-4" /> LISTA DE FAIXAS ({tracks.length})
              </h2>

              {tracks.length === 0 ? (
                <p className="font-mono text-xs text-persona-cyan/60 uppercase text-center py-4">
                  SEM INFORMAÇÃO DE FAIXAS DISPONÍVEL.
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex justify-between items-center p-2 bg-persona-dark/80 border border-persona-cyan/20 text-xs font-mono"
                    >
                      <span className="text-persona-cyan">
                        {track.trackNumber < 10 ? `0${track.trackNumber}` : track.trackNumber}. {track.name}
                      </span>
                      <span className="text-persona-white/50">
                        {(track.durationMs / 60000).toFixed(2)}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECÇÃO 2: REVIEWS DA COMUNIDADE PARA ESTE ÁLBUM */}
          <div className="bg-persona-glass backdrop-blur-md border-2 border-persona-cyan/40 p-6 -skew-x-3">
            <div className="skew-x-3">
              <h2 className="text-sm font-mono font-bold text-persona-cyan uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> ANÁLISES DA COMUNIDADE ({reviews.length})
              </h2>

              {reviews.length === 0 ? (
                <p className="font-mono text-xs text-persona-cyan/60 uppercase text-center py-4">
                  AINDA NÃO EXISTEM REVIEWS PARA ESTE ÁLBUM.
                </p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-persona-dark/90 border border-persona-cyan/30 p-3 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-persona-cyan font-bold">
                          BY {rev.user?.name || 'OPERATIVE'}
                        </span>
                        <div className="flex text-persona-cyan">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-persona-cyan" />
                          ))}
                        </div>
                      </div>
                      <ExpandableText text={rev.comment} maxLength={100} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}