import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, UserPlus, LogIn, Sparkles, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/hooks/useApp';
import { COLOR_OPTIONS } from '@/types';
import type { User } from '@/types';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState<User['color']>('pink');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const success = login(email, password);
        if (!success) {
          setError('Email ou senha incorretos');
        }
      } else {
        const success = register(name, email, password, selectedColor);
        if (!success) {
          setError('Email já cadastrado');
        }
      }
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 text-pink-200"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="w-16 h-16 fill-current" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-10 text-purple-200"
          animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="w-20 h-20 fill-current" />
        </motion.div>
        <motion.div
          className="absolute top-1/3 right-20 text-pink-100"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-12 h-12" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="card-love p-8 relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.img
              src="/logo.png"
              alt="Nosso App"
              className="w-32 h-32 mx-auto mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-gray-500">
              Gamifique seu amor 💕
            </p>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-full">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-white text-pink-600 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-white text-pink-600 shadow-md' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Criar conta
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="name" className="text-gray-700">Nome</Label>
                  <div className="relative mt-1">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-love pl-10"
                      placeholder="Seu nome"
                      required={!isLogin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-love pl-10"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Senha</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-love pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label className="text-gray-700 mb-2 block">Escolha sua cor</Label>
                  <div className="flex gap-3 flex-wrap">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedColor(color.value as 'green' | 'pink' | 'purple' | 'blue' | 'orange')}
                        className={`w-10 h-10 rounded-full transition-all ${
                          selectedColor === color.value 
                            ? 'ring-4 ring-offset-2 ring-pink-300 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-love gradient-love text-white py-6"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Carregando...
                </span>
              ) : isLogin ? (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Entrar
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Criar conta
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isLogin ? (
              <>Ainda não tem conta?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-pink-600 font-medium hover:underline"
                >
                  Crie uma agora
                </button>
              </>
            ) : (
              <>Já tem conta?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-pink-600 font-medium hover:underline"
                >
                  Faça login
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
