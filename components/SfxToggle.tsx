'use client';

import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sfx } from '@/lib/sfx';

export default function SfxToggle() {
  const [muted, setMuted] = useState(sfx.isMuted);

  const toggle = () => {
    sfx.isMuted = !sfx.isMuted;
    setMuted(sfx.isMuted);
    if (!sfx.isMuted) sfx.playClick();
  };

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => sfx.playHover()}
      title={muted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos Sonoros'}
      className="bg-persona-dark/90 border border-persona-cyan/50 text-persona-cyan p-1.5 -skew-x-12 hover:bg-persona-cyan hover:text-persona-dark transition-all cursor-pointer"
    >
      <div className="skew-x-12">
        {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
      </div>
    </button>
  );
}