"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Flame,
  User,
  MessageSquare,
  Sparkles,
  Disc,
} from "lucide-react";
import Link from "next/link";
import ReviewComments from "@/components/ReviewComments";
import { sfx } from "@/lib/sfx";

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
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
  } | null;
  onToggleLike: (reviewId: string) => void;
  onOpenAuthModal: () => void;
}

export default function ReviewDetailModal({
  isOpen,
  onClose,
  review,
  onToggleLike,
  onOpenAuthModal,
}: ReviewDetailModalProps) {
  if (!isOpen || !review) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-persona-dark border-2 border-persona-cyan p-6 -skew-x-3 shadow-[0_0_40px_rgba(0,229,255,0.3)] max-h-[90vh] overflow-y-auto"
        >
          <div className="skew-x-3 space-y-5">
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center border-b-2 border-persona-cyan/40 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-persona-cyan animate-pulse" />
                <h2 className="text-lg font-black italic uppercase text-persona-white tracking-wider">
                  OPERATIVE <span className="text-persona-cyan">ANALYSIS</span>
                </h2>
              </div>
              <button
                onClick={() => {
                  sfx.playClick();
                  onClose();
                }}
                onMouseEnter={() => sfx.playHover()}
                className="p-1 text-persona-cyan hover:text-white border border-persona-cyan/50 hover:border-persona-cyan bg-persona-blue/30 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informação do Álbum & Autor */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-persona-blue/20 border border-persona-cyan/30 p-4 -skew-x-3">
              <div className="skew-x-3 flex items-center gap-3">
                {review.coverUrl ? (
                  <img
                    src={review.coverUrl}
                    alt={review.albumTitle}
                    className="w-14 h-14 object-cover border border-persona-cyan shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-persona-blue border border-persona-cyan flex items-center justify-center shrink-0">
                    <Disc className="w-6 h-6 text-persona-cyan" />
                  </div>
                )}
                <div>
                  <h3 className="font-black italic text-persona-cyan text-base uppercase leading-tight">
                    {review.albumTitle}
                  </h3>
                  <p className="text-xs font-mono text-persona-white/70 uppercase">
                    {review.artistName}
                  </p>
                </div>
              </div>

              {/* Informação do Autor */}
              <div className="skew-x-3 flex items-center gap-2 shrink-0">
                {review.user ? (
                  <Link
                    href={`/profile/${review.user.id}`}
                    onClick={() => {
                      sfx.playClick();
                      onClose();
                    }}
                    onMouseEnter={() => sfx.playHover()}
                    className="flex items-center gap-2 bg-persona-dark/80 border border-persona-cyan/50 px-3 py-1.5 hover:border-persona-cyan transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full border border-persona-cyan overflow-hidden bg-persona-blue/40 flex items-center justify-center shrink-0">
                      {review.user.image ? (
                        <img
                          src={review.user.image}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3.5 h-3.5 text-persona-cyan" />
                      )}
                    </div>
                    <span className="text-xs font-mono text-persona-cyan font-bold uppercase truncate max-w-[120px]">
                      {review.user.name || "OPERATIVE"}
                    </span>
                  </Link>
                ) : (
                  <span className="text-xs font-mono text-persona-white/40 uppercase">
                    ANONYMOUS
                  </span>
                )}
              </div>
            </div>

            {/* Avaliação (Estrelas) e Data */}
            <div className="flex justify-between items-center border-b border-persona-cyan/20 pb-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating
                        ? "text-persona-cyan fill-persona-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
                        : "text-persona-blue/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-mono text-persona-cyan/60">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Texto Completo da Review */}
            <div className="bg-persona-dark/90 border border-persona-cyan/40 p-4 font-mono text-xs text-persona-white/90 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </div>

            {/* Ações (Botão de Like) */}
            <div className="flex justify-between items-center pt-2 border-t border-persona-cyan/20">
              <button
                onClick={() => onToggleLike(review.id)}
                onMouseEnter={() => sfx.playHover()}
                className={`flex items-center gap-2 px-3 py-1.5 border -skew-x-12 transition-all cursor-pointer ${
                  review.isLikedByMe
                    ? "bg-persona-cyan text-persona-dark border-persona-cyan shadow-[0_0_10px_rgba(0,229,255,0.6)] font-bold"
                    : "bg-persona-dark/80 text-persona-cyan border-persona-cyan/50 hover:border-persona-cyan"
                }`}
              >
                <Flame
                  className={`w-4 h-4 skew-x-12 ${
                    review.isLikedByMe ? "fill-persona-dark" : ""
                  }`}
                />
                <span className="skew-x-12 font-mono text-xs uppercase font-bold">
                  {review.likesCount || 0} LIKES
                </span>
              </button>
            </div>

            {/* Secção de Comentários (Largura Total) */}
            <div className="pt-2 border-t border-persona-cyan/20 w-full">
              <ReviewComments
                reviewId={review.id}
                onOpenAuthModal={onOpenAuthModal}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}