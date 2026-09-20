import React from 'react';
import { cn } from '../../lib/cn';
import { EmptyState } from './primitives';
import { BarChart3 } from 'lucide-react';

/* Lightweight, dependency-free SVG charts tuned to the Indic theme. */

const PALETTE = ['#e65100', '#f59e0b', '#15803d', '#0369a1', '#7c3aed', '#be123c', '#0d9488', '#a16207'];

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

const formatShort = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${(n / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

const chartEmpty = (
  <EmptyState compact icon={BarChart3} title="No data to chart" description="Records will appear here once available." />
);

/* ============================ BarChart ============================ */
export const BarChart: React.FC<{
  data: ChartDatum[];
  height?: number;
  className?: string;
  valuePrefix?: string;
}> = ({ data, height = 200, className, valuePrefix = '₹' }) => {
  if (!data.length || data.every((d) => d.value === 0)) return chartEmpty;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end justify-around gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * (height - 28), 2);
          return (
            <div key={d.label} className="flex flex-col items-center justify-end flex-1 h-full group">
              <span className="text-[10px] font-semibold text-stone-600 mb-1 whitespace-nowrap">
                {valuePrefix}
                {formatShort(d.value)}
              </span>
              <div
                className="w-full max-w-[46px] rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                style={{ height: h, backgroundColor: d.color ?? PALETTE[i % PALETTE.length] }}
                title={`${d.label}: ${valuePrefix}${d.value.toLocaleString('en-IN')}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-start justify-around gap-2 mt-2 border-t border-stone-100 pt-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center text-[10px] text-stone-500 truncate px-0.5">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================ DonutChart ============================ */
export const DonutChart: React.FC<{
  data: ChartDatum[];
  size?: number;
  thickness?: number;
  className?: string;
  centerLabel?: React.ReactNode;
}> = ({ data, size = 180, thickness = 26, className, centerLabel }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) return chartEmpty;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-4', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.map((d, i) => {
            const fraction = d.value / total;
            const dash = fraction * circumference;
            const seg = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={d.color ?? PALETTE[i % PALETTE.length]}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                className="transition-all duration-500"
              >
                <title>{`${d.label}: ${((fraction) * 100).toFixed(1)}%`}</title>
              </circle>
            );
            offset += dash;
            return seg;
          })}
        </svg>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerLabel}
          </div>
        )}
      </div>
      <ul className="space-y-1.5 w-full">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 text-stone-600 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: d.color ?? PALETTE[i % PALETTE.length] }}
              />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="font-semibold text-stone-800 whitespace-nowrap">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ============================ LineChart ============================ */
export const LineChart: React.FC<{
  data: ChartDatum[];
  height?: number;
  className?: string;
  color?: string;
  valuePrefix?: string;
}> = ({ data, height = 200, className, color = '#e65100', valuePrefix = '₹' }) => {
  if (data.length < 2) return chartEmpty;
  const width = 600;
  const pad = 30;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((d.value - min) / range) * (height - pad * 2);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${path} L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`;

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 320 }} role="img">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lineFill)" />
        <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke={color} strokeWidth={2}>
              <title>{`${p.label}: ${valuePrefix}${p.value.toLocaleString('en-IN')}`}</title>
            </circle>
            <text x={p.x} y={height - 8} textAnchor="middle" className="fill-stone-400" fontSize={10}>
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
