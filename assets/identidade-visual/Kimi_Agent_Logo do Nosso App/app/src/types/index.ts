// Tipos do aplicativo de gamificação para casais

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  color: 'green' | 'pink' | 'purple' | 'blue' | 'orange';
  points: number;
  coupleId?: string;
  userCode: string;  // Código fixo único do usuário (6 caracteres)
  createdAt: Date;
}

export interface Couple {
  id: string;
  inviteCode: string;
  partner1Id: string;
  partner2Id?: string;
  createdAt: Date;
  totalPoints: number;
}

export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  assignedTo: string;
  createdBy: string;
  coupleId: string;
  recurrence: TaskRecurrence;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  proofPhoto?: string;
  isRecurringInstance?: boolean;
  parentTaskId?: string;
  createdAt: Date;
}

export type RewardStatus = 'pending' | 'approved' | 'rejected';

export interface Reward {
  id: string;
  title: string;
  description?: string;
  points: number;
  suggestedBy: string;
  approvedBy?: string;
  status: RewardStatus;
  coupleId: string;
  image?: string;
  createdAt: Date;
  approvedAt?: Date;
}

export type VoucherStatus = 'active' | 'used';

export interface Voucher {
  id: string;
  rewardId: string;
  title: string;
  description?: string;
  redeemedBy: string;
  redeemedFrom: string;
  coupleId: string;
  status: VoucherStatus;
  usedAt?: Date;
  createdAt: Date;
}

export type ActivityType = 'task_completed' | 'reward_suggested' | 'reward_approved' | 'voucher_redeemed' | 'voucher_used' | 'partner_joined';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  coupleId: string;
  description: string;
  points?: number;
  relatedId?: string;
  createdAt: Date;
}

export interface AppState {
  currentUser: User | null;
  couple: Couple | null;
  partner: User | null;
  users: User[];  // Lista de todos os usuários cadastrados
  couples: Couple[];  // Lista de todos os casais
  tasks: Task[];
  rewards: Reward[];
  vouchers: Voucher[];
  activities: Activity[];
  isLoading: boolean;
}

export const RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  none: 'Única',
  daily: 'Diária',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
};

export const COLOR_OPTIONS = [
  { value: 'green', label: 'Verde', hex: '#4CAF50' },
  { value: 'pink', label: 'Rosa', hex: '#E91E63' },
  { value: 'purple', label: 'Roxo', hex: '#9C27B0' },
  { value: 'blue', label: 'Azul', hex: '#2196F3' },
  { value: 'orange', label: 'Laranja', hex: '#FF9800' },
] as const;
