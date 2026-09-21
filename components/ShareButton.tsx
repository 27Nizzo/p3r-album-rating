'use client';

import { useState } from 'react';
import { Share2, Check, Copy, ExternalLink } from 'lucide-react';
import { sfx } from '@/lib/sfx';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopyLink = async () => {
    sfx.playClick();
    try {
      await navigator.clipboard.writeText(shareUrl);
      sfx.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  const handleShareTwitter = () => {
    sfx.playClick();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `${text}\n${shareUrl}`
    )}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    sfx.playClick();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${text}${shareUrl}`
    )}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative inline-block">
      {/* Botão Principal de Partilha */}
      <button
        type="button"
        onMouseEnter={() => sfx.playHover()}
        onClick={() => {
          sfx.playClick();
          setIsOpen(!isOpen);
        }}
        className="bg-persona-blue/40 border border-persona-cyan text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark px-3 py-1.5 -skew-x-12 font-black italic text-xs uppercase transition-all flex items-center gap-2 cursor-pointer"
        title="Partilhar"
      >
        <Share2 className="w-3.5 h-3.5 skew-x-12" />
        <span className="skew-x-12">PARTILHAR</span>
      </button>

      {/* Menu Suspenso de Opções de Partilha */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-persona-dark border-2 border-persona-cyan shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 p-2 space-y-1.5 -skew-x-3">
          <div className="skew-x-3 space-y-1.5">
            <p className="font-mono text-[10px] text-persona-cyan/70 uppercase tracking-widest px-2 py-0.5 border-b border-persona-cyan/20">
              OPÇÕES DE PARTILHA
            </p>

            {/* Copiar Link */}
            <button
              type="button"
              onMouseEnter={() => sfx.playHover()}
              onClick={handleCopyLink}
              className="w-full text-left px-2.5 py-1.5 font-mono text-xs text-persona-white hover:bg-persona-blue/50 hover:text-persona-cyan transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-persona-cyan" />
                {copied ? 'LINK COPIADO!' : 'COPIAR LINK'}
              </span>
              {copied && <Check className="w-3.5 h-3.5 text-persona-cyan animate-bounce" />}
            </button>

            {/* Twitter / X */}
            <button
              type="button"
              onMouseEnter={() => sfx.playHover()}
              onClick={handleShareTwitter}
              className="w-full text-left px-2.5 py-1.5 font-mono text-xs text-persona-white hover:bg-persona-blue/50 hover:text-persona-cyan transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-persona-cyan" />
              PARTILHAR NO X / TWITTER
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onMouseEnter={() => sfx.playHover()}
              onClick={handleShareWhatsApp}
              className="w-full text-left px-2.5 py-1.5 font-mono text-xs text-persona-white hover:bg-persona-blue/50 hover:text-persona-cyan transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-persona-cyan" />
              PARTILHAR NO WHATSAPP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}