import { AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { ActionSheetModal, type ModalKind } from './components/ActionSheetModal';
import { AdminPanelView } from './components/AdminPanelView';
import { BottomNav } from './components/BottomNav';
import { OrbixLogo } from './components/OrbixLogo';
import { BRAND } from './config/brand';
import { getTranslations } from './lib/i18n';
import { initTelegramSdk } from './lib/telegram';
import { ActivityPage } from './pages/ActivityPage';
import { HomePage } from './pages/HomePage';
import { MyPage } from './pages/MyPage';
import { NodePage } from './pages/NodePage';
import { OrxTokenPage } from './pages/OrxTokenPage';
import { orbixApi } from './services/api';
import type { BootstrapResponse, LanguageCode, TabId } from './types/orbix';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [data, setData] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const loadBootstrap = useCallback(async () => {
    try {
      const res = await orbixApi.bootstrap();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to connect to ${BRAND.name} server`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sdk = initTelegramSdk();
    if (sdk.user?.language_code) {
      const lc = sdk.user.language_code.slice(0, 2) as LanguageCode;
      if (['en', 'bn', 'es', 'ar'].includes(lc)) {
        setLanguage(lc);
      }
    }
    loadBootstrap();
  }, [loadBootstrap]);

  const t = getTranslations(language);

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-dvh bg-[#070504] text-[#F7EFE6] flex justify-center"
    >
      <div className="relative w-full max-w-[430px] min-h-dvh bg-[#0D0906] overflow-x-hidden shadow-[0_0_80px_rgba(0,0,0,0.95)] border-x border-[#C48A55]/12">
        {/* Glowing Planet Background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] overflow-hidden">
          <img
            src="/src/assets/images/orbix_planet_bg.jpg"
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D0906]/50 to-[#0D0906]" />
        </div>

        {/* Main Content Container */}
        <main className="relative z-10 px-4 pt-2 min-h-dvh">
          {loading ? (
            <div className="min-h-[85dvh] flex flex-col items-center justify-center gap-4 text-center">
              <OrbixLogo size={72} />
              <div className="space-y-1">
                <p className="font-display text-lg font-semibold tracking-[0.24em] text-[#F3D9B1] uppercase">
                  {BRAND.name}
                </p>
                <p className="text-xs text-[#8E7763]">Synchronizing Telegram session...</p>
              </div>
            </div>
          ) : error || !data ? (
            <div className="min-h-[85dvh] flex flex-col items-center justify-center gap-4 text-center px-4">
              <OrbixLogo size={56} />
              <div className="orbix-glass rounded-[24px] p-5 space-y-3 w-full">
                <p className="text-sm font-semibold text-[#F3D9B1]">Connection Notice</p>
                <p className="text-xs text-[#A58E79] leading-relaxed">
                  {error || 'Unable to verify session.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    loadBootstrap();
                  }}
                  className="w-full min-h-[44px] rounded-xl orbix-gold-card text-[#1B120B] text-xs font-semibold"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : showAdmin && data.isAdmin ? (
            <AdminPanelView
              onBack={() => setShowAdmin(false)}
              onDataChanged={loadBootstrap}
            />
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <HomePage
                  key="home"
                  user={data.user}
                  userNodes={data.userNodes || []}
                  latestBroadcast={data.latestBroadcast}
                  transactions={data.transactions}
                  labels={t}
                  onOpenModal={(k) => setModalKind(k)}
                  onGoNode={() => setActiveTab('node')}
                />
              )}

              {activeTab === 'activity' && (
                <ActivityPage
                  key="activity"
                  user={data.user}
                  tasks={data.tasks}
                  userTasks={data.userTasks}
                  labels={t}
                  onOpenSupport={() => setModalKind('support')}
                  onStartTask={async (taskId) => {
                    const updated = await orbixApi.startTask(taskId);
                    setData(updated);
                  }}
                  onVerifyTask={async (taskId) => {
                    const updated = await orbixApi.verifyTask(taskId);
                    setData(updated);
                  }}
                  onCheckIn={async () => {
                    const updated = await orbixApi.checkIn();
                    setData(updated);
                  }}
                  onSpinWheel={async () => {
                    const result = await orbixApi.spinLuckyDraw();
                    await loadBootstrap();
                    return { segmentIndex: result.segmentIndex, reward: result.reward };
                  }}
                  onRefresh={loadBootstrap}
                />
              )}

              {activeTab === 'orx' && (
                <OrxTokenPage
                  key="orx"
                  user={data.user}
                  transactions={data.transactions}
                  communityStats={data.communityStats}
                  onOpenSupport={() => setModalKind('support')}
                />
              )}

              {activeTab === 'node' && (
                <NodePage
                  key="node"
                  user={data.user}
                  nodeTiers={data.nodeTiers || []}
                  userNodes={data.userNodes || []}
                  inviteBannerTitle={t.inviteBannerTitle}
                  onOpenInvite={() => setModalKind('invite')}
                  onActivateNode={async (tierId) => {
                    const updated = await orbixApi.activateNode(tierId);
                    setData(updated);
                  }}
                  onClaimNode={async (userNodeId) => {
                    const updated = await orbixApi.claimNode(userNodeId);
                    setData(updated);
                  }}
                />
              )}

              {activeTab === 'my' && (
                <MyPage
                  key="my"
                  user={data.user}
                  isAdmin={data.isAdmin}
                  language={language}
                  labels={t}
                  onChangeLanguage={setLanguage}
                  onOpenModal={(k) => setModalKind(k)}
                  onOpenAdmin={() => setShowAdmin(true)}
                />
              )}
            </AnimatePresence>
          )}
        </main>

        {!loading && data && !showAdmin && (
          <BottomNav
            activeTab={activeTab}
            onSelect={setActiveTab}
            labels={t.nav}
          />
        )}

        {data && (
          <ActionSheetModal
            kind={modalKind}
            user={data.user}
            referrals={data.referrals}
            withdraws={data.withdraws}
            onClose={() => setModalKind(null)}
            onTransfer={async (recipient, amount) => {
              const updated = await orbixApi.transfer(recipient, amount);
              setData(updated);
            }}
            onWithdraw={async (walletAddress, amount) => {
              const updated = await orbixApi.withdraw(walletAddress, amount);
              setData(updated);
            }}
          />
        )}
      </div>
    </div>
  );
}
