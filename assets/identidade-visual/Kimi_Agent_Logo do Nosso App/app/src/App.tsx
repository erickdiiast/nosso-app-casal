import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { AppProvider, useApp } from '@/hooks/useApp';
import { AuthScreen } from '@/sections/AuthScreen';
import { CoupleLink } from '@/sections/CoupleLink';
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
  const { currentUser, couple, isLoading, refreshState } = useApp();

  // Refresh state periodically to check for partner updates
  useEffect(() => {
    if (currentUser && couple) {
      const interval = setInterval(() => {
        refreshState();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentUser, couple, refreshState]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Not logged in - show auth screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  // Logged in but not linked to a couple
  if (!couple) {
    return <CoupleLink />;
  }

  // Fully logged in and linked - show dashboard
  return <Dashboard />;
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
