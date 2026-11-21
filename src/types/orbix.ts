export type TabId = 'home' | 'activity' | 'orx' | 'node' | 'my';

export type LanguageCode = 'en' | 'bn' | 'es' | 'ar';

export interface UserProfile {
  tg_id: string;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  balance: number;
  daily_earned: number;
  checkin_streak: number;
  last_checkin_date: string | null;
  cumulative_checkin_rewards: number;
  last_spin_date: string | null;
  referred_by: string | null;
  valid_invites: number;
  referral_earnings: number;
  created_at: string;
}

export interface NodeTier {
  id: string;
  indexLabel: string;
  name: string;
  subtitle: string;
  costOrx: number;
  dailyOrx: number;
  durationDays: number;
  totalEarningsOrx: number;
  saleQuantity: number;
  baseProgressPct: number;
}

export interface UserNode {
  id: string;
  tg_id: string;
  tier_id: string;
  tier_name: string;
  daily_orx: number;
  duration_days: number;
  days_claimed: number;
  total_claimed_orx: number;
  last_claim_date: string | null;
  activated_at: string;
}

export interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  reward: number;
  category: 'telegram_group' | 'telegram_channel' | 'x' | 'facebook' | 'custom';
  is_active: boolean;
  sort_order: number;
}

export interface UserTask {
  task_id: string;
  started_at: string | null;
  completed_at: string | null;
  reward_claimed: number;
}

export interface ReferralEntry {
  tg_id: string;
  first_name: string;
  username: string | null;
  bonus_awarded: number;
  created_at: string;
}

export interface WithdrawRequest {
  id: string;
  tg_id: string;
  user_name?: string;
  wallet_address: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface TransactionItem {
  id: string;
  tg_id: string;
  type:
    | 'signup'
    | 'checkin'
    | 'lucky_draw'
    | 'task'
    | 'referral'
    | 'node_activate'
    | 'node_claim'
    | 'transfer_in'
    | 'transfer_out'
    | 'withdraw'
    | 'withdraw_refund';
  amount: number;
  description: string;
  created_at: string;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface DailyActivityPoint {
  date: string;
  label: string;
  earned: number;
  txCount: number;
}

export interface CommunityStats {
  totalUsers: number;
  totalPoolOrx: number;
  totalDistributedOrx: number;
  dailyActivity: DailyActivityPoint[];
}

export interface BootstrapResponse {
  user: UserProfile;
  isAdmin: boolean;
  tasks: TaskItem[];
  userTasks: UserTask[];
  completedTasksCount: number;
  nodeTiers: NodeTier[];
  userNodes: UserNode[];
  referrals: ReferralEntry[];
  withdraws: WithdrawRequest[];
  transactions: TransactionItem[];
  latestBroadcast: BroadcastMessage | null;
  communityStats: CommunityStats;
  serverTime: string;
}

export interface AdminOverviewResponse {
  users: UserProfile[];
  tasks: TaskItem[];
  withdraws: WithdrawRequest[];
  broadcasts: BroadcastMessage[];
  stats: {
    totalUsers: number;
    totalOrxSupply: number;
    pendingWithdraws: number;
  };
}
