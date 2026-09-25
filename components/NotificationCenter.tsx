'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Sparkles, Loader2, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { sfx } from '@/lib/sfx';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Consulta a cada 15s
    return () => clearInterval(interval);
  }, [session]);

  // Fechar o dropdown ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    sfx.playClick();
    try {
      setLoading(true);
      const res = await fetch('/api/notifications', { method: 'PUT', body: JSON.stringify({}) });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Erro ao marcar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sininho */}
      <button
        type="button"
        onClick={() => {
          sfx.playClick();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => sfx.playHover()}
        className="relative p-2 md:p-3 bg-persona-blue/40 border border-persona-cyan/50 text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark transition-all -skew-x-12 cursor-pointer flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.2)]"
        title="Notificações"
      >
        <Bell className="w-4 h-4 md:w-5 md:h-5 skew-x-12" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Painel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 sm:w-80 md:w-96 bg-persona-dark/95 backdrop-blur-md border-2 border-persona-cyan shadow-[0_10px_30px_rgba(0,229,255,0.3)] z-50 p-3 md:p-4 space-y-3 rounded-br-lg rounded-tl-lg">
          <div className="flex justify-between items-center border-b border-persona-cyan/30 pb-2">
            <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2 py-0.5 font-black italic text-[10px] -skew-x-12 uppercase">
              <Sparkles className="w-3 h-3 skew-x-12" /> SYSTEM ALERT
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-persona-cyan hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 hide-scrollbar">
            {notifications.length === 0 ? (
              <p className="font-mono text-[10px] text-persona-cyan/60 uppercase text-center py-8">
                NENHUM ALERTA REGISTADO.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-2.5 md:p-3 border text-xs font-mono transition-all ${
                    n.read
                      ? 'bg-persona-dark/60 border-persona-cyan/20 text-persona-white/50'
                      : 'bg-persona-blue/30 border-persona-cyan text-persona-white shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5 gap-2">
                    <span className="font-black italic text-persona-cyan uppercase text-[10px] md:text-xs truncate">{n.title}</span>
                    <span className="text-[8px] md:text-[9px] text-persona-cyan/50 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-xs leading-snug">{n.message}</p>
                </div>
              ))
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={loading}
              className="w-full mt-2 bg-persona-cyan/10 border border-persona-cyan text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark py-2 text-[10px] md:text-xs font-mono uppercase font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              MARCAR COMO LIDAS
            </button>
          )}
        </div>
      )}
    </div>
  );
}