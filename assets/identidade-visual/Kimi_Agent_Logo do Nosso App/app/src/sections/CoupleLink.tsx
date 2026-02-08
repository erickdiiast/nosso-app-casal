
import { motion } from 'framer-motion';
import { Users, Info } from 'lucide-react';
import { useApp } from '@/hooks/useApp';

export function CoupleLink() {
  const { currentUser } = useApp();

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
          <p className="text-gray-500 mb-6">
            Para se conectar com seu parceiro(a), use o seu código no perfil
          </p>

          {/* Código do usuário */}
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Seu código de usuário</p>
            <code className="text-3xl font-bold text-gradient tracking-wider">
              {currentUser?.userCode || '------'}
            </code>
            <p className="text-xs text-gray-500 mt-2">
              Compartilhe este código com seu parceiro(a)
            </p>
          </div>

          {/* Instruções */}
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Como conectar:</p>
                <ol className="text-sm text-blue-700 mt-1 space-y-1 list-decimal list-inside">
                  <li>Compartilhe seu código com seu parceiro</li>
                  <li>Peça o código dele também</li>
                  <li>Vá no <strong>Perfil</strong> e insira o código</li>
                  <li>Pronto! Vocês estarão conectados</li>
                </ol>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Ir para o app mesmo sem casal - o vínculo é feito no perfil
                window.location.href = '/';
              }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold transition-all hover:shadow-lg"
            >
              <Users className="w-5 h-5 inline mr-2" />
              Ir para o App
            </motion.button>

            <p className="text-xs text-gray-400 text-center">
              Você pode conectar com seu parceiro a qualquer momento no menu Perfil
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
