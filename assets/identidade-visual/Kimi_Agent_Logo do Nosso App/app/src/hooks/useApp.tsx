import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addWeeks, addMonths } from 'date-fns';
import type { 
  User, 
  Couple, 
  Task, 
  Reward, 
  Voucher, 
  Activity, 
  AppState
} from '@/types';

interface AppContextType extends AppState {
  // Auth
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, color: User['color']) => boolean;
  logout: () => void;
  
  // Couple
  generateInviteCode: () => string;
  joinCouple: (inviteCode: string) => boolean;
  createCouple: () => string;
  unlinkCouple: () => void;
  
  // Tasks
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  completeTask: (taskId: string, proofPhoto?: string) => void;
  deleteTask: (taskId: string) => void;
  getTasksByUser: (userId: string) => Task[];
  getPendingTasks: () => Task[];
  
  // Rewards
  suggestReward: (reward: Omit<Reward, 'id' | 'createdAt' | 'status' | 'approvedBy' | 'approvedAt'>) => void;
  approveReward: (rewardId: string) => void;
  rejectReward: (rewardId: string) => void;
  getApprovedRewards: () => Reward[];
  getPendingRewards: () => Reward[];
  
  // Vouchers
  redeemReward: (rewardId: string) => void;
  useVoucher: (voucherId: string) => void;
  getActiveVouchers: () => Voucher[];
  getVoucherHistory: () => Voucher[];
  
  // Activities
  getActivities: () => Activity[];
  
  // Utils
  refreshState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Generate a 6-character alphanumeric invite code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Storage keys
