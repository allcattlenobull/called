import type { CompassDim, CompassFamily } from '../lib/compass';

const FAMILY_VAR: Record<CompassFamily, string> = {
  self: 'var(--dim-self)',
  life: 'var(--dim-life)',
  purpose: 'var(--dim-purpose)',
};

interface Props {
  dims: Pick<CompassDim, 'id' | 'label' | 'family' | 'strength' | 'evidence'>[];
  size?: number;
  labels?: boolean;
  animate?: boolean;
  title?: string;
}

/**
 * The Purpose Compass bloom. Each petal is one dimension:
 * length is strength, opacity is how much evidence backs it, and unexplored petals are dashed outlines.
 */
export function CompassBloom({ dims, size = 360, labels = false, animate = false, title = 'Purpose Compass' }: Props) {
  const vb = labels ? 520 : 400;
  const c = vb / 2;
  const inner = 30;
  const maxR = 165;
  const minR = 70;
  const n = dims.length;
  const described = dims
    .map((d) => `${d.label}: ${d.evidence === 0 ? 'not explored yet' : `${Math.round(d.strength * 100)} strength, ${Math.round(d.evidence * 100)}% evidence`}`)
    .join('; ');

  return (
    <svg
      className={`bloom${animate ? ' bloom--animate' : ''}`}
      viewBox={`0 0 ${vb} ${vb}`}
      width={size}
      height={size}
      role="img"
      aria-label={`${title}. ${described}`}
    >
      <circle cx={c} cy={c} r={maxR + 6} className="bloom__orbit" />
      <circle cx={c} cy={c} r={(maxR + minR) / 2} className="bloom__orbit bloom__orbit--inner" />
      {dims.map((d, i) => {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const explored = d.evidence > 0;
        const r = explored ? minR + d.strength * (maxR - minR) : maxR * 0.78;
        const width = 0.2; // radians of half-width at the widest point
        const p = (rad: number, a: number) => [c + Math.cos(a) * rad, c + Math.sin(a) * rad].map((v) => v.toFixed(1)).join(' ');
        const start = p(inner, angle);
        const tip = p(r, angle);
        const s1 = p(r * 0.62, angle - width);
        const s2 = p(r * 0.62, angle + width);
        const d1 = `M ${start} Q ${s1} ${tip} Q ${s2} ${start} Z`;
        const color = FAMILY_VAR[d.family];
        const lp = (rad: number) => [c + Math.cos(angle) * rad, c + Math.sin(angle) * rad];
        const [lx, ly] = lp(maxR + 30);
        const anchor = Math.abs(Math.cos(angle)) < 0.2 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
        return (
          <g key={d.id} className="bloom__petal" style={{ ['--i' as string]: i }}>
            {explored ? (
              <path d={d1} fill={color} fillOpacity={0.22 + 0.68 * d.evidence} stroke={color} strokeWidth={1.5} />
            ) : (
              <path d={d1} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 5" />
            )}
            {labels && (
              <text x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" className="bloom__label">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
      <path
        d={`M ${c + 12.3} ${c - 9.6} A 15.6 15.6 0 1 0 ${c + 12.3} ${c + 9.6}`}
        fill="none"
        stroke="var(--text)"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <circle cx={c + 19.5} cy={c} r={4.6} fill="var(--primary)" />
    </svg>
  );
}

/** A believable sample compass for the home page and onboarding. */
export const SAMPLE_DIMS: Pick<CompassDim, 'id' | 'label' | 'family' | 'strength' | 'evidence'>[] = [
  { id: 'interests', label: 'Interests', family: 'self', strength: 0.86, evidence: 0.9 },
  { id: 'skills', label: 'Skills', family: 'self', strength: 0.6, evidence: 0.7 },
  { id: 'aptitudes', label: 'Aptitudes', family: 'self', strength: 0.72, evidence: 0.55 },
  { id: 'workStyle', label: 'Work style', family: 'self', strength: 0.5, evidence: 0.8 },
  { id: 'values', label: 'Values', family: 'life', strength: 0.92, evidence: 0.95 },
  { id: 'lifestyle', label: 'Lifestyle', family: 'life', strength: 0.64, evidence: 0.6 },
  { id: 'experience', label: 'Experience', family: 'life', strength: 0.78, evidence: 0.4 },
  { id: 'feedback', label: 'Feedback', family: 'life', strength: 0.4, evidence: 0 },
  { id: 'gifts', label: 'Gifts', family: 'purpose', strength: 0.82, evidence: 0.65 },
  { id: 'service', label: 'Service', family: 'purpose', strength: 0.7, evidence: 0.75 },
  { id: 'problems', label: 'Problems', family: 'purpose', strength: 0.55, evidence: 0.5 },
];
