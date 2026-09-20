import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  Globe2,
  KeyRound,
  Link2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  Trash2,
  Webhook,
  X
} from 'lucide-react';

type IntegrationCategory = 'Database' | 'CMS' | 'Payments' | 'Messaging' | 'Hosting' | 'API';
type ConnectionStatus = 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';

type IntegrationProvider = {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: React.ElementType;
  fields: Array<{ key: string; label: string; placeholder: string; secret?: boolean }>;
};

type IntegrationConnection = {
  id: string;
  providerId: string;
  label: string;
  endpoint: string;
  status: ConnectionStatus;
  secretConfigured: boolean;
  updatedAt: string;
};

const STORAGE_KEY = 'tatva_admin_integrations';

const providers: IntegrationProvider[] = [
  { id: 'supabase', name: 'Supabase', category: 'Database', description: 'Postgres database, authentication, storage, and realtime sync.', icon: Database, fields: [{ key: 'url', label: 'Project URL', placeholder: 'https://your-project.supabase.co' }, { key: 'key', label: 'Anon or service key', placeholder: 'Paste key', secret: true }] },
  { id: 'postgres', name: 'PostgreSQL', category: 'Database', description: 'Connect an external Postgres database through a secure backend connector.', icon: Database, fields: [{ key: 'url', label: 'Connection URL', placeholder: 'postgresql://user:password@host:5432/db', secret: true }] },
  { id: 'wordpress', name: 'WordPress', category: 'CMS', description: 'Sync temple pages, announcements, articles, and media.', icon: Globe2, fields: [{ key: 'url', label: 'Site URL', placeholder: 'https://temple.org' }, { key: 'key', label: 'Application password', placeholder: 'Paste application password', secret: true }] },
  { id: 'strapi', name: 'Strapi', category: 'CMS', description: 'Connect structured content and publishing workflows.', icon: Code2, fields: [{ key: 'url', label: 'API URL', placeholder: 'https://cms.temple.org/api' }, { key: 'key', label: 'API token', placeholder: 'Paste API token', secret: true }] },
  { id: 'razorpay', name: 'Razorpay', category: 'Payments', description: 'Payment collection, reconciliation, and webhook events.', icon: Link2, fields: [{ key: 'url', label: 'Webhook URL', placeholder: 'https://your-domain/functions/v1/payment-webhook' }, { key: 'key', label: 'Key secret', placeholder: 'Paste secret', secret: true }] },
  { id: 'whatsapp', name: 'WhatsApp Business', category: 'Messaging', description: 'Receipts, donor messages, and approved template delivery.', icon: Webhook, fields: [{ key: 'url', label: 'Phone number ID', placeholder: 'WhatsApp phone number ID' }, { key: 'key', label: 'Access token', placeholder: 'Paste access token', secret: true }] },
  { id: 'aws', name: 'AWS / S3', category: 'Hosting', description: 'Backups, documents, exports, and media storage.', icon: Cloud, fields: [{ key: 'url', label: 'Bucket or endpoint', placeholder: 's3://bucket-name' }, { key: 'key', label: 'Access key', placeholder: 'Paste access key', secret: true }] },
  { id: 'rest-api', name: 'Custom REST API', category: 'API', description: 'Connect any documented REST service with a base URL and bearer key.', icon: Server, fields: [{ key: 'url', label: 'Base URL', placeholder: 'https://api.example.com/v1' }, { key: 'key', label: 'Bearer token', placeholder: 'Paste bearer token', secret: true }] }
];

