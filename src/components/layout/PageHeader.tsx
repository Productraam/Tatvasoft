import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, title, subtitle, actions }) => (
  <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-stone-900 leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-stone-500 leading-tight mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
