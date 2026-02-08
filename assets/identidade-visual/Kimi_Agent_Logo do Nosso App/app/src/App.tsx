import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { AppProvider, useApp } from '@/hooks/useApp';
import { AuthScreen } from '@/sections/AuthScreen';
import { Dashboard } from '@/sections/Dashboard';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full gradient-love mb-6"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Heart className="w-12 h-12 text-white fill-white" />
        </motion.div>
        <motion.h2
          className="text-2xl font-bold text-gradient"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Nosso App
        </motion.h2>
        <p className="text-gray-500 mt-2">Carregando...</p>
      </motion.div>
    </div>
  );
}

// Main app content component
function AppContent() {
  const { currentUser, isLoading } = useApp();
  const [appState, setAppState] = useState<'loading' | 'auth' | 'dashboard'>('loading');

  // Determine which screen to show based on state
  useEffect(() => {
    if (isLoading) {
      setAppState('loading');
      return;
    }

    if (!currentUser) {
      setAppState('auth');
      return;
    }

    // Usuário logado - vai direto pro dashboard
    // O vínculo de casal é feito no Perfil via código de usuário
    setAppState('dashboard');
  }, [isLoading, currentUser]);

  // Render appropriate screen
  switch (appState) {
    case 'loading':
      return <LoadingScreen />;
    case 'auth':
      return <AuthScreen />;
    case 'dashboard':
      return <Dashboard />;
    default:
      return <LoadingScreen />;
  }
}

// Main App component
function App() {
  return (
    <AppProvider>
      <AnimatePresence mode="wait">
        <AppContent />
      </AnimatePresence>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
            color: 'white',
            border: 'none',
          },
        }}
      />
    </AppProvider>
  );
}

export default App;
