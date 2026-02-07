import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Link2, Users, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/hooks/useApp';

export function CoupleLink() {
  const [inviteCode, setInviteCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  
  const { currentUser, createCouple, joinCouple } = useApp();

  const handleCreateCouple = () => {
    const code = createCouple();
    setInviteCode(code);
    setMode('create');
  };

  const handleJoinCouple = () => {
    if (!inputCode.trim()) {
      setError('Digite um código de convite');
      return;
    }
    
    const success = joinCouple(inputCode.trim().toUpperCase());
    if (!success) {
      setError('Código inválido ou já utilizado');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="card-love p-8 text-center">
            <motion.img
              src="/logo.png"
              alt="Nosso App"
              className="w-28 h-28 mx-auto mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Bem-vindo, {currentUser?.name}! 💕
            </h2>
            <p className="text-gray-500 mb-8">
              Para começar, você precisa se conectar com seu parceiro(a)
            </p>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateCouple}
                className="w-full p-6 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-left transition-all hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Link2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Criar um novo casal</h3>
                    <p className="text-white/80 text-sm">Gere um código de convite</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto" />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode('join')}
                className="w-full p-6 rounded-2xl bg-white border-2 border-pink-200 text-left transition-all hover:border-pink-400 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Juntar-se a um casal</h3>
                    <p className="text-gray-500 text-sm">Digite o código do seu parceiro</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto text-gray-400" />
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="card-love p-8 text-center">
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-teal-500 mb-6"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Código gerado! 🎉
            </h2>
            <p className="text-gray-500 mb-6">
              Compartilhe este código com seu parceiro(a)
            </p>

            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Código de convite</p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-3xl font-bold text-gradient tracking-wider">
                  {inviteCode}
                </code>
                <Button
                  onClick={copyCode}
                  variant="outline"
                  className="rounded-full border-pink-300 hover:bg-pink-50"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl mb-6">
              <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-sm text-yellow-700 text-left">
                Aguarde seu parceiro(a) inserir o código. A página será atualizada automaticamente.
              </p>
            </div>

            <Button
              onClick={() => window.location.reload()}
              className="w-full btn-love gradient-love text-white"
            >
              Verificar conexão
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="card-love p-8">
            <button
              onClick={() => {
                setMode('select');
                setError('');
              }}
              className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-2"
            >
              ← Voltar
            </button>

            <div className="text-center mb-6">
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Users className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Juntar-se ao casal
              </h2>
              <p className="text-gray-500">
                Digite o código de 6 caracteres do seu parceiro(a)
              </p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  setError('');
                }}
                className="input-love text-center text-2xl font-bold tracking-widest uppercase"
                placeholder="XXXXXX"
                maxLength={6}
              />

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
                onClick={handleJoinCouple}
                disabled={inputCode.length !== 6}
                className="w-full btn-love gradient-love text-white py-6"
              >
                <Link2 className="w-5 h-5 mr-2" />
                Conectar-se
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
