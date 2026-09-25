'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Sparkles, Loader2, X, UserPlus, UserMinus } from 'lucide-react';
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
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [session]);

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
      await fetch('/api/notifications', { method: 'PUT', body: JSON.stringify({}) });
      
      // Atualiza apenas as notificações que NÃO são pedidos pendentes
      setNotifications((prev) => 
        prev.map((n) => n.type.startsWith('CONFIDANT_REQUEST') ? n : { ...n, read: true })
      );
    } catch (err) {
      console.error('Erro ao marcar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfidantAction = async (action: 'ACCEPT' | 'REJECT', targetUserId: string, notificationId: string) => {
    sfx.playClick();
    try {
      // 1. Processa a ligação
      const res = await fetch('/api/confidant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, action }),
      });

      if (res.ok) {
        if (action === 'ACCEPT') sfx.playSuccess();
        // 2. Marca a notificação específica como lida (o que a esconde dos pendentes)
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId }),
        });
        
        // 3. Atualiza estado local
        setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error('Erro ao processar Confidant:', err);
    }
  };

  if (!session) return null;

  // Mostramos se o utilizador tiver notificações não lidas. Exibe a contagem apenas das não lidas.
  return (
    <div className="relative" ref={dropdownRef}>
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

      {isOpen && (
        // O posicionamento aqui foi corrigido: No mobile fica "fixed" ao centro, e no desktop "absolute" alinhado à direita
        <div className="fixed sm:absolute top-24 sm:top-full left-4 right-4 sm:left-auto sm:-right-4 sm:mt-3 w-auto sm:w-80 md:w-96 bg-persona-dark/95 backdrop-blur-md border-2 border-persona-cyan shadow-[0_10px_30px_rgba(0,229,255,0.3)] z-50 p-3 md:p-4 space-y-3 sm:rounded-br-lg sm:rounded-tl-lg">
          <div className="flex justify-between items-center border-b border-persona-cyan/30 pb-2">
            <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-2 py-0.5 font-black italic text-[10px] -skew-x-12 uppercase">
              <Sparkles className="w-3 h-3 skew-x-12" /> SYSTEM ALERT
            </div>
            <button onClick={() => setIsOpen(false)} className="text-persona-cyan hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 hide-scrollbar">
            {notifications.length === 0 ? (
              <p className="font-mono text-[10px] text-persona-cyan/60 uppercase text-center py-8">
                NENHUM ALERTA REGISTADO.
              </p>
            ) : (
              notifications.map((n) => {
                const isRequest = n.type.startsWith('CONFIDANT_REQUEST_');
                // Extrai o ID do sender (se existir e tiver sido enviado na string nova)
                const senderId = isRequest ? n.type.replace('CONFIDANT_REQUEST_', '') : null;

                return (
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
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-xs leading-snug">{n.message}</p>

                    {/* Mostrar botões SE for um pedido E não tiver sido lido/processado */}
                    {isRequest && !n.read && senderId && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleConfidantAction('ACCEPT', senderId, n.id)}
                          onMouseEnter={() => sfx.playHover()}
                          className="flex-1 bg-persona-cyan text-persona-dark py-1.5 -skew-x-12 font-black italic uppercase text-[10px] flex justify-center items-center gap-1 hover:bg-white transition-colors"
                        >
                          <UserPlus className="w-3 h-3 skew-x-12" /> <span className="skew-x-12">ACCEPT</span>
                        </button>
                        <button
                          onClick={() => handleConfidantAction('REJECT', senderId, n.id)}
                          onMouseEnter={() => sfx.playHover()}
                          className="flex-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-1.5 -skew-x-12 font-black italic uppercase text-[10px] flex justify-center items-center gap-1 transition-colors"
                        >
                          <UserMinus className="w-3 h-3 skew-x-12" /> <span className="skew-x-12">REJECT</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* O botão "Limpar" agora apaga apenas as normais */}
          {unreadCount > 0 && notifications.some(n => !n.read && !n.type.startsWith('CONFIDANT_REQUEST')) && (
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