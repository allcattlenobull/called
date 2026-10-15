import { SKILLS, SKILL_LEVELS } from '../../data/vocab';
import { useStore } from '../../state/store';
import type { SkillId, SkillLevel } from '../../types';
import { OptionGroup, Progress } from '../../components/ui';
import { NextAssessment } from './Assessment';

const IDS = Object.keys(SKILLS) as SkillId[];

export function SkillsAssessment() {
  const { profile, update } = useStore();
  const rated = IDS.filter((id) => profile.skills[id] !== undefined).length;

  const set = (id: SkillId, v: SkillLevel) =>
    update((p) => {
      p.skills[id] = v;
      if (IDS.every((s) => p.skills[s] !== undefined)) p.completed.skills = new Date().toISOString();
    });

  return (
    <section className="runner">
      <p>Rate what you’ve actually done, not what you hope to do. “Haven’t tried it” is a useful answer: it points to things worth testing.</p>
      <div className="sticky-progress">
        <Progress value={rated} max={IDS.length} label="Skills rated" />
      </div>
      <div className="stack-lg" style={{ marginTop: 'var(--s-5)' }}>
        {IDS.map((id) => (
          <div key={id} className="skill-row">
            <OptionGroup
              legend={
                <>
                  {SKILLS[id].label}
                  <span className="option__hint" style={{ display: 'block', fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 'var(--fs-sm)' }}>
                    {SKILLS[id].example}
                  </span>
                </>
              }
              layout="row"
              value={profile.skills[id]}
              onChange={(v) => set(id, v as SkillLevel)}
              options={SKILL_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
            />
          </div>
        ))}
      </div>
      {rated === IDS.length && <NextAssessment current="skills" />}
    </section>
  );
}
