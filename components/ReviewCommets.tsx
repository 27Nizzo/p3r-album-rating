'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessageSquare, Send, Loader2, User, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/lib/sfx';

interface CommentItem {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewCommentsProps {
  reviewId: string;
  onOpenAuthModal: () => void;
}

export default function ReviewComments({ reviewId, onOpenAuthModal }: ReviewCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/reviews/comments?reviewId=${reviewId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, reviewId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      sfx.playClick();
      onOpenAuthModal();
      return;
    }
    if (!newComment.trim() || isSubmitting) return;

    sfx.playClick();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/reviews/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, text: newComment }),
      });

      if (res.ok) {
        sfx.playSuccess();
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Erro ao comentar:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    sfx.playClick();
    try {
      setDeletingId(commentId);
      const res = await fetch('/api/reviews/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      console.error('Erro ao apagar comentário:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
  <div className="w-full flex flex-col items-end">
    {/* Botão de Abrir Respostas (Alinhado à direita) */}
    <button
      type="button"
      onMouseEnter={() => sfx.playHover()}
      onClick={() => {
        sfx.playClick();
        setIsOpen(!isOpen);
      }}
      className="flex items-center gap-1.5 text-[10px] font-mono text-persona-cyan hover:underline uppercase font-bold cursor-pointer"
    >
      <MessageSquare className="w-3 h-3" />
      <span>{isOpen ? 'OCULTAR RESPOSTAS' : `RESPOSTAS (${comments.length})`}</span>
    </button>

    {/* Caixa de Comentários (Largura total abaixo do cartão) */}
    {isOpen && (
      <div className="w-full mt-2 space-y-3 bg-persona-dark/80 p-3 border border-persona-cyan/40 text-left">
        {isLoading ? (
          <div className="flex items-center gap-2 text-persona-cyan font-mono text-[10px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>A CARREGAR RESPOSTAS...</span>
          </div>
        ) : comments.length === 0 ? (
          <p className="font-mono text-[10px] text-persona-white/50 uppercase">
            SEM RESPOSTAS AINDA. SEJA O PRIMEIRA A RESPONDER!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="border-b border-persona-cyan/10 pb-2 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <Link
                  href={`/profile/${c.user.id}`}
                  className="flex items-center gap-1.5 text-persona-cyan font-bold hover:underline uppercase"
                >
                  <div className="w-3.5 h-3.5 rounded-full border border-persona-cyan overflow-hidden bg-persona-blue/40 flex items-center justify-center">
                    {c.user.image ? (
                      <img src={c.user.image} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-2 h-2 text-persona-cyan" />
                    )}
                  </div>
                  <span>{c.user.name || 'OPERATIVE'}</span>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="text-persona-white/40 text-[9px]">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                  {session?.user?.email && session.user.name === c.user.name && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={deletingId === c.id}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Apagar resposta"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs font-mono text-persona-white/90 leading-relaxed break-words">
                {c.text}
              </p>
            </div>
          ))
        )}

        {/* Form de Resposta */}
        <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={session ? "ESCREVE UMA RESPOSTA..." : "FAZ LOGIN PARA RESPONDER..."}
            className="flex-1 bg-persona-dark border border-persona-cyan/40 px-2.5 py-1 text-xs font-mono text-persona-white placeholder-persona-cyan/30 focus:border-persona-cyan focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            onMouseEnter={() => sfx.playHover()}
            className="bg-persona-cyan text-persona-dark px-3 py-1 font-mono text-xs font-bold uppercase hover:bg-white transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </button>
        </form>
      </div>
    )}
  </div>
);
}