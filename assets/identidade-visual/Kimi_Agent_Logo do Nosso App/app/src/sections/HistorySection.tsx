import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  CheckSquare, 
  Gift, 
  ShoppingBag, 
  UserPlus,
  Sparkles,
  Check,
  Clock
} from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { COLOR_OPTIONS } from '@/types';
import type { Activity } from '@/types';

type FilterType = 'all' | 'tasks' | 'rewards' | 'vouchers';

export function HistorySection() {
  const [filter, setFilter] = useState<FilterType>('all');
  const { currentUser, partner, getActivities, tasks, vouchers, rewards } = useApp();

  const activities = getActivities();
  
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return activity.type === 'task_completed';
    if (filter === 'rewards') return ['reward_suggested', 'reward_approved'].includes(activity.type);
    if (filter === 'vouchers') return ['voucher_redeemed', 'voucher_used'].includes(activity.type);
    return true;
  });

  const filterOptions: { value: FilterType; label: string; icon: typeof History }[] = [
    { value: 'all', label: 'Todas', icon: History },
    { value: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { value: 'rewards', label: 'Recompensas', icon: Gift },
    { value: 'vouchers', label: 'Vales', icon: ShoppingBag },
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'task_completed':
        return { icon: CheckSquare, color: 'text-green-500', bg: 'bg-green-100' };
      case 'reward_suggested':
        return { icon: Gift, color: 'text-pink-500', bg: 'bg-pink-100' };
      case 'reward_approved':
        return { icon: Check, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'voucher_redeemed':
        return { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-100' };
      case 'voucher_used':
        return { icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-100' };
      case 'partner_joined':
        return { icon: UserPlus, color: 'text-teal-500', bg: 'bg-teal-100' };
      default:
        return { icon: History, color: 'text-gray-500', bg: 'bg-gray-100' };
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInHours = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return activityDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Histórico</h2>
        <p className="text-gray-500">Todas as atividades do casal 📜</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === option.value
                ? 'bg-pink-500 text-white'
                : 'bg-white text-gray-600 hover:bg-pink-50'
            }`}
          >
            <option.icon className="w-4 h-4" />
            {option.label}
          </button>
        ))}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard 
          icon={CheckSquare}
          label="Tarefas"
          value={tasks.filter(t => t.completed).length}
          color="from-green-400 to-teal-500"
        />
        <StatCard 
          icon={Gift}
          label="Recompensas"
          value={rewards.filter(r => r.status === 'approved').length}
          color="from-pink-400 to-purple-500"
        />
        <StatCard 
          icon={ShoppingBag}
          label="Vales"
          value={vouchers.length}
          color="from-yellow-400 to-orange-500"
        />
      </div>

      {/* Activity list */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="card-love p-8 text-center">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma atividade encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              Comece a usar o app para ver seu histórico!
            </p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type);
            const isMyActivity = activity.userId === currentUser?.id;
            const userColor = isMyActivity 
              ? COLOR_OPTIONS.find(c => c.value === currentUser?.color)?.hex
              : COLOR_OPTIONS.find(c => c.value === partner?.color)?.hex;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-love p-4 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: userColor }}
                    />
                    <span className="text-xs text-gray-500">
                      {isMyActivity ? 'Você' : partner?.name}
                    </span>
                    <span className="text-gray-300">•</span>
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatDate(activity.createdAt)}
                    </span>
                  </div>
                </div>

                {activity.points && (
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                    activity.points > 0 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    <Sparkles className="w-3 h-3" />
                    <span className="font-bold text-sm">
                      {activity.points > 0 ? '+' : ''}{activity.points}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: typeof History;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-2xl bg-gradient-to-br ${color} text-white text-center`}
    >
      <Icon className="w-6 h-6 mx-auto mb-2 opacity-80" />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </motion.div>
  );
}