const STORAGE_KEY = 'nosso-app-data';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    couple: null,
    partner: null,
    tasks: [],
    rewards: [],
    vouchers: [],
    activities: [],
    isLoading: true,
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setState(prev => ({
        ...prev,
        ...parsed,
        currentUser: parsed.currentUser ? {
          ...parsed.currentUser,
          createdAt: new Date(parsed.currentUser.createdAt),
        } : null,
        couple: parsed.couple ? {
          ...parsed.couple,
          createdAt: new Date(parsed.couple.createdAt),
        } : null,
        tasks: parsed.tasks?.map((t: Task) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        })) || [],
        rewards: parsed.rewards?.map((r: Reward) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          approvedAt: r.approvedAt ? new Date(r.approvedAt) : undefined,
        })) || [],
        vouchers: parsed.vouchers?.map((v: Voucher) => ({
          ...v,
          createdAt: new Date(v.createdAt),
          usedAt: v.usedAt ? new Date(v.usedAt) : undefined,
        })) || [],
        activities: parsed.activities?.map((a: Activity) => ({
          ...a,
          createdAt: new Date(a.createdAt),
        })) || [],
        isLoading: false,
      }));
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!state.isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  // Auth functions
  const login = useCallback((email: string, password: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const parsed = JSON.parse(stored);
    const users: User[] = parsed.users || [];
    const user = users.find((u: User) => u.email === email && u.password === password);
    
    if (user) {
      const couple = parsed.couples?.find((c: Couple) => 
        c.id === user.coupleId
      );
      const partner = couple ? parsed.users?.find((u: User) => 
        u.id !== user.id && (u.id === couple.partner1Id || u.id === couple.partner2Id)
      ) : null;
      
      setState(prev => ({
        ...prev,
        currentUser: user,
        couple: couple || null,
        partner: partner || null,
        tasks: parsed.tasks?.filter((t: Task) => t.coupleId === user.coupleId) || [],
        rewards: parsed.rewards?.filter((r: Reward) => r.coupleId === user.coupleId) || [],
        vouchers: parsed.vouchers?.filter((v: Voucher) => v.coupleId === user.coupleId) || [],
        activities: parsed.activities?.filter((a: Activity) => a.coupleId === user.coupleId) || [],
      }));
      return true;
    }
    return false;
  }, []);

  const register = useCallback((name: string, email: string, password: string, color: User['color']) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    const users: User[] = parsed.users || [];
    
    if (users.some((u: User) => u.email === email)) {
      return false;
    }
    
    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      password,
      color,
      points: 0,
      createdAt: new Date(),
    };
    
    parsed.users = [...users, newUser];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    setState(prev => ({
      ...prev,
      currentUser: newUser,
    }));
    return true;
  }, []);

  const logout = useCallback(() => {
    setState({
      currentUser: null,
      couple: null,
      partner: null,
      tasks: [],
      rewards: [],
      vouchers: [],
      activities: [],
      isLoading: false,
    });
  }, []);

  // Couple functions
  const createCouple = useCallback(() => {
    if (!state.currentUser) return '';
    
    const inviteCode = generateCode();
    const newCouple: Couple = {
      id: uuidv4(),
      inviteCode,
      partner1Id: state.currentUser.id,
      createdAt: new Date(),
      totalPoints: 0,
    };
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed.couples = [...(parsed.couples || []), newCouple];
    
    // Update user with coupleId
    const users: User[] = parsed.users || [];
    const userIndex = users.findIndex((u: User) => u.id === state.currentUser!.id);
    if (userIndex >= 0) {
      users[userIndex].coupleId = newCouple.id;
      parsed.users = users;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    setState(prev => ({
      ...prev,
      couple: newCouple,
      currentUser: prev.currentUser ? { ...prev.currentUser, coupleId: newCouple.id } : null,
    }));
    
    return inviteCode;
  }, [state.currentUser]);

  const joinCouple = useCallback((inviteCode: string) => {
    if (!state.currentUser) return false;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const parsed = JSON.parse(stored);
    const couples: Couple[] = parsed.couples || [];
    const couple = couples.find((c: Couple) => c.inviteCode === inviteCode);
    
    if (!couple || couple.partner2Id) return false;
    
    couple.partner2Id = state.currentUser.id;
    parsed.couples = couples;
    
    // Update user with coupleId
    const users: User[] = parsed.users || [];
    const userIndex = users.findIndex((u: User) => u.id === state.currentUser!.id);
    if (userIndex >= 0) {
      users[userIndex].coupleId = couple.id;
      parsed.users = users;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    const partner = users.find((u: User) => u.id === couple.partner1Id);
    
    // Add activity
    const newActivity: Activity = {
      id: uuidv4(),
      type: 'partner_joined',
      userId: state.currentUser.id,
      coupleId: couple.id,
      description: `${state.currentUser.name} entrou no casal! 💕`,
      createdAt: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      couple,
      currentUser: prev.currentUser ? { ...prev.currentUser, coupleId: couple.id } : null,
      partner: partner || null,
      activities: [newActivity, ...prev.activities],
    }));
    
    return true;
  }, [state.currentUser]);

  const unlinkCouple = useCallback(() => {
    if (!state.currentUser || !state.couple) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    
    // Remove couple
    parsed.couples = (parsed.couples || []).filter((c: Couple) => c.id !== state.couple!.id);
    
    // Remove coupleId from users
    const users: User[] = parsed.users || [];
    users.forEach((u: User) => {
      if (u.coupleId === state.couple!.id) {
        delete u.coupleId;
      }
    });
    parsed.users = users;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    setState(prev => ({
      ...prev,
      couple: null,
      partner: null,
      currentUser: prev.currentUser ? { ...prev.currentUser, coupleId: undefined } : null,
      tasks: [],
      rewards: [],
      vouchers: [],
    }));
  }, [state.currentUser, state.couple]);

  const generateInviteCode = useCallback(() => {
    return state.couple?.inviteCode || createCouple();
  }, [state.couple, createCouple]);

  // Task functions
  const createTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    if (!state.currentUser || !state.couple) return;
    
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date(),
      completed: false,
    };
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed.tasks = [...(parsed.tasks || []), newTask];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
  }, [state.currentUser, state.couple]);

  const completeTask = useCallback((taskId: string, proofPhoto?: string) => {
    if (!state.currentUser || !state.couple) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    const tasks: Task[] = parsed.tasks || [];
    const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
    
    if (taskIndex < 0) return;
    
    const task = tasks[taskIndex];
    task.completed = true;
    task.completedAt = new Date();
    task.proofPhoto = proofPhoto;
    
    // Update user points
    const users: User[] = parsed.users || [];
    const userIndex = users.findIndex((u: User) => u.id === task.assignedTo);
    if (userIndex >= 0) {
      users[userIndex].points = (users[userIndex].points || 0) + task.points;
      parsed.users = users;
    }
    
    // Update couple total points
    const couples: Couple[] = parsed.couples || [];
    const coupleIndex = couples.findIndex((c: Couple) => c.id === state.couple!.id);
    if (coupleIndex >= 0) {
      couples[coupleIndex].totalPoints = (couples[coupleIndex].totalPoints || 0) + task.points;
      parsed.couples = couples;
    }
    
    parsed.tasks = tasks;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    // Add activity
    const newActivity: Activity = {
      id: uuidv4(),
      type: 'task_completed',
      userId: state.currentUser.id,
      coupleId: state.couple.id,
      description: `${state.currentUser.name} completou "${task.title}" 🎉`,
      points: task.points,
      relatedId: task.id,
      createdAt: new Date(),
    };
    
    // Create recurring task if needed
    if (task.recurrence !== 'none') {
      let nextDueDate: Date;
      const now = new Date();
      
      switch (task.recurrence) {
        case 'daily':
          nextDueDate = addDays(now, 1);
          break;
        case 'weekly':
          nextDueDate = addWeeks(now, 1);
          break;
        case 'biweekly':
          nextDueDate = addWeeks(now, 2);
          break;
        case 'monthly':
          nextDueDate = addMonths(now, 1);
          break;
        default:
          nextDueDate = now;
      }
      
      const recurringTask: Task = {
        ...task,
        id: uuidv4(),
        createdAt: new Date(),
        completed: false,
        completedAt: undefined,
        proofPhoto: undefined,
        dueDate: nextDueDate,
        isRecurringInstance: true,
        parentTaskId: task.parentTaskId || task.id,
      };
      
      parsed.tasks = [...parsed.tasks, recurringTask];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? task : t).concat(recurringTask),
        currentUser: prev.currentUser?.id === task.assignedTo 
          ? { ...prev.currentUser, points: (prev.currentUser.points || 0) + task.points }
          : prev.currentUser,
        activities: [newActivity, ...prev.activities],
      }));
    } else {
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? task : t),
        currentUser: prev.currentUser?.id === task.assignedTo 
          ? { ...prev.currentUser, points: (prev.currentUser.points || 0) + task.points }
          : prev.currentUser,
        activities: [newActivity, ...prev.activities],
      }));
    }
  }, [state.currentUser, state.couple]);

  const deleteTask = useCallback((taskId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    parsed.tasks = (parsed.tasks || []).filter((t: Task) => t.id !== taskId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  }, []);

  const getTasksByUser = useCallback((userId: string) => {
    return state.tasks.filter(t => t.assignedTo === userId && !t.completed);
  }, [state.tasks]);

  const getPendingTasks = useCallback(() => {
    if (!state.currentUser) return [];
    return state.tasks.filter(t => t.assignedTo === state.currentUser!.id && !t.completed);
  }, [state.tasks, state.currentUser]);

  // Reward functions
  const suggestReward = useCallback((reward: Omit<Reward, 'id' | 'createdAt' | 'status' | 'approvedBy' | 'approvedAt'>) => {
    if (!state.currentUser || !state.couple) return;
    
    const newReward: Reward = {
      ...reward,
      id: uuidv4(),
      createdAt: new Date(),
      status: 'pending',
    };
    
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed.rewards = [...(parsed.rewards || []), newReward];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    // Add activity
    const newActivity: Activity = {
      id: uuidv4(),
      type: 'reward_suggested',
      userId: state.currentUser.id,
      coupleId: state.couple.id,
      description: `${state.currentUser.name} sugeriu a recompensa "${reward.title}" 🎁`,
      relatedId: newReward.id,
      createdAt: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      rewards: [...prev.rewards, newReward],
      activities: [newActivity, ...prev.activities],
    }));
  }, [state.currentUser, state.couple]);

  const approveReward = useCallback((rewardId: string) => {
    if (!state.currentUser || !state.couple) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    const rewards: Reward[] = parsed.rewards || [];
    const rewardIndex = rewards.findIndex((r: Reward) => r.id === rewardId);
    
    if (rewardIndex < 0) return;
    
    rewards[rewardIndex].status = 'approved';
    rewards[rewardIndex].approvedBy = state.currentUser.id;
    rewards[rewardIndex].approvedAt = new Date();
    
    parsed.rewards = rewards;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    // Add activity
    const newActivity: Activity = {
      id: uuidv4(),
      type: 'reward_approved',
      userId: state.currentUser.id,
      coupleId: state.couple.id,
      description: `${state.currentUser.name} aprovou "${rewards[rewardIndex].title}" ✅`,
      relatedId: rewardId,
      createdAt: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      rewards: prev.rewards.map(r => r.id === rewardId ? rewards[rewardIndex] : r),
      activities: [newActivity, ...prev.activities],
    }));
  }, [state.currentUser, state.couple]);

  const rejectReward = useCallback((rewardId: string) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    const rewards: Reward[] = parsed.rewards || [];
    const rewardIndex = rewards.findIndex((r: Reward) => r.id === rewardId);
    
    if (rewardIndex < 0) return;
    
    rewards[rewardIndex].status = 'rejected';
    
    parsed.rewards = rewards;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    setState(prev => ({
      ...prev,
      rewards: prev.rewards.map(r => r.id === rewardId ? rewards[rewardIndex] : r),
    }));
  }, []);

  const getApprovedRewards = useCallback(() => {
    return state.rewards.filter(r => r.status === 'approved');
  }, [state.rewards]);

  const getPendingRewards = useCallback(() => {
    if (!state.currentUser) return [];
    return state.rewards.filter(r => r.status === 'pending' && r.suggestedBy !== state.currentUser!.id);
  }, [state.rewards, state.currentUser]);

  // Voucher functions
  const redeemReward = useCallback((rewardId: string) => {
    if (!state.currentUser || !state.couple) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    const rewards: Reward[] = parsed.rewards || [];
    const reward = rewards.find((r: Reward) => r.id === rewardId);
    
    if (!reward || reward.status !== 'approved') return;
    
    const users: User[] = parsed.users || [];
    const userIndex = users.findIndex((u: User) => u.id === state.currentUser!.id);
    
    if (userIndex < 0 || (users[userIndex].points || 0) < reward.points) return;
    
    // Deduct points
    users[userIndex].points = (users[userIndex].points || 0) - reward.points;
    parsed.users = users;
    
    // Create voucher
    const newVoucher: Voucher = {
      id: uuidv4(),
      rewardId: reward.id,
      title: reward.title,
      description: reward.description,
      redeemedBy: state.currentUser.id,
      redeemedFrom: reward.suggestedBy,
      coupleId: state.couple.id,
      status: 'active',
      createdAt: new Date(),
    };
    
    parsed.vouchers = [...(parsed.vouchers || []), newVoucher];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    // Add activity
    const newActivity: Activity = {
      id: uuidv4(),
      type: 'voucher_redeemed',
      userId: state.currentUser.id,
      coupleId: state.couple.id,
      description: `${state.currentUser.name} resgatou "${reward.title}" 🎉`,
      points: -reward.points,
      relatedId: newVoucher.id,
      createdAt: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      currentUser: { ...prev.currentUser!, points: users[userIndex].points },
      vouchers: [...prev.vouchers, newVoucher],
      activities: [newActivity, ...prev.activities],
    }));
  }, [state.currentUser, state.couple]);

  const useVoucher = useCallback((voucherId: string) => {
    if (!state.currentUser || !state.couple) return;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    const vouchers: Voucher[] = parsed.vouchers || [];
    const voucherIndex = vouchers.findIndex((v: Voucher) => v.id === voucherId);
    
    if (voucherIndex < 0) return;
    
    vouchers[voucherIndex].status = 'used';
    vouchers[voucherIndex].usedAt = new Date();
    
    parsed.vouchers = vouchers;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    
    // Add activity
    const newActivity: Activity = {
      id: uuidv4(),
      type: 'voucher_used',
      userId: state.currentUser.id,
      coupleId: state.couple.id,
      description: `${state.currentUser.name} usou o vale "${vouchers[voucherIndex].title}" 💕`,
      relatedId: voucherId,
      createdAt: new Date(),
    };
    
    setState(prev => ({
      ...prev,
      vouchers: prev.vouchers.map(v => v.id === voucherId ? vouchers[voucherIndex] : v),
      activities: [newActivity, ...prev.activities],
    }));
  }, [state.currentUser, state.couple]);

  const getActiveVouchers = useCallback(() => {
    if (!state.currentUser) return [];
    return state.vouchers.filter(v => v.status === 'active');
  }, [state.vouchers, state.currentUser]);

  const getVoucherHistory = useCallback(() => {
    if (!state.currentUser) return [];
    return state.vouchers.filter(v => v.status === 'used');
  }, [state.vouchers, state.currentUser]);

  // Activity functions
  const getActivities = useCallback(() => {
    return state.activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [state.activities]);

  const refreshState = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const parsed = JSON.parse(stored);
    if (state.currentUser) {
      const couple = parsed.couples?.find((c: Couple) => c.id === state.currentUser!.coupleId);
      const partner = couple ? parsed.users?.find((u: User) => 
        u.id !== state.currentUser!.id && (u.id === couple.partner1Id || u.id === couple.partner2Id)
      ) : null;
      
      setState(prev => ({
        ...prev,
        couple: couple || null,
        partner: partner || null,
        tasks: parsed.tasks?.filter((t: Task) => t.coupleId === state.currentUser!.coupleId) || [],
        rewards: parsed.rewards?.filter((r: Reward) => r.coupleId === state.currentUser!.coupleId) || [],
        vouchers: parsed.vouchers?.filter((v: Voucher) => v.coupleId === state.currentUser!.coupleId) || [],
        activities: parsed.activities?.filter((a: Activity) => a.coupleId === state.currentUser!.coupleId) || [],
      }));
    }
  }, [state.currentUser]);

  const value: AppContextType = {
    ...state,
    login,
    register,
    logout,
    generateInviteCode,
    joinCouple,
    createCouple,
    unlinkCouple,
    createTask,
    completeTask,
    deleteTask,
    getTasksByUser,
    getPendingTasks,
    suggestReward,
    approveReward,
    rejectReward,
    getApprovedRewards,
    getPendingRewards,
    redeemReward,
    useVoucher,
    getActiveVouchers,
    getVoucherHistory,
    getActivities,
    refreshState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
