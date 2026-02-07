import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  CheckSquare, 
  Gift, 
  ShoppingBag, 
  History, 
  User, 
  LogOut,
  Sparkles,
  Trophy
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { TasksSection } from './TasksSection';
import { RewardsSection } from './RewardsSection';
import { ShopSection } from './ShopSection';
import { HistorySection } from './HistorySection';
import { ProfileSection } from './ProfileSection';
import { Button } from '@/components/ui/button';
import { COLOR_OPTIONS } from '@/types';

type TabType = 'home' | 'tasks' | 'rewards' | 'shop' | 'history' | 'profile';

interface Tab {
  id: TabType;
  icon: typeof Home;
  label: string;
  badge?: number;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const { currentUser, logout, getPendingTasks, getPendingRewards } = useApp();
  
  const pendingTasks = getPendingTasks();
  const pendingRewards = getPendingRewards();

  const tabs: Tab[] = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'tasks', icon: CheckSquare, label: 'Tarefas', badge: pendingTasks.length },
    { id: 'rewards', icon: Gift, label: 'Recompensas', badge: pendingRewards.length },
    { id: 'shop', icon: ShoppingBag, label: 'Loja' },
    { id: 'history', icon: History, label: 'Histórico' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeSection onChangeTab={setActiveTab} />;
      case 'tasks':
        return <TasksSection />;
      case 'rewards':
        return <RewardsSection />;
      case 'shop':
        return <ShopSection />;
      case 'history':
        return <HistorySection />;
      case 'profile':
        return <ProfileSection />;
      default:
        return <HomeSection onChangeTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.img
              src="/icon.png"
              alt="Nosso App"
              className="w-10 h-10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div>
              <h1 className="font-bold text-lg text-gray-800">Nosso App</h1>
              <p className="text-xs text-gray-500">Gamifique seu amor 💕</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Points display */}
            <motion.div
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full"
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{currentUser?.points || 0} pts</span>
            </motion.div>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-pink-100 z-50">
        <div className="max-w-6xl mx-auto px-2">
          <div className="flex justify-around">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-3 px-4 relative transition-all ${
                  activeTab === tab.id 
                    ? 'text-pink-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="relative">
                  <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-pink-100' : ''}`} />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0 w-8 h-1 bg-pink-500 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}

// Home Section Component
function HomeSection({ onChangeTab }: { onChangeTab: (tab: TabType) => void }) {
  const { currentUser, partner, couple, getPendingTasks, getActivities } = useApp();
  
  const pendingTasks = getPendingTasks();
  const activities = getActivities().slice(0, 5);

  const quickActions = [
    { 
      id: 'tasks', 
      icon: CheckSquare, 
      label: 'Nova Tarefa', 
      color: 'from-blue-400 to-blue-600',
      onClick: () => onChangeTab('tasks')
    },
    { 
      id: 'rewards', 
      icon: Gift, 
      label: 'Sugerir Recompensa', 
      color: 'from-pink-400 to-pink-600',
      onClick: () => onChangeTab('rewards')
    },
    { 
      id: 'shop', 
      icon: ShoppingBag, 
      label: 'Resgatar Vale', 
      color: 'from-purple-400 to-purple-600',
      onClick: () => onChangeTab('shop')
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-love p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex -space-x-3">
              <div 
                className="w-14 h-14 rounded-full border-3 border-white flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === currentUser?.color)?.hex }}
              >
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              {partner && (
                <div 
                  className="w-14 h-14 rounded-full border-3 border-white flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: COLOR_OPTIONS.find(c => c.value === partner?.color)?.hex }}
                >
                  {partner.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {currentUser?.name} {partner && `& ${partner.name}`}
              </h2>
              <p className="text-gray-500 text-sm">
                {partner ? 'Casal conectado 💕' : 'Aguardando parceiro...'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-4">
              <p className="text-sm text-gray-600">Seus pontos</p>
              <p className="text-2xl font-bold text-gradient">{currentUser?.points || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-4">
              <p className="text-sm text-gray-600">Pontos do casal</p>
              <p className="text-2xl font-bold text-yellow-600">{couple?.totalPoints || 0}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Ações rápidas</h3>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              className={`p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white text-center`}
            >
              <action.icon className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-love p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Tarefas pendentes</h3>
            <button 
              onClick={() => onChangeTab('tasks')}
              className="text-pink-600 text-sm font-medium hover:underline"
            >
              Ver todas
            </button>
          </div>
          
          <div className="space-y-3">
            {pendingTasks.slice(0, 3).map((task) => (
              <div 
                key={task.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-pink-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{task.title}</p>
                  <p className="text-sm text-gray-500">{task.points} pontos</p>
                </div>
                <span className="badge-points">
                  <Sparkles className="w-3 h-3" />
                  {task.points}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent activity */}
      {activities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-love p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">Atividades recentes</h3>
          
          <div className="space-y-3">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center gap-3 text-sm"
              >
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <p className="text-gray-600">{activity.description}</p>
                <span className="text-gray-400 text-xs ml-auto">
                  {new Date(activity.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}


