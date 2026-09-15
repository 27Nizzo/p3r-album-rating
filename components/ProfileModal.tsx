'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Star, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Review {
  id: string;
  albumTitle: string;
  artistName: string;
  coverUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewDeleted?: () => void;
}

export default function ProfileModal({ isOpen, onClose, onReviewDeleted }: ProfileModalProps) {
  const { data: session } = useSession();
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUserReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reviews/user');
      const data = await res.json();
      if (data.reviews) setUserReviews(data.reviews);
    } catch (err) {
      console.error('Erro ao carregar críticas do perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserReviews();
    }
  }, [isOpen]);

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
        if (onReviewDeleted) onReviewDeleted();
      }
    } catch (err) {
      console.error('Erro ao apagar:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay com Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-persona-dark/85 backdrop-blur-md"
        />

        {/* Modal Principal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-3xl bg-persona-dark border-2 border-persona-cyan shadow-[0_0_50px_rgba(0,229,255,0.3)] p-6 z-10 -skew-x-3 max-h-[85vh] flex flex-col"
        >
          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-persona-cyan hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 skew-x-3" />
          </button>

          {/* Cabeçalho do Perfil */}
          <div className="skew-x-3 flex items-center gap-4 border-b-2 border-persona-cyan/40 pb-4 mb-4">
            <div className="w-14 h-14 border-2 border-persona-cyan bg-persona-blue/40 flex items-center justify-center overflow-hidden shrink-0">
              {session?.user?.image ? (
                <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-persona-cyan" />
              )}
            </div>

            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2.5 py-0.5 font-black italic text-[10px] -skew-x-12 uppercase mb-1">
                <Sparkles className="w-3 h-3 skew-x-12" /> OPERATIVE PROFILE
              </div>
              <h2 className="text-2xl font-black italic uppercase text-white truncate">
                {session?.user?.name || 'Membro do Velvet'}
              </h2>
              <p className="font-mono text-xs text-persona-cyan/80 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>

          {/* Título da Seção */}
          <div className="skew-x-3 mb-3 flex justify-between items-center">
            <span className="font-mono text-xs text-persona-cyan uppercase font-bold tracking-wider">
              MY REVIEWS ({userReviews.length})
            </span>
          </div>

          {/* Lista de Reviews do Utilizador */}
          <div className="skew-x-3 overflow-y-auto pr-2 space-y-3 flex-1 scrollbar-thin scrollbar-thumb-persona-cyan scrollbar-track-persona-dark">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-persona-cyan animate-spin mx-auto mb-2" />
                <p className="font-mono text-xs text-persona-cyan/70 uppercase">
                  A CARREGAR AS TUAS CRÍTICAS...
                </p>
              </div>
            ) : userReviews.length === 0 ? (
              <div className="bg-persona-dark/60 border border-persona-cyan/30 p-8 text-center">
                <p className="font-mono text-xs text-persona-cyan/60 uppercase">
                  AINDA NÃO SUBMETESTE NENHUMA CRÍTICA.
                </p>
              </div>
            ) : (
              userReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-persona-dark/90 border border-persona-cyan/40 p-3 flex items-center justify-between gap-4 group hover:border-persona-cyan transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {rev.coverUrl && (
                      <img
                        src={rev.coverUrl}
                        alt={rev.albumTitle}
                        className="w-12 h-12 object-cover border border-persona-cyan shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-black italic text-xs text-persona-cyan uppercase truncate">
                        {rev.albumTitle}
                      </p>
                      <p className="text-[10px] font-mono text-persona-white/60 uppercase truncate">
                        {rev.artistName}
                      </p>
                      <p className="text-xs font-mono text-persona-white/90 truncate mt-0.5">
                        "{rev.comment}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex text-persona-cyan">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-persona-cyan" />
                      ))}
                    </div>

                    <button
                      onClick={() => handleDelete(rev.id)}
                      disabled={deletingId === rev.id}
                      className="text-red-400 hover:text-red-300 transition-colors p-1.5 border border-red-500/30 hover:border-red-500 bg-red-500/10 cursor-pointer disabled:opacity-40"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}