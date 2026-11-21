import { isSupabaseConfigured } from '../lib/supabase';
import { getTelegramWebApp } from '../lib/telegram';
import type { AdminOverviewResponse, BootstrapResponse, UserProfile } from '../types/orbix';

async function callServer<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const tg = getTelegramWebApp();
  const initData = tg?.initData || '';
  const startParam =
    tg?.initDataUnsafe?.start_param ||
    new URLSearchParams(window.location.search).get('tgWebAppStartParam') ||
    new URLSearchParams(window.location.search).get('startapp') ||
    undefined;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const useEdgeFunction = isSupabaseConfigured && Boolean(initData) && Boolean(supabaseUrl);
  const endpoint = useEdgeFunction ? `${supabaseUrl}/functions/v1/orbix-api` : '/api/orbix';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-telegram-init-data': initData,
  };

  if (useEdgeFunction && supabaseAnonKey) {
    headers['apikey'] = supabaseAnonKey;
    headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, startParam, ...payload }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export const orbixApi = {
  bootstrap: () => callServer<BootstrapResponse>('bootstrap'),
  checkIn: () => callServer<BootstrapResponse>('checkin'),
  spinLuckyDraw: () =>
    callServer<{ segmentIndex: number; reward: number; user: UserProfile }>('lucky-draw/spin'),
  startTask: (taskId: string) => callServer<BootstrapResponse>('tasks/start', { taskId }),
  verifyTask: (taskId: string) => callServer<BootstrapResponse>('tasks/verify', { taskId }),
  activateNode: (tierId: string) => callServer<BootstrapResponse>('node/activate', { tierId }),
  claimNode: (userNodeId: string) => callServer<BootstrapResponse>('node/claim', { userNodeId }),
  transfer: (recipient: string, amount: number) =>
    callServer<BootstrapResponse>('transfer', { recipient, amount }),
  withdraw: (walletAddress: string, amount: number) =>
    callServer<BootstrapResponse>('withdraw', { walletAddress, amount }),
  adminOverview: () => callServer<AdminOverviewResponse>('admin/overview'),
  adminSaveTask: (task: {
    id?: string;
    title: string;
    subtitle: string;
    url: string;
    reward: number;
    category: string;
    is_active: boolean;
  }) => callServer<{ ok: boolean }>('admin/task-save', task),
  adminDeleteTask: (id: string) => callServer<{ ok: boolean }>('admin/task-delete', { id }),
  adminWithdrawAction: (withdrawId: string, decision: 'approved' | 'rejected', note?: string) =>
    callServer<{ ok: boolean }>('admin/withdraw-action', { withdrawId, decision, note }),
  adminBroadcast: (title: string, message: string) =>
    callServer<{ ok: boolean }>('admin/broadcast', { title, message }),
};
