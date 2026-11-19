export interface TgUserUnsafe {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TgUserUnsafe;
    start_param?: string;
  };
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegramSdk(): {
  initData: string;
  user: TgUserUnsafe | null;
  startParam: string | null;
} {
  const tg = getTelegramWebApp();
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('#0b0705');
      tg.setBackgroundColor?.('#0b0705');
    } catch {
      // Safe fallback outside Telegram container
    }
    const urlParam = new URLSearchParams(window.location.search).get('tgWebAppStartParam');
    return {
      initData: tg.initData || '',
      user: tg.initDataUnsafe?.user ?? null,
      startParam: tg.initDataUnsafe?.start_param || urlParam || null,
    };
  }

  const urlParam = new URLSearchParams(window.location.search).get('tgWebAppStartParam');
  return {
    initData: '',
    user: null,
    startParam: urlParam || null,
  };
}

export function openExternalUrl(url: string): void {
  const tg = getTelegramWebApp();
  if (tg) {
    if (url.startsWith('https://t.me/') && tg.openTelegramLink) {
      tg.openTelegramLink(url);
      return;
    }
    if (tg.openLink) {
      tg.openLink(url);
      return;
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'error' = 'light'): void {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;
  try {
    if (type === 'success' || type === 'error') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {
    // Ignore unsupported haptic calls
  }
}
