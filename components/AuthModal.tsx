'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn, UserPlus, Sparkles, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');

        // Login automático após registo bem-sucedido
        const loginRes = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.error) setError('Conta criada, mas ocorreu um erro no login.');
        else onClose();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      setLoading(false);
      if (res?.error) {
        setError('Credenciais inválidas.');
      } else {
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay com Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-persona-dark/80 backdrop-blur-md"
          />

          {/* Card Principal P3R */}
          <motion.div
            initial={{ scale: 0.8, rotate: -4, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.8, rotate: 4, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-md bg-persona-dark border-4 border-persona-cyan p-8 shadow-[0_0_50px_rgba(0,229,255,0.4)] -skew-x-6 z-10"
          >
            <div className="skew-x-6">
              {/* Botão Fechar */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 text-persona-cyan hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Título Estilizado */}
              <div className="flex items-center gap-2 mb-6 border-b-2 border-persona-cyan/40 pb-3">
                <Sparkles className="w-5 h-5 text-persona-cyan" />
                <h2 className="text-2xl font-black italic tracking-wider uppercase">
                  SYSTEM // <span className="text-persona-cyan">{mode === 'login' ? 'ACCESS' : 'INITIALIZE'}</span>
                </h2>
              </div>

              {/* Toggle Login / Sign Up */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className={`flex-1 py-2 -skew-x-12 font-black italic text-xs uppercase transition-all flex items-center justify-center gap-1 ${
                    mode === 'login'
                      ? 'bg-persona-cyan text-persona-dark border-2 border-persona-cyan'
                      : 'bg-persona-blue/20 text-persona-white border-2 border-persona-blue/40'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 skew-x-12" />
                  <span className="skew-x-12">LOGIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  className={`flex-1 py-2 -skew-x-12 font-black italic text-xs uppercase transition-all flex items-center justify-center gap-1 ${
                    mode === 'signup'
                      ? 'bg-persona-cyan text-persona-dark border-2 border-persona-cyan'
                      : 'bg-persona-blue/20 text-persona-white border-2 border-persona-blue/40'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 skew-x-12" />
                  <span className="skew-x-12">SIGN UP</span>
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-500/20 border border-red-500 p-2 text-red-400 text-xs font-mono uppercase">
                  {error}
                </div>
              )}

              {/* Formulário Manual */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-mono text-persona-cyan uppercase tracking-widest mb-1">
                      USER NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="NOME DE UTILIZADOR..."
                      className="w-full bg-persona-dark/90 border border-persona-cyan/50 p-2.5 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none uppercase"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono text-persona-cyan uppercase tracking-widest mb-1">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="EXEMPLO@EMAIL.COM..."
                    className="w-full bg-persona-dark/90 border border-persona-cyan/50 p-2.5 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-persona-cyan uppercase tracking-widest mb-1">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-persona-dark/90 border border-persona-cyan/50 p-2.5 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-persona-blue border border-persona-cyan text-persona-white hover:bg-persona-cyan hover:text-persona-dark py-3 -skew-x-12 font-black italic uppercase transition-all flex items-center justify-center gap-2 group mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin skew-x-12" />
                  ) : (
                    <span className="skew-x-12">{mode === 'login' ? 'ENTER VELVET ROOM' : 'CREATE ACCOUNT'}</span>
                  )}
                </button>
              </form>

              {/* Separador */}
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-persona-cyan/20"></div>
                </div>
                <span className="relative bg-persona-dark px-3 font-mono text-[10px] text-persona-cyan/60 uppercase">
                  OR AUTHENTICATE WITH
                </span>
              </div>

              {/* Botão Google */}
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full bg-white text-black font-bold py-2.5 -skew-x-12 border border-white hover:bg-persona-cyan transition-all flex items-center justify-center gap-3 text-xs uppercase italic"
              >
                <svg className="w-4 h-4 skew-x-12" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="skew-x-12">CONTINUE WITH GOOGLE</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}