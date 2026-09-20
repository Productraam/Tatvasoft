import React, { useState } from 'react';
import { CreditCard, MessageSquare, Sliders, BarChart3 } from 'lucide-react';
import { GatewayRevenuePage } from './GatewayRevenuePage';
import { CommunicationHubPage } from './CommunicationHubPage';
import { FeatureFlagsPage } from './FeatureFlagsPage';
import { GlobalAnalyticsPage } from './GlobalAnalyticsPage';

type OpsTab = 'payments' | 'communications' | 'feature-flags' | 'analytics';

const TABS: { id: OpsTab; label: string; icon: typeof CreditCard }[] = [
  { id: 'payments', label: 'Payments & Gateways', icon: CreditCard },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'feature-flags', label: 'Feature Flags', icon: Sliders },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const PlatformOperationsPage: React.FC = () => {
  const [tab, setTab] = useState<OpsTab>('payments');

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-6 pb-0 bg-white border-b border-slate-200 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-slate-900 mb-1">Platform Operations</h1>
        <p className="text-xs text-slate-500 mb-4">
          Payment gateways, devotee communications, feature rollout, and global analytics in one place.
        </p>
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-purple-600 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'payments' && <GatewayRevenuePage />}
        {tab === 'communications' && <CommunicationHubPage />}
        {tab === 'feature-flags' && <FeatureFlagsPage />}
        {tab === 'analytics' && <GlobalAnalyticsPage />}
      </div>
    </div>
  );
};

export default PlatformOperationsPage;
