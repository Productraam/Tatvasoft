import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';
import { EmptyState, SkeletonRows, type EmptyStateProps } from './primitives';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string;
  loading?: boolean;
  empty?: EmptyStateProps;
  onRowClick?: (row: T) => void;
  className?: string;
  stickyHeader?: boolean;
  footer?: React.ReactNode;
  ariaLabel?: string;
}

const alignClass = (align?: 'left' | 'right' | 'center') =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  empty,
  onRowClick,
  className,
  stickyHeader = true,
  footer,
  ariaLabel,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const sorted = React.useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sortKey, sortDir, columns]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <div className="p-3">
        <SkeletonRows rows={6} />
      </div>
    );
  }

  if (data.length === 0 && empty) {
    return <EmptyState {...empty} />;
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-xs text-left border-collapse" aria-label={ariaLabel}>
        <thead
          className={cn(
            'text-[10px] uppercase tracking-wider text-stone-500 bg-stone-50',
            stickyHeader && 'sticky top-0 z-10',
          )}
        >
          <tr className="border-b border-stone-200">
            {columns.map((col) => {
              const sortable = !!col.sortValue;
              const isSorted = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cn('px-3 py-2.5 font-bold', alignClass(col.align), col.headerClassName)}
                  aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        'inline-flex items-center gap-1 hover:text-stone-800 transition',
                        col.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      {col.header}
                      {isSorted ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      ) : (
                        <ChevronDown className="w-3 h-3 opacity-30" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {sorted.map((row, index) => (
            <tr
              key={rowKey(row, index)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'hover:bg-stone-50 transition',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-3 py-2.5 text-stone-700', alignClass(col.align), col.className)}
                >
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="border-t-2 border-stone-200 font-bold text-stone-800">{footer}</tfoot>}
      </table>
    </div>
  );
}
