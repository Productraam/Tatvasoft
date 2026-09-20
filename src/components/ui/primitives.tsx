import React from 'react';
import { Loader2, X, Search, Inbox } from 'lucide-react';
import { cn } from '../../lib/cn';
import { ModalPortal } from './ModalPortal';

/* ==========================================================================
   Button
   ========================================================================== */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-saffron-600 hover:bg-saffron-700 text-white border border-transparent shadow-sm',
  secondary:
    'bg-saffron-50 hover:bg-saffron-100 text-saffron-800 border border-saffron-200',
  outline:
    'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300',
  ghost: 'bg-transparent hover:bg-stone-100 text-stone-600 border border-transparent',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-transparent shadow-sm',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-4 py-2 text-sm gap-2 rounded-xl',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ElementType;
  iconRight?: React.ElementType;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon: Icon,
      iconRight: IconRight,
      fullWidth,
      className,
      children,
      disabled,
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold btn-press transition',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-500 focus-visible:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
          BUTTON_VARIANTS[variant],
          BUTTON_SIZES[size],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 className={cn(iconSize, 'animate-spin')} aria-hidden="true" />
        ) : (
          Icon && <Icon className={iconSize} aria-hidden="true" />
        )}
        {children}
        {!loading && IconRight && <IconRight className={iconSize} aria-hidden="true" />}
      </button>
    );
  },
);
Button.displayName = 'Button';

/* ==========================================================================
   Card
   ========================================================================== */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hover?: boolean;
  as?: React.ElementType;
}

export const Card: React.FC<CardProps> = ({
  padded = true,
  hover = false,
  as: Tag = 'div',
  className,
  children,
  ...rest
}) => (
  <Tag
    className={cn(
      'bg-white rounded-2xl border border-stone-200 shadow-sm',
      padded && 'p-4',
      hover && 'card-lift',
      className,
    )}
    {...rest}
  >
    {children}
  </Tag>
);

/* ==========================================================================
   StatCard
   ========================================================================== */
type StatTone = 'saffron' | 'emerald' | 'rose' | 'amber' | 'sky' | 'stone';

const STAT_TONES: Record<StatTone, { border: string; value: string; icon: string }> = {
  saffron: { border: 'border-saffron-200', value: 'text-saffron-700', icon: 'text-saffron-600' },
  emerald: { border: 'border-emerald-200', value: 'text-emerald-700', icon: 'text-emerald-600' },
  rose: { border: 'border-rose-200', value: 'text-rose-700', icon: 'text-rose-600' },
  amber: { border: 'border-amber-200', value: 'text-amber-700', icon: 'text-amber-600' },
  sky: { border: 'border-sky-200', value: 'text-sky-700', icon: 'text-sky-600' },
  stone: { border: 'border-stone-200', value: 'text-stone-900', icon: 'text-stone-500' },
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  tone?: StatTone;
  hint?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  tone = 'stone',
  hint,
  className,
}) => {
  const t = STAT_TONES[tone];
  return (
    <div className={cn('bg-white p-3.5 rounded-2xl border shadow-sm space-y-1', t.border, className)}>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>{label}</span>
        {Icon && <Icon className={cn('w-4 h-4', t.icon)} aria-hidden="true" />}
      </div>
      <div className={cn('text-xl font-bold counter-value', t.value)}>{value}</div>
      {hint && <div className="text-[10px] text-stone-400">{hint}</div>}
    </div>
  );
};

/* ==========================================================================
   Badge
   ========================================================================== */
type BadgeTone = 'saffron' | 'emerald' | 'rose' | 'amber' | 'sky' | 'stone' | 'violet';

const BADGE_TONES: Record<BadgeTone, string> = {
  saffron: 'bg-saffron-50 text-saffron-700 border-saffron-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  stone: 'bg-stone-100 text-stone-600 border-stone-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
};

export const Badge: React.FC<{
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}> = ({ tone = 'stone', children, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide',
      BADGE_TONES[tone],
      className,
    )}
  >
    {children}
  </span>
);

/* ==========================================================================
   Form primitives — FormField, Input, Textarea, Select
   ========================================================================== */
let fieldSeq = 0;
const useFieldId = (provided?: string) => {
  const [id] = React.useState(() => provided ?? `fld-${++fieldSeq}`);
  return id;
};

