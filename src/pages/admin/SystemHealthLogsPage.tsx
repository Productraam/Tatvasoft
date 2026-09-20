import React, { useState } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  ShieldCheck, 
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { saasService } from '../../services/saasService';
import { SystemAuditLog } from '../../types/saas';

export const SystemHealthLogsPage: React.FC = () => {
  const [logs] = useState<SystemAuditLog[]>(saasService.getSystemLogs());

  return (
    <div className="p-8 animate-fade-in space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-600" /> Platform System Health & Audit Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Infrastructure telemetry, API response times, database size per tenant, and security audit log.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Core API Cluster</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">99.98% Uptime</div>
            <div className="text-[11px] text-emerald-600 font-semibold">Latency: 28ms</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">PostgreSQL RLS DB</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">Connected (Healthy)</div>
            <div className="text-[11px] text-slate-500">22 Active Pool Conn</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">WhatsApp WABA Gateway</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">Operational</div>
            <div className="text-[11px] text-purple-600 font-semibold">Delivery Rate: 99.4%</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Blob Storage (R2/S3)</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">14.2 GB Stored</div>
            <div className="text-[11px] text-slate-500">Scanned vouchers & assets</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Platform Security & Access Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Immutable audit events recorded across all tenant nodes</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">Showing last 24 hours</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Temple Trust</th>
                <th className="px-6 py-3">Action Event</th>
                <th className="px-6 py-3">Target Resource</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-3.5 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="px-6 py-3.5 font-semibold text-slate-900">{log.tenantName}</td>
                  <td className="px-6 py-3.5">
                    <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">{log.resource}</td>
                  <td className="px-6 py-3.5 font-medium">{log.userEmail}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-400">{log.ipAddress}</td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {log.status}
                    </span>
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
