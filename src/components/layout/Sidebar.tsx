import React from 'react';
import {
  Receipt,
  BookOpen,
  ArrowDownLeft,
  Coins,
  Crown,
  Landmark,
  BarChart3,
  Users,
  Settings,
  CircleDollarSign,
  CalendarRange,
  Layers
} from 'lucide-react';
import { UserRole } from '../../types/accounting';
import { canAccessTab } from '../../services/permissions';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, userRole, isOpen = false, onClose }) => {
  const menuItems = [
    { id: 'pos', label: 'Counter', sublabel: 'Donations & seva', group: 'Operations', icon: CircleDollarSign },
    { id: 'receipts', label: 'Receipts', sublabel: 'Issue & reprint', group: 'Operations', icon: Receipt },
    { id: 'daybook', label: 'Daybook', sublabel: 'Daily cashbook', group: 'Operations', icon: BookOpen },
    { id: 'expenses', label: 'Expenses', sublabel: 'Vouchers & payments', group: 'Operations', icon: ArrowDownLeft },
    { id: 'hundi', label: 'Hundi', sublabel: 'Counting sessions', group: 'Operations', icon: Coins },
    { id: 'assets', label: 'Assets', sublabel: 'Vault & holdings', group: 'Finance', icon: Crown },
    { id: 'accounts', label: 'Ledgers', sublabel: 'Cash & bank', group: 'Finance', icon: Landmark },
    { id: 'reports', label: 'Reports', sublabel: 'Financial statements', group: 'Finance', icon: BarChart3 },
    { id: 'auditor', label: 'Audit', sublabel: 'Year-end close', group: 'Governance', icon: CalendarRange },
    { id: 'donors', label: 'Devotees', sublabel: 'Profiles & 80G', group: 'Governance', icon: Users },
    { id: 'catalogs', label: 'Catalogs', sublabel: 'Sevas & masters', group: 'Governance', icon: Layers },
    { id: 'settings', label: 'Settings', sublabel: 'Temple & staff', group: 'Governance', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-[49px] bg-stone-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`w-60 bg-[#FFFCF7] border-r border-[#E5DED2] flex flex-col justify-between select-none shrink-0 transform-gpu transition-transform duration-300 ease-out will-change-transform z-40
          fixed top-[49px] bottom-0 left-0 lg:sticky lg:top-0 lg:h-[calc(100vh-49px)] lg:overflow-hidden
          ${isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'} lg:translate-x-0 lg:pointer-events-auto`}
      >
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8F857A]">Navigation</span>
        </div>

        <nav className="space-y-0.5">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isAllowed = canAccessTab(userRole, item.id);
            const isActive = currentTab === item.id;
            if (!isAllowed) return null;
            return (
              <React.Fragment key={item.id}>
                {(index === 0 || menuItems[index - 1].group !== item.group) && (
                  <div className="px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#8F857A]">{item.group}</div>
                )}
                <button
                  onClick={() => {
                    setCurrentTab(item.id);
                    onClose?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-150 group ${
                    isActive
                      ? 'bg-[#F0E9DF] text-[#24211D] font-bold border-l-2 border-[#C96A24] shadow-sm'
                      : 'text-[#756F66] hover:bg-[#F8F5EF] hover:text-[#24211D] border-l-2 border-transparent'
                  }`}
                >
                  <Icon className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-[#C96A24]' : 'text-[#A69A8D]'}`} />
                  <span className="text-xs">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-[#E5DED2] flex items-center justify-center">
        <span className="text-[10px] text-[#8F857A] font-medium tracking-wide">Temple Accounts v1.0</span>
      </div>
    </aside>
    </>
  );
};