export interface FieldWrapperProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FieldWrapperProps> = ({
  label,
  required,
  error,
  hint,
  htmlFor,
  className,
  children,
}) => (
  <div className={cn('space-y-1', className)}>
    {label && (
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold text-stone-700">
        {label}
        {required && <span className="text-saffron-600"> *</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-[10px] font-medium text-rose-600" role="alert">
        {error}
      </p>
    ) : (
      hint && <p className="text-[10px] text-stone-400">{hint}</p>
    )}
  </div>
);

const controlBase =
  'w-full px-3 py-2 border rounded-xl text-xs font-medium text-stone-900 bg-white transition focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:bg-stone-50 disabled:text-stone-400';
const controlError = 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500';
const controlNormal = 'border-stone-300';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, id, className, containerClassName, ...rest }, ref) => {
    const fieldId = useFieldId(id);
    return (
      <FormField
        label={label}
        required={required}
        error={error}
        hint={hint}
        htmlFor={fieldId}
        className={containerClassName}
      >
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          className={cn(controlBase, error ? controlError : controlNormal, className)}
          {...rest}
        />
      </FormField>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, id, className, containerClassName, ...rest }, ref) => {
    const fieldId = useFieldId(id);
    return (
      <FormField
        label={label}
        required={required}
        error={error}
        hint={hint}
        htmlFor={fieldId}
        className={containerClassName}
      >
        <textarea
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          className={cn(controlBase, 'resize-y', error ? controlError : controlNormal, className)}
          {...rest}
        />
      </FormField>
    );
  },
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, id, className, containerClassName, children, ...rest }, ref) => {
    const fieldId = useFieldId(id);
    return (
      <FormField
        label={label}
        required={required}
        error={error}
        hint={hint}
        htmlFor={fieldId}
        className={containerClassName}
      >
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={!!error}
          className={cn(controlBase, 'pr-8', error ? controlError : controlNormal, className)}
          {...rest}
        >
          {children}
        </select>
      </FormField>
    );
  },
);
Select.displayName = 'Select';

/* ==========================================================================
   PageHeader
   ========================================================================== */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  emoji?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  emoji,
  actions,
  className,
}) => (
  <div
    className={cn(
      'bg-white rounded-2xl p-4 shadow-sm border border-saffron-100 flex flex-col md:flex-row md:items-center justify-between gap-4',
      className,
    )}
  >
    <div className="flex items-center gap-3">
      {(Icon || emoji) && (
        <div className="w-10 h-10 rounded-xl bg-saffron-100 text-saffron-800 flex items-center justify-center text-lg shrink-0">
          {Icon ? <Icon className="w-5 h-5" aria-hidden="true" /> : emoji}
        </div>
      )}
      <div>
        <h1 className="text-h2 text-stone-900">{title}</h1>
        {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

/* ==========================================================================
   SegmentedTabs
   ========================================================================== */
export interface SegmentedTabsProps<T extends string> {
  tabs: { id: T; label: React.ReactNode }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  ariaLabel,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex bg-stone-100 p-1 rounded-xl gap-1', className)}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-1',
              active ? 'bg-white text-saffron-700 shadow-sm' : 'text-stone-600 hover:text-stone-900',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   EmptyState
   ========================================================================== */
export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-8 px-4' : 'py-14 px-6',
      className,
    )}
  >
    <div className="w-12 h-12 rounded-2xl bg-saffron-50 border border-saffron-100 flex items-center justify-center mb-3">
      <Icon className="w-6 h-6 text-saffron-500" aria-hidden="true" />
    </div>
    <p className="text-sm font-semibold text-stone-700">{title}</p>
    {description && <p className="text-xs text-stone-400 mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

/* ==========================================================================
   Skeleton
   ========================================================================== */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-stone-200/70', className)} aria-hidden="true" />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-2 w-20" />
  </div>
);

export const SkeletonRows: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-full" />
    ))}
  </div>
);

/* ==========================================================================
   Modal — accessible dialog with ESC-to-close + focus trap
   ========================================================================== */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
}

const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  closeOnBackdrop = true,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button, input, select, textarea, a[href]')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalPortal>
      <div
      className="fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'w-full bg-white rounded-2xl shadow-indic-lg border border-stone-200 max-h-[90vh] flex flex-col',
          MODAL_SIZES[size],
        )}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-stone-100">
            <div>
              <h2 id={titleId} className="text-h3 text-stone-900">
                {title}
              </h2>
              {description && <p className="text-xs text-stone-500 mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-stone-100 bg-stone-50/60 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
      </div>
    </ModalPortal>
  );
};

/* ==========================================================================
   SearchInput
   ========================================================================== */
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ containerClassName, className, 'aria-label': ariaLabel, ...rest }, ref) => (
    <div className={cn('relative', containerClassName)}>
      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        aria-label={ariaLabel ?? 'Search'}
        className={cn(controlBase, controlNormal, 'pl-9', className)}
        {...rest}
      />
    </div>
  ),
);
SearchInput.displayName = 'SearchInput';
