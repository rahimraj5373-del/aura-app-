import { BarChart3, Box, CalendarDays, Home, User } from 'lucide-react';
import { triggerHaptic } from '../lib/telegram';
import type { TabId } from '../types/aura';

interface BottomNavProps {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
  labels: Record<TabId, string>;
}

const TAB_ITEMS: { id: TabId; icon: typeof Home }[] = [
  { id: 'home', icon: Home },
  { id: 'activity', icon: CalendarDays },
  { id: 'tvr', icon: BarChart3 },
  { id: 'node', icon: Box },
  { id: 'my', icon: User },
];

export function BottomNav({ activeTab, onSelect, labels }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40 bg-[#120C08]/94 backdrop-blur-xl border-t border-[#C48A55]/20 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-5 items-center">
        {TAB_ITEMS.map(({ id, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSelect(id);
              }}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-2xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5BE8B]/60 ${
                isActive ? 'text-[#F3D9B1]' : 'text-[#8E7763] hover:text-[#CBB59F]'
              }`}
            >
              <span
                className={`w-8 h-6 rounded-xl flex items-center justify-center transition-all ${
                  isActive ? 'bg-[#C48A55]/20 shadow-[0_0_12px_rgba(196,138,85,0.22)]' : ''
                }`}
              >
                <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.3 : 1.8} />
              </span>
              <span className="text-[11px] font-medium tracking-tight whitespace-nowrap shrink-0">
                {labels[id]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
