import crypto from 'node:crypto';

export interface VerifiedTgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface VerifiedInitData {
  user: VerifiedTgUser;
  startParam: string | null;
  authDate: number;
}

export function verifyTelegramInitDataNode(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400
): VerifiedInitData {
  if (!initData || !botToken) {
    throw new Error('Missing Telegram initData or BOT_TOKEN');
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new Error('Missing Telegram HMAC hash');
  }

  const authDate = Number(params.get('auth_date') || '0');
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) {
    throw new Error('Telegram initData expired');
  }

  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') {
      entries.push([key, value]);
    }
  });
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const calcBuf = Buffer.from(calculatedHash, 'hex');
  const hashBuf = Buffer.from(hash.toLowerCase(), 'hex');
  if (calcBuf.length !== hashBuf.length || !crypto.timingSafeEqual(calcBuf, hashBuf)) {
    throw new Error('Invalid Telegram HMAC signature');
  }

  const userRaw = params.get('user');
  if (!userRaw) {
    throw new Error('Missing Telegram user payload');
  }

  const user = JSON.parse(userRaw) as VerifiedTgUser;
  if (!user?.id) {
    throw new Error('Invalid Telegram user');
  }

  return {
    user,
    startParam: params.get('start_param'),
    authDate,
  };
}
