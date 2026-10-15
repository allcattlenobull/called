import type { InterestId, SkillId } from '../../types';

export type SimBlock =
  | { kind: 'text'; text: string }
  | { kind: 'table'; caption: string; columns: string[]; rows: (string | number)[][] }
  | { kind: 'list'; title?: string; items: string[] }
  | { kind: 'code'; caption?: string; code: string }
  | { kind: 'quote'; who: string; text: string };

export interface SimOption {
  id: string;
  label: string;
  /** What a professional would think about this choice. Shown after answering. */
  feedback: string;
  /** 2 = strongest approach, 1 = reasonable, 0 = weak. Not shown as a grade. */
  score: 0 | 1 | 2;
}

export interface SimStep {
  id: string;
  title: string;
  prompt: string;
  blocks?: SimBlock[];
  type: 'choice' | 'multi' | 'text';
  options?: SimOption[];
  /** For multi: how many to choose. */
  pick?: number;
  /** For text: what professionals would include. Shown after the user writes. */
  guidance?: string[];
  placeholder?: string;
}

export interface SimAspect {
  id: string;
  label: string;
  interest?: InterestId;
  skill?: SkillId;
}

export interface Simulation {
  id: string;
  title: string;
  role: string;
  careerIds: string[];
  minutes: number;
  hook: string;
  setup: string;
  context: SimBlock[];
  steps: SimStep[];
  aspects: SimAspect[];
  realityNote: string;
}
