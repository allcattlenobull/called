import { useId, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

export function PageHeader({ title, lead, children, back }: { title: string; lead?: ReactNode; children?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <header className="pagehead">
      {back && (
        <Link to={back.to} className="backlink">
          <Icon name="arrowLeft" size={18} />
          {back.label}
        </Link>
      )}
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </header>
  );
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress">
      <div className="progress__meta">
        <span>{label}</span>
        <span>
          {value} of {max}
        </span>
      </div>
      <div className="progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'spark', title, children, action, as: Heading = 'h3' }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode; as?: 'h1' | 'h2' | 'h3' }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={28} />
      </span>
      <Heading className="empty__title">{title}</Heading>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Chip({ selected, onClick, children, family }: { selected: boolean; onClick: () => void; children: ReactNode; family?: 'self' | 'life' | 'purpose' }) {
  return (
    <button type="button" className={`chip${selected ? ' is-selected' : ''}${family ? ` fam-${family}` : ''}`} aria-pressed={selected} onClick={onClick}>
      {selected && <Icon name="check" size={16} />}
      {children}
    </button>
  );
}

/** A radio group rendered as large tappable options. */
export function OptionGroup<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  layout = 'stack',
  hideLegend,
}: {
  legend: ReactNode;
  options: { value: T; label: ReactNode; hint?: ReactNode }[];
  value: T | undefined;
  onChange: (v: T) => void;
  layout?: 'stack' | 'row' | 'grid';
  hideLegend?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className={`options options--${layout}`}>
      <legend className={hideLegend ? 'visually-hidden' : 'options__legend'}>{legend}</legend>
      <div className="options__list">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label key={String(o.value)} className={`option${checked ? ' is-checked' : ''}`}>
              <input type="radio" name={name} checked={checked} onChange={() => onChange(o.value)} />
              <span className="option__mark" aria-hidden="true" />
              <span className="option__text">
                {o.label}
                {o.hint && <span className="option__hint">{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'purpose' | 'warn' | 'evidence'; title?: string; children: ReactNode }) {
  const icon: IconName = tone === 'warn' ? 'alert' : tone === 'purpose' ? 'purpose' : tone === 'evidence' ? 'check' : 'info';
  return (
    <aside className={`callout callout--${tone}`}>
      <Icon name={icon} size={20} />
      <div>
        {title && <strong className="callout__title">{title}</strong>}
        <div>{children}</div>
      </div>
    </aside>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

export function Logo({ size = 28, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <path d="M33.03 15.38A14 14 0 1 0 33.03 32.62" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
        <circle cx="39.5" cy="24" r="4.5" fill="var(--logo-dot, var(--primary))" />
      </svg>
      {wordmark && <span className="logo__word">called</span>}
    </span>
  );
}
