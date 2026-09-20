import React, { useState } from 'react';
import { 
  Sliders, 
  Info
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { Tenant, TenantModules } from '../../types/saas';

export const FeatureFlagsPage: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>(saasService.getTenants());
  const [search, setSearch] = useState('');

  const handleToggle = (tenantId: string, moduleKey: keyof TenantModules) => {
    saasService.toggleModule(tenantId, moduleKey);
    setTenants(saasService.getTenants());
  };

  const filtered = tenants.filter((t) => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 animate-fade-in space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-600" /> Tenant Module & Feature Flags
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enable or restrict specialized accounting and ritual modules on a per-temple basis.
          </p>
        </div>
      </div>

      <div className="bg-purple-50/70 border border-purple-200/70 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-900 leading-relaxed">
          <strong>How feature flags work:</strong> Toggling a module dynamically shows or hides the corresponding sidebar item and functionality for all users within that temple trust.
        </div>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm max-w-md">
        <input
          type="text"
          placeholder="Filter temples..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs px-3 py-1.5 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Temple & Plan</th>
                <th className="px-4 py-4 text-center">Hundi Counting</th>
                <th className="px-4 py-4 text-center">Gold & Asset Reg</th>
                <th className="px-4 py-4 text-center">WhatsApp e-Receipt</th>
                <th className="px-4 py-4 text-center">80G Form 10BD</th>
                <th className="px-4 py-4 text-center">Online Portal</th>
                <th className="px-4 py-4 text-center">Multi-Counter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {t.city} • <span className="uppercase text-purple-700 font-bold">{t.planId}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggle(t.id, 'hundiCounting')}
                      className={`w-10 h-6 inline-flex items-center rounded-full transition-colors p-1 ${
                        t.modules.hundiCounting ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          t.modules.hundiCounting ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggle(t.id, 'assetManagement')}
                      className={`w-10 h-6 inline-flex items-center rounded-full transition-colors p-1 ${
                        t.modules.assetManagement ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          t.modules.assetManagement ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggle(t.id, 'whatsappReceipts')}
                      className={`w-10 h-6 inline-flex items-center rounded-full transition-colors p-1 ${
                        t.modules.whatsappReceipts ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          t.modules.whatsappReceipts ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggle(t.id, 'taxExemption80G')}
                      className={`w-10 h-6 inline-flex items-center rounded-full transition-colors p-1 ${
                        t.modules.taxExemption80G ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          t.modules.taxExemption80G ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggle(t.id, 'onlineDevoteePortal')}
                      className={`w-10 h-6 inline-flex items-center rounded-full transition-colors p-1 ${
                        t.modules.onlineDevoteePortal ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          t.modules.onlineDevoteePortal ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleToggle(t.id, 'multiCounter')}
                      className={`w-10 h-6 inline-flex items-center rounded-full transition-colors p-1 ${
                        t.modules.multiCounter ? 'bg-purple-600' : 'bg-slate-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          t.modules.multiCounter ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
