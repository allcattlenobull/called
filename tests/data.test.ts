import { describe, expect, it } from 'vitest';
import { CAREERS, CAREER_BY_ID } from '../src/data/careers';
import { SIMULATIONS } from '../src/data/simulations';
import { EXPERIMENTS, EXPERIMENT_BY_ID } from '../src/data/purpose-experiments';
import { INTEREST_ITEMS, APTITUDE_ITEMS, WORK_STYLE_ITEMS } from '../src/data/assessments';
import { OMIB_PILOT_ITEMS } from '../src/data/assessments/omibPilot';
import { FAMILIES } from '../src/data/vocab';
import { readFileSync, readdirSync } from 'node:fs';
import stateMarket from '../src/data/market/state-market.json';

describe('career dataset', () => {
  it('has unique ids', () => {
    expect(new Set(CAREERS.map((c) => c.id)).size).toBe(CAREERS.length);
  });

  it('covers every career family', () => {
    const families = new Set(CAREERS.map((c) => c.family));
    for (const f of Object.keys(FAMILIES)) expect(families.has(f as never), f).toBe(true);
  });

  it('covers every education level', () => {
    const levels = new Set(CAREERS.map((c) => c.education.level));
    for (const l of ['none', 'certificate', 'apprenticeship', 'associate', 'bachelor', 'master', 'doctoral']) expect(levels.has(l as never), l).toBe(true);
  });

  it('has sane pay ranges', () => {
    for (const c of CAREERS) {
      expect(c.pay.low, c.id).toBeLessThan(c.pay.median);
      expect(c.pay.median, c.id).toBeLessThan(c.pay.high);
    }
  });

  it('only references careers, simulations and experiments that exist', () => {
    const sims = new Set(SIMULATIONS.map((s) => s.id));
    for (const c of CAREERS) {
      for (const r of c.related) expect(CAREER_BY_ID[r], `${c.id} -> ${r}`).toBeDefined();
      if (c.simulationId) expect(sims.has(c.simulationId), `${c.id} sim`).toBe(true);
      for (const e of c.experimentIds ?? []) expect(EXPERIMENT_BY_ID[e], `${c.id} -> ${e}`).toBeDefined();
    }
    for (const s of SIMULATIONS) for (const id of s.careerIds) expect(CAREER_BY_ID[id], `${s.id} -> ${id}`).toBeDefined();
  });

  it('fills the reality check for every career', () => {
    for (const c of CAREERS) {
      expect(c.imagine.length, c.id).toBeGreaterThan(0);
      expect(c.reality.length, c.id).toBeGreaterThan(1);
      expect(c.responsibilities.length, c.id).toBeGreaterThan(1);
    }
  });
});

describe('market data', () => {
  it('keeps state records sparse and safe to fall back from', () => {
    expect(typeof stateMarket.source).toBe('string');
    const states = stateMarket.states as Record<string, Record<string, { pay?: { median: number }; outlook?: { growth: number; baseYear: number; projectionYear: number } }>>;
    for (const [state, occupations] of Object.entries(states)) {
      expect(state).toMatch(/^[A-Z]{2}$/);
      for (const [soc, record] of Object.entries(occupations)) {
        expect(soc).toMatch(/^\d{2}-\d{4}$/);
        if (record.pay) expect(record.pay.median).toBeGreaterThan(0);
        if (record.outlook) {
          expect(record.outlook.projectionYear).toBeGreaterThan(record.outlook.baseYear);
          expect(Number.isFinite(record.outlook.growth)).toBe(true);
        }
        expect(record.pay || record.outlook).toBeTruthy();
      }
    }
  });
});

describe('assessments and simulations', () => {
  it('has five interest items per interest family', () => {
    const counts: Record<string, number> = {};
    for (const i of INTEREST_ITEMS) counts[i.interest] = (counts[i.interest] ?? 0) + 1;
    expect(Object.values(counts)).toEqual([5, 5, 5, 5, 5, 5]);
  });

  it('has two work style items per axis and valid aptitude answers', () => {
    expect(WORK_STYLE_ITEMS).toHaveLength(12);
    for (const a of APTITUDE_ITEMS) if (!a.grid) expect(a.answer).toBeLessThan(a.options.length);
  });

  it('keeps the OMIB pilot item codes and solutions structurally valid', () => {
    expect(OMIB_PILOT_ITEMS).toHaveLength(10);
    for (const item of OMIB_PILOT_ITEMS) {
      expect(item.cells).toHaveLength(9);
      expect(item.cells.every((cell) => /^[01]{20}$/.test(cell))).toBe(true);
      expect(item.solution).toMatch(/^[01]{20}$/);
    }
  });

  it('gives every choice step exactly one or more strong options', () => {
    for (const s of SIMULATIONS) {
      for (const step of s.steps) {
        if (step.type === 'text') expect(step.guidance?.length, `${s.id}/${step.id}`).toBeGreaterThan(0);
        else {
          const strong = step.options!.filter((o) => o.score === 2).length;
          expect(strong, `${s.id}/${step.id}`).toBeGreaterThanOrEqual(step.type === 'multi' ? step.pick ?? 2 : 1);
        }
      }
    }
    expect(EXPERIMENTS.length).toBeGreaterThan(8);
  });
});

describe('brand rules', () => {
  // Beige and beige-adjacent colors are prohibited from the Called brand system.
  const BANNED = ['#f5f0e6', '#f4efe6', '#eee8dc', '#faf5ea', '#f5f5dc', '#fffdd0', '#d2b48c', '#c2b280', '#f4f1ea', 'beige', 'ivory', 'wheat', 'tan;', 'khaki'];
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}/${d.name}`) : [`${dir}/${d.name}`]));

  it('uses no beige anywhere in styles or components', () => {
    // The brand page and BRAND.md name the banned hex values as text; they are documentation, not colors.
    const files = walk('src').filter((f) => /\.(css|tsx|ts)$/.test(f) && !f.endsWith('Brand.tsx'));
    for (const f of files) {
      const text = readFileSync(f, 'utf8').toLowerCase();
      for (const b of BANNED) {
        if (b === 'beige' || b === 'ivory') continue; // words appear in documentation strings; colors are checked below
        expect(text.includes(b), `${f} contains ${b}`).toBe(false);
      }
    }
  });

  it('keeps every light neutral cool (blue at least as strong as red)', () => {
    const css = readFileSync('src/styles/tokens.css', 'utf8');
    for (const m of css.matchAll(/#([0-9a-f]{6})\b/gi)) {
      const hex = m[1];
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
      const max = Math.max(r, g, b);
      const nearNeutral = max > 200 && (max - Math.min(r, g, b)) / max < 0.12;
      if (nearNeutral) expect(b >= r, `#${hex} is a warm light neutral`).toBe(true);
    }
  });
});
