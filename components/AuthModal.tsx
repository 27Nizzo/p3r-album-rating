'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false); // NOVO ESTADO
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validação Frontend Rápida
    if (isSignUp) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('A password precisa de 8+ caracteres, 1 maiúscula e 1 número.');
        return;
      }
    }

    setLoading(true);

    if (isSignUp) {
      try {
        const res = await fetch('/api/register', {
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-persona-dark/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-3xl bg-persona-dark border-2 border-persona-cyan shadow-[0_0_50px_rgba(0,229,255,0.3)] overflow-hidden z-10 flex min-h-[500px]"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-persona-cyan hover:text-white transition-colors z-40 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* FORMULÁRIO DE SIGN UP */}
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required={isSignUp}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-persona-dark/90 border border-persona-cyan/40 p-2 pr-10 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-persona-cyan/70 hover:text-persona-cyan transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-persona-cyan text-persona-dark font-black italic uppercase py-2.5 -skew-x-12 hover:bg-white transition-all text-xs mt-2 flex justify-center items-center cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin skew-x-12" /> : <span className="skew-x-12">SIGN UP</span>}
                </button>
              </form>
            </div>

            {/* FORMULÁRIO DE LOGIN */}
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!isSignUp}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-persona-dark/90 border border-persona-cyan/40 p-2 pr-10 text-persona-white font-mono text-xs focus:border-persona-cyan focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-persona-cyan/70 hover:text-persona-cyan transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-persona-cyan text-persona-dark font-black italic uppercase py-2.5 -skew-x-12 hover:bg-white transition-all text-xs mt-2 flex justify-center items-center cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin skew-x-12" /> : <span className="skew-x-12">LOGIN</span>}
                </button>
              </form>
            </div>

            {/* PAINEL DESLIZANTE */}
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
                  onClick={() => { 
                    setIsSignUp(!isSignUp); 
                    setError(''); 
                    setPassword(''); // Limpa a password ao trocar de aba
                  }}
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