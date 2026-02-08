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

// APP VERSION - Change this to clear all localStorage data on next load
const APP_VERSION = '2.5.4';
const VERSION_KEY = 'nosso-app-version';

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
  linkByUserCode: (partnerCode: string) => boolean;
  
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

// Generate a unique user code
const generateUserCode = (existingUsers: User[]) => {
  let code = '';
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
  } while (existingUsers.some(u => u.userCode === code) && attempts < 100);
  return code;
};

// Storage keys
const STORAGE_KEY = 'nosso-app-data';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    couple: null,
    partner: null,
    users: [],
    couples: [],
    tasks: [],
    rewards: [],
    vouchers: [],
    activities: [],
    isLoading: true,
  });

  // Check version - apenas log, NÃO limpa mais os dados
  useEffect(() => {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== APP_VERSION) {
      // Apenas atualiza a versão, mantém os dados do usuário
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      console.log(`[Nosso App] Updated to version ${APP_VERSION}`);
    }
  }, []);

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
        users: parsed.users?.map((u: User) => ({
          ...u,
          createdAt: new Date(u.createdAt),
        })) || [],
        couples: parsed.couples?.map((c: Couple) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })) || [],
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
    console.log('[LOGIN] Tentando login:', email);
    
    const user = state.users.find((u: User) => u.email === email && u.password === password);
    
    if (user) {
      console.log('[LOGIN] Usuário encontrado:', user.name, 'coupleId:', user.coupleId);
      
      // Buscar casal do usuário
      const couple = user.coupleId 
        ? state.couples.find((c: Couple) => c.id === user.coupleId) || null
        : null;
      
      console.log('[LOGIN] Casal encontrado:', couple ? 'Sim' : 'Não');
      
      // Buscar parceiro - garantir que busca do estado global de users
      let partner = null;
      if (couple) {
        const partnerId = couple.partner1Id === user.id ? couple.partner2Id : couple.partner1Id;
        partner = state.users.find((u: User) => u.id === partnerId) || null;
        console.log('[LOGIN] Buscando parceiro ID:', partnerId);
      }
      
      console.log('[LOGIN] Parceiro encontrado:', partner ? partner.name : 'Não');
      
      // Atualizar user com dados mais recentes do users array
      const updatedUser = state.users.find(u => u.id === user.id) || user;
      
      setState(prev => ({
        ...prev,
        currentUser: updatedUser,
        couple: couple || null,
        partner: partner || null,
      }));
      return true;
    }
    
    console.log('[LOGIN] Usuário não encontrado');
    return false;
  }, [state.users, state.couples]);

  const register = useCallback((name: string, email: string, password: string, color: User['color']) => {
    console.log('[REGISTER] Iniciando registro:', email);
    
    // Verificar se email já existe
    if (state.users.some((u: User) => u.email === email)) {
      console.log('[REGISTER] Email já existe');
      return false;
    }
    
    // Gerar código único do usuário
    const userCode = generateUserCode(state.users);
    console.log('[REGISTER] Código gerado:', userCode);
    
    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      password,
      color,
      points: 0,
      userCode,
      createdAt: new Date(),
    };
    
    console.log('[REGISTER] Novo usuário:', { id: newUser.id, userCode: newUser.userCode });
    
    // Atualizar estado - o useEffect vai salvar no localStorage
    setState(prev => ({
      ...prev,
      currentUser: newUser,
      users: [...prev.users, newUser],
    }));
    
    console.log('[REGISTER] Estado atualizado, total usuários:', state.users.length + 1);
    return true;
  }, [state.users]);

  const logout = useCallback(() => {
    // Logout apenas desloga o usuário, mantém dados do casal no estado
    setState(prev => ({
      ...prev,
      currentUser: null,
      // NÃO limpar couple, partner, tasks, etc - dados persistem no localStorage
      isLoading: false,
    }));
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
    console.log('[UNLINK] Desvinculando casal:', state.couple?.id);
    
    if (!state.currentUser || !state.couple) {
      console.log('[UNLINK] Sem usuário ou casal para desvincular');
      return;
    }
    
    const coupleId = state.couple.id;
    
    // Atualizar estado - remover casal e atualizar usuários
    setState(prev => {
      // Remover casal da lista
      const updatedCouples = prev.couples.filter((c: Couple) => c.id !== coupleId);
      
      // Remover coupleId de TODOS os usuários que tinham este casal
      const updatedUsers = prev.users.map((u: User) => {
        if (u.coupleId === coupleId) {
          const { coupleId: _, ...userWithoutCouple } = u;
          return userWithoutCouple as User;
        }
        return u;
      });
      
      console.log('[UNLINK] Casais antes:', prev.couples.length, 'depois:', updatedCouples.length);
      console.log('[UNLINK] Usuários atualizados:', updatedUsers.map(u => ({ name: u.name, coupleId: u.coupleId })));
      
      return {
        ...prev,
        couples: updatedCouples,
        users: updatedUsers,
        couple: null,
        partner: null,
        currentUser: prev.currentUser ? { 
          ...prev.currentUser, 
          coupleId: undefined 
        } : null,
        tasks: [],
        rewards: [],
        vouchers: [],
        activities: [],
      };
    });
    
    console.log('[UNLINK] Casal desvinculado com sucesso');
  }, [state.currentUser, state.couple]);

  const generateInviteCode = useCallback(() => {
    return state.couple?.inviteCode || createCouple();
  }, [state.couple, createCouple]);

  // Link with partner by user code
  const linkByUserCode = useCallback((partnerCode: string) => {
    console.log('[LINK] Tentando vincular com código:', partnerCode);
    console.log('[LINK] Usuário atual:', state.currentUser?.name, 'coupleId:', state.currentUser?.coupleId);
    
    if (!state.currentUser) {
      console.log('[LINK] Sem usuário logado');
      return false;
    }
    
    // Verificar se usuário atual já tem casal
    if (state.currentUser.coupleId) {
      console.log('[LINK] Usuário já está em um casal');
      return false;
    }
    
    // Não pode vincular a si mesmo
    if (partnerCode === state.currentUser.userCode) {
      console.log('[LINK] Não pode vincular a si mesmo');
      return false;
    }
    
    // Buscar parceiro pelo código
    const partner = state.users.find((u: User) => u.userCode === partnerCode);
    if (!partner) {
      console.log('[LINK] Parceiro não encontrado com código:', partnerCode);
      return false;
    }
    
    console.log('[LINK] Parceiro encontrado:', partner.name, 'coupleId:', partner.coupleId);
    
    // Se o parceiro já tem casal, não pode vincular
    if (partner.coupleId) {
      console.log('[LINK] Parceiro já está em um casal');
      return false;
    }
    
    // Criar novo casal
    const newCouple: Couple = {
      id: uuidv4(),
      inviteCode: generateCode(),
      partner1Id: state.currentUser.id,
      partner2Id: partner.id,
      createdAt: new Date(),
      totalPoints: 0,
    };
    
    console.log('[LINK] Criando novo casal:', newCouple.id);
    
    // Atualizar estado
    setState(prev => ({
      ...prev,
      couple: newCouple,
      partner: partner,
      couples: [...prev.couples, newCouple],
      users: prev.users.map(u => {
        if (u.id === state.currentUser!.id || u.id === partner.id) {
          return { ...u, coupleId: newCouple.id };
        }
        return u;
      }),
    }));
    
    console.log('[LINK] Casal criado com sucesso!');
    return true;
  }, [state.currentUser, state.users, state.couples]);

  // Task functions
  const createTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    console.log('[CREATE TASK] Criando tarefa:', task.title);
    console.log('[CREATE TASK] Atribuída a:', task.assignedTo);
    console.log('[CREATE TASK] Criada por:', task.createdBy);
    
    if (!state.currentUser) {
      console.log('[CREATE TASK] Erro: sem usuário logado');
      return;
    }
    
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date(),
      completed: false,
    };
    
    // Atualizar estado - o useEffect vai salvar no localStorage
    setState(prev => {
      const updatedTasks = [...prev.tasks, newTask];
      console.log('[CREATE TASK] Total de tarefas:', updatedTasks.length);
      return {
        ...prev,
        tasks: updatedTasks,
      };
    });
  }, [state.currentUser]);

  const completeTask = useCallback((taskId: string, proofPhoto?: string) => {
    if (!state.currentUser || !state.couple) return;
    
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Validar se quem completa é quem foi atribuído
    if (task.assignedTo !== state.currentUser.id) {
      console.log('[COMPLETE] Apenas o usuário atribuído pode completar');
      return;
    }
    
    const completedTask: Task = {
      ...task,
      completed: true,
      completedAt: new Date(),
      proofPhoto,
    };
    
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
    
    setState(prev => {
      // Atualizar tarefa completada
      let updatedTasks = prev.tasks.map(t => 
        t.id === taskId ? completedTask : t
      );
      
      // Atualizar pontos do usuário que completou
      const updatedUsers = prev.users.map(u => {
        if (u.id === task.assignedTo) {
          return { ...u, points: (u.points || 0) + task.points };
        }
        return u;
      });
      
      // Atualizar pontos do casal
      const updatedCouples = prev.couples.map(c => {
        if (c.id === state.couple!.id) {
          return { ...c, totalPoints: (c.totalPoints || 0) + task.points };
        }
        return c;
      });
      
      // Criar tarefa recorrente se necessário
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
        
        updatedTasks = [...updatedTasks, recurringTask];
      }
      
      // Atualizar currentUser se ele for quem recebeu os pontos
      const updatedCurrentUser = prev.currentUser?.id === task.assignedTo
        ? { ...prev.currentUser, points: (prev.currentUser.points || 0) + task.points }
        : prev.currentUser;
      
      return {
        ...prev,
        tasks: updatedTasks,
        users: updatedUsers,
        couples: updatedCouples,
        currentUser: updatedCurrentUser,
        activities: [newActivity, ...prev.activities],
      };
    });
  }, [state.currentUser, state.couple, state.tasks, state.users, state.couples]);

  const deleteTask = useCallback((taskId: string) => {
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
    
    const reward = state.rewards.find(r => r.id === rewardId);
    if (!reward || reward.status !== 'approved') return;
    
    // Verificar se tem pontos suficientes
    if ((state.currentUser.points || 0) < reward.points) {
      console.log('[REDEEM] Pontos insuficientes');
      return;
    }
    
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
    
    setState(prev => {
      const newPoints = (prev.currentUser!.points || 0) - reward.points;
      
      return {
        ...prev,
        currentUser: { ...prev.currentUser!, points: newPoints },
        users: prev.users.map(u => 
          u.id === prev.currentUser!.id ? { ...u, points: newPoints } : u
        ),
        vouchers: [...prev.vouchers, newVoucher],
        activities: [newActivity, ...prev.activities],
      };
    });
  }, [state.currentUser, state.couple, state.rewards]);

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
    linkByUserCode,
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
