import { LIFESTYLE_QUESTIONS } from '../../data/assessments';
import { useStore } from '../../state/store';
import type { LifestylePrefs } from '../../types';
import { OptionGroup, Progress } from '../../components/ui';
import { NextAssessment } from './Assessment';

export function LifestyleAssessment() {
  const { profile, update } = useStore();
  const answered = LIFESTYLE_QUESTIONS.filter((q) => profile.lifestyle[q.key]).length;

  const set = (key: keyof LifestylePrefs, value: string) =>
    update((p) => {
      (p.lifestyle as Record<string, string>)[key] = value;
      if (LIFESTYLE_QUESTIONS.every((q) => p.lifestyle[q.key])) p.completed.lifestyle = new Date().toISOString();
    });

  return (
    <section className="runner">
      <p>There are no wrong answers. These priorities help Called flag careers that may pull against the life you want, and explain why.</p>
      <div className="sticky-progress">
        <Progress value={answered} max={LIFESTYLE_QUESTIONS.length} label="Questions answered" />
      </div>
      <div className="stack-lg" style={{ marginTop: 'var(--s-5)' }}>
        {LIFESTYLE_QUESTIONS.map((q) => (
          <OptionGroup
            key={q.key}
            legend={q.question}
            value={profile.lifestyle[q.key] as string | undefined}
            onChange={(v) => set(q.key, v)}
            options={q.options.map((o) => ({ value: o.value as string, label: o.label }))}
          />
        ))}
      </div>
      {answered === LIFESTYLE_QUESTIONS.length && <NextAssessment current="lifestyle" />}
    </section>
  );
}