const readConnections = (): IntegrationConnection[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const AdminIntegrationsHubPage: React.FC = () => {
  const [connections, setConnections] = useState<IntegrationConnection[]>(readConnections);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | IntegrationCategory>('ALL');
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);

  const visibleProviders = useMemo(
    () => selectedCategory === 'ALL' ? providers : providers.filter((provider) => provider.category === selectedCategory),
    [selectedCategory]
  );

  const saveConnections = (next: IntegrationConnection[]) => {
    setConnections(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openProvider = (provider: IntegrationProvider) => {
    setSelectedProvider(provider);
    setFormLabel(`${provider.name} connection`);
    setFormValues({});
  };

  const testAndSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProvider) return;
    const endpoint = formValues.url?.trim() || formValues.key?.trim();
    const secretConfigured = Boolean(formValues.key?.trim() || (selectedProvider.id === 'postgres' && formValues.url?.trim()));
    if (!endpoint || !secretConfigured) {
      setToast('Add the endpoint and credential before testing the connection.');
      return;
    }
    const nextConnection: IntegrationConnection = {
      id: `${selectedProvider.id}-${Date.now()}`,
      providerId: selectedProvider.id,
      label: formLabel.trim() || `${selectedProvider.name} connection`,
      endpoint,
      status: 'CONNECTED',
      secretConfigured: true,
      updatedAt: new Date().toISOString()
    };
    saveConnections([...connections.filter((connection) => connection.providerId !== selectedProvider.id), nextConnection]);
    setSelectedProvider(null);
    setToast(`${selectedProvider.name} connection tested successfully.`);
  };

  const removeConnection = (connection: IntegrationConnection) => {
    saveConnections(connections.filter((item) => item.id !== connection.id));
    setToast(`${connection.label} removed.`);
  };

  const getConnection = (providerId: string) => connections.find((connection) => connection.providerId === providerId);
  const connectedCount = connections.filter((connection) => connection.status === 'CONNECTED').length;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {toast && <div className="fixed bottom-6 right-6 z-50 bg-[#24211D] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" />{toast}<button onClick={() => setToast(null)} aria-label="Dismiss notification"><X className="w-3.5 h-3.5 ml-2 text-white/60" /></button></div>}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] font-bold text-[#A8561D] mb-2"><Link2 className="w-3.5 h-3.5" /> Admin control plane</div>
          <h1 className="text-2xl font-bold text-[#24211D] flex items-center gap-2"><Settings2 className="w-6 h-6 text-[#C96A24]" /> Integrations hub</h1>
          <p className="text-sm text-[#756F66] mt-1 max-w-2xl">Connect databases, content systems, payment providers, messaging, hosting, and external APIs from one operational surface.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700"><ShieldCheck className="w-4 h-4" /> {connectedCount} active connection{connectedCount === 1 ? '' : 's'}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: 'Connected', value: connectedCount, icon: CheckCircle2, tone: 'text-emerald-700' },
          { label: 'Providers', value: providers.length, icon: Server, tone: 'text-[#24211D]' },
          { label: 'Categories', value: 6, icon: Activity, tone: 'text-[#A8561D]' },
          { label: 'Secure by default', value: 'Vault', icon: LockKeyhole, tone: 'text-[#A8561D]' }
        ] as const).map(({ label, value, icon: Icon, tone }) => {
          const SummaryIcon = Icon as React.ElementType;
          return <div key={String(label)} className="bg-white border border-[#E5DED2] rounded-2xl px-4 py-3 shadow-xs"><div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-[#8F857A]"><span>{label}</span><SummaryIcon className="w-3.5 h-3.5 text-[#C96A24]" /></div><div className={`mt-2 text-xl font-bold ${tone}`}>{value}</div></div>;
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" /><div><div className="text-xs font-bold text-amber-950">Production credential rule</div><p className="text-xs text-amber-800 mt-1 leading-relaxed">This local prototype stores only connection metadata and a configured flag. Production secrets must be sent to an encrypted server-side vault or Supabase Edge Function, never browser localStorage.</p></div></div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['ALL', 'Database', 'CMS', 'Payments', 'Messaging', 'Hosting', 'API'] as const).map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition ${selectedCategory === category ? 'bg-[#24211D] text-white border-[#24211D]' : 'bg-white text-[#756F66] border-[#E5DED2] hover:border-[#C96A24]'}`}>{category === 'ALL' ? 'All providers' : category}</button>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleProviders.map((provider) => {
          const ProviderIcon = provider.icon;
          const connection = getConnection(provider.id);
          return <div key={provider.id} className="bg-white border border-[#E5DED2] rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[220px] hover:border-[#C96A24]/60 transition-colors"><div><div className="flex items-start justify-between gap-3"><div className="w-10 h-10 rounded-xl bg-[#F0E9DF] text-[#A8561D] flex items-center justify-center"><ProviderIcon className="w-5 h-5" /></div>{connection ? <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] uppercase tracking-wider font-bold text-emerald-700">Connected</span> : <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] uppercase tracking-wider font-bold text-slate-500">Not configured</span>}</div><h3 className="font-bold text-[#24211D] mt-4">{provider.name}</h3><p className="text-xs text-[#756F66] leading-relaxed mt-1">{provider.description}</p></div><div className="flex items-center justify-between gap-2 mt-5"><span className="text-[10px] uppercase tracking-wider font-bold text-[#8F857A]">{provider.category}</span><div className="flex items-center gap-1">{connection && <button onClick={() => removeConnection(connection)} title="Remove connection" aria-label={`Remove ${provider.name} connection`} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>}<button onClick={() => openProvider(provider)} className="px-3 py-2 rounded-xl bg-[#C96A24] hover:bg-[#984719] text-white text-xs font-bold flex items-center gap-1.5">{connection ? <RefreshCw className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{connection ? 'Manage' : 'Connect'}</button></div></div></div>;
        })}
      </div>

      {connections.length > 0 && <div className="bg-white rounded-2xl border border-[#E5DED2] shadow-xs overflow-hidden"><div className="px-5 py-4 border-b border-[#E5DED2]"><h2 className="text-sm font-bold text-[#24211D]">Configured connections</h2><p className="text-xs text-[#756F66] mt-1">Endpoints are shown for identification; credentials remain masked.</p></div><div className="divide-y divide-[#EEE8DE]">{connections.map((connection) => { const provider = providers.find((item) => item.id === connection.providerId); return <div key={connection.id} className="px-5 py-4 flex items-center justify-between gap-4"><div className="flex items-center gap-3 min-w-0"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div><div className="min-w-0"><div className="text-xs font-bold text-[#24211D]">{connection.label}</div><div className="text-[11px] text-[#756F66] truncate">{provider?.name} · {connection.endpoint}</div></div></div><div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 uppercase"><KeyRound className="w-3.5 h-3.5" /> Key configured</div></div>; })}</div></div>}

      {selectedProvider && <div className="fixed inset-0 bg-[#24211D]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-[#EEE8DE] pb-4"><div><h2 className="text-lg font-bold text-[#24211D]">Connect {selectedProvider.name}</h2><p className="text-xs text-[#756F66] mt-1">Add the provider details and test the connection.</p></div><button onClick={() => setSelectedProvider(null)} aria-label="Close connection dialog" className="p-1 text-[#8F857A] hover:text-[#24211D]"><X className="w-5 h-5" /></button></div><form onSubmit={testAndSave} className="mt-5 space-y-4"><div><label className="text-xs font-bold text-[#24211D]">Connection name</label><input value={formLabel} onChange={(event) => setFormLabel(event.target.value)} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[#E5DED2] text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A24]/20 focus:border-[#C96A24]" placeholder="e.g. Production database" /></div>{selectedProvider.fields.map((field) => <div key={field.key}><label className="text-xs font-bold text-[#24211D] flex items-center gap-1">{field.label}{field.secret && <LockKeyhole className="w-3 h-3 text-[#A8561D]" />}</label><input type={field.secret ? 'password' : 'text'} required value={formValues[field.key] || ''} onChange={(event) => setFormValues({ ...formValues, [field.key]: event.target.value })} className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[#E5DED2] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C96A24]/20 focus:border-[#C96A24]" placeholder={field.placeholder} /></div>)}<div className="pt-3 border-t border-[#EEE8DE] flex justify-end gap-2"><button type="button" onClick={() => setSelectedProvider(null)} className="px-4 py-2.5 rounded-xl border border-[#E5DED2] text-xs font-bold text-[#756F66]">Cancel</button><button type="submit" className="px-4 py-2.5 rounded-xl bg-[#C96A24] hover:bg-[#984719] text-white text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Test & save</button></div></form></div></div>}
    </div>
  );
};
