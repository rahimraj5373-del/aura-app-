import type { LanguageCode, TabId } from '../types/aura';

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
];

type TranslationDict = {
  nav: Record<TabId, string>;
  totalBalanceTitle: string;
  dailyTvr: string;
  receive: string;
  transfer: string;
  withdrawAction: string;
  invite: string;
  pointAssets: string;
  holdNode: string;
  tokens: string;
  activityTitle: string;
  participate: string;
  dailyCheckin: string;
  luckyDraw: string;
  inviteBannerTitle: string;
  referralReward: string;
  withdraw: string;
  adminPanel: string;
  language: string;
  help: string;
  customerService: string;
  aboutUs: string;
};

const DICTIONARIES: Record<LanguageCode, TranslationDict> = {
  en: {
    nav: { home: 'Home', activity: 'Activity', tvr: 'TVR', node: 'Node', my: 'My' },
    totalBalanceTitle: 'Total Asset Valuation · TVR',
    dailyTvr: 'Daily TVR',
    receive: 'Receive',
    transfer: 'Transfer',
    withdrawAction: 'Withdraw',
    invite: 'Promotion',
    pointAssets: 'Token Assets',
    holdNode: 'Hold Node',
    tokens: 'Tokens',
    activityTitle: 'Participate in activities and claim rewards',
    participate: 'Community Quests',
    dailyCheckin: 'Daily Check-in',
    luckyDraw: 'Lucky Draw',
    inviteBannerTitle: 'Invite Friends, Earn Rewards',
    referralReward: '1-Level Referral Reward',
    withdraw: 'Withdraw TVR',
    adminPanel: 'Admin Panel',
    language: 'Language',
    help: 'Help',
    customerService: 'Customer Service',
    aboutUs: 'About Us',
  },
  bn: {
    nav: { home: 'হোম', activity: 'কার্যক্রম', tvr: 'TVR', node: 'নোড', my: 'প্রোফাইল' },
    totalBalanceTitle: 'মোট ব্যালেন্স · TVR',
    dailyTvr: 'দৈনিক TVR',
    receive: 'গ্রহণ',
    transfer: 'পাঠান',
    withdrawAction: 'উত্তোলন',
    invite: 'প্রমোশন',
    pointAssets: 'টোকেন সম্পদ',
    holdNode: 'হোল্ড নোড',
    tokens: 'টোকেনসমূহ',
    activityTitle: 'কার্যক্রমে অংশগ্রহণ করে পুরস্কার জিতুন',
    participate: 'কমিউনিটি টাস্ক',
    dailyCheckin: 'দৈনিক চেক-ইন',
    luckyDraw: 'লাকি ড্র',
    inviteBannerTitle: 'বন্ধুদের আমন্ত্রণ জানান, পুরস্কার জিতুন',
    referralReward: '১-লেভেল রেফারেল বোনাস',
    withdraw: 'উত্তোলন (Withdraw)',
    adminPanel: 'অ্যাডমিন প্যানেল',
    language: 'ভাষা',
    help: 'সাহায্য',
    customerService: 'কাস্টমার সার্ভিস',
    aboutUs: 'আমাদের সম্পর্কে',
  },
  es: {
    nav: { home: 'Inicio', activity: 'Actividad', tvr: 'TVR', node: 'Nodo', my: 'Perfil' },
    totalBalanceTitle: 'Balance Total · TVR',
    dailyTvr: 'TVR Diario',
    receive: 'Recibir',
    transfer: 'Transferir',
    withdrawAction: 'Retirar',
    invite: 'Promoción',
    pointAssets: 'Activos',
    holdNode: 'Hold Node',
    tokens: 'Tokens',
    activityTitle: 'Participa en actividades y reclama recompensas',
    participate: 'Misiones Sociales',
    dailyCheckin: 'Registro Diario',
    luckyDraw: 'Ruleta Suerte',
    inviteBannerTitle: 'Invita Amigos, Gana Recompensas',
    referralReward: 'Bono de Referido Nivel 1',
    withdraw: 'Retirar TVR',
    adminPanel: 'Panel Admin',
    language: 'Idioma',
    help: 'Ayuda',
    customerService: 'Atención al Cliente',
    aboutUs: 'Sobre Nosotros',
  },
  ar: {
    nav: { home: 'الرئيسية', activity: 'النشاط', tvr: 'TVR', node: 'العقدة', my: 'حسابي' },
    totalBalanceTitle: 'إجمالي الرصيد · TVR',
    dailyTvr: 'TVR اليومي',
    receive: 'استلام',
    transfer: 'تحويل',
    withdrawAction: 'سحب',
    invite: 'الترويج',
    pointAssets: 'الأصول',
    holdNode: 'العقد المحتفظ بها',
    tokens: 'الرموز',
    activityTitle: 'شارك في الأنشطة واحصل على المكافآت',
    participate: 'مهام المجتمع',
    dailyCheckin: 'تسجيل يومي',
    luckyDraw: 'عجلة الحظ',
    inviteBannerTitle: 'ادعُ أصدقاءك واربح المكافآت',
    referralReward: 'مكافأة الإحالة المباشرة',
    withdraw: 'سحب TVR',
    adminPanel: 'لوحة الإدارة',
    language: 'اللغة',
    help: 'المساعدة',
    customerService: 'خدمة العملاء',
    aboutUs: 'معلومات عنا',
  },
};

export function getTranslations(lang: LanguageCode): TranslationDict {
  return DICTIONARIES[lang] || DICTIONARIES.en;
}
