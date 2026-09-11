'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');

        const loginRes = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (loginRes?.error) setError('Conta criada, mas ocorreu um erro ao entrar.');
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
            className="absolute inset-0 bg-persona-dark/85 backdrop-blur-md"
          />

          {/* Modal Principal Split-Screen */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-3xl bg-persona-dark border-2 border-persona-cyan shadow-[0_0_50px_rgba(0,229,255,0.3)] overflow-hidden z-10 flex min-h-[500px]"
          >
            {/* Botão Fechar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-persona-cyan hover:text-white transition-colors z-40 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Formulário de Sign Up (Fica no Lado Direito quando ativo) */}
            <div className={`w-1/2 p-8 flex flex-col justify-center transition-all duration-500 absolute top-0 bottom-0 right-0 ${isSignUp ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <h3 className="text-2xl font-black italic uppercase text-persona-cyan mb-4">SIGN UP</h3>
              
              {error && isSignUp && (
                <div className="mb-3 bg-red-500/20 border border-red-500 p-2 text-red-400 text-[10px] font-mono uppercase">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-persona-cyan/80 uppercase mb-1">NAME</label>
                  <input
                    type="text"
                    required={isSignUp}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Joe Bloggs"
                    className="w-full bg-persona-dark/90 border border-persona-cyan/40 p-2 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-persona-cyan/80 uppercase mb-1">EMAIL</label>
                  <input
                    type="email"
                    required={isSignUp}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    className="w-full bg-persona-dark/90 border border-persona-cyan/40 p-2 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-persona-cyan/80 uppercase mb-1">PASSWORD</label>
                  <input
                    type="password"
                    required={isSignUp}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-persona-dark/90 border border-persona-cyan/40 p-2 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-persona-cyan text-persona-dark font-black italic uppercase py-2.5 -skew-x-12 hover:bg-white transition-all text-xs mt-2 flex justify-center items-center cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin skew-x-12" /> : <span className="skew-x-12">SIGN UP</span>}
                </button>
              </form>

              <div className="relative my-3 text-center">
                <span className="font-mono text-[9px] text-persona-white/40 uppercase">OR</span>
              </div>

              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full bg-persona-blue/30 border border-persona-cyan/50 text-persona-white hover:bg-persona-cyan hover:text-persona-dark font-mono text-xs py-2 flex items-center justify-center gap-2 transition-all -skew-x-12 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 skew-x-12" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="skew-x-12 font-bold uppercase italic text-[11px]">GOOGLE</span>
              </button>
            </div>

            {/* Formulário de Login (Fica no Lado Esquerdo quando ativo) */}
            <div className={`w-1/2 p-8 flex flex-col justify-center transition-all duration-500 absolute top-0 bottom-0 left-0 ${!isSignUp ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <h3 className="text-2xl font-black italic uppercase text-persona-cyan mb-4">LOGIN</h3>
              
              {error && !isSignUp && (
                <div className="mb-3 bg-red-500/20 border border-red-500 p-2 text-red-400 text-[10px] font-mono uppercase">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-persona-cyan/80 uppercase mb-1">EMAIL</label>
                  <input
                    type="email"
                    required={!isSignUp}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    className="w-full bg-persona-dark/90 border border-persona-cyan/40 p-2 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-persona-cyan/80 uppercase mb-1">PASSWORD</label>
                  <input
                    type="password"
                    required={!isSignUp}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-persona-dark/90 border border-persona-cyan/40 p-2 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-persona-cyan text-persona-dark font-black italic uppercase py-2.5 -skew-x-12 hover:bg-white transition-all text-xs mt-2 flex justify-center items-center cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin skew-x-12" /> : <span className="skew-x-12">LOGIN</span>}
                </button>
              </form>

              <div className="relative my-3 text-center">
                <span className="font-mono text-[9px] text-persona-white/40 uppercase">OR</span>
              </div>

              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="w-full bg-persona-blue/30 border border-persona-cyan/50 text-persona-white hover:bg-persona-cyan hover:text-persona-dark font-mono text-xs py-2 flex items-center justify-center gap-2 transition-all -skew-x-12 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 skew-x-12" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="skew-x-12 font-bold uppercase italic text-[11px]">GOOGLE</span>
              </button>
            </div>

            {/* Painel Deslizante de Boas-Vindas (Side Panel Azul) */}
            <motion.div
              initial={false}
              animate={{ x: isSignUp ? '0%' : '100%' }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-br from-persona-blue to-persona-dark border-x-2 border-persona-cyan p-8 flex flex-col justify-between z-30 overflow-hidden shadow-2xl"
            >
              <div className="space-y-4 my-auto text-center relative z-10">
                <div className="inline-flex items-center gap-1.5 bg-persona-cyan text-persona-dark px-3 py-1 font-black italic text-xs -skew-x-12 uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5 skew-x-12" /> VELVET SYSTEM
                </div>
                
                <h2 className="text-3xl font-black italic tracking-wider uppercase text-white leading-tight">
                  {isSignUp ? 'WELCOME BACK' : 'HELLO THERE'}
                </h2>
                
                <p className="font-mono text-xs text-persona-white/70 max-w-xs mx-auto leading-relaxed">
                  {isSignUp
                    ? 'Já tens uma conta ativa? Entra para gerir as tuas críticas de álbuns.'
                    : 'Começa a tua jornada musical e avalia os teus discos favoritos hoje.'}
                </p>

                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="mt-6 border-2 border-persona-cyan text-persona-cyan hover:bg-persona-cyan hover:text-persona-dark font-black italic text-xs uppercase px-8 py-2.5 -skew-x-12 transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)] cursor-pointer"
                >
                  <span className="skew-x-12">{isSignUp ? 'LOGIN' : 'SIGN UP'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}