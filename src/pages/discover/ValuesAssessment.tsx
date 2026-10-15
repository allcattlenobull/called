import { VALUES, VALUE_TIERS } from '../../data/vocab';
import { useStore } from '../../state/store';
import type { ValueId, ValueTier } from '../../types';
import { Callout, Progress } from '../../components/ui';
import { NextAssessment } from './Assessment';

const IDS = Object.keys(VALUES) as ValueId[];
const ESSENTIAL_SOFT_LIMIT = 4;

export function ValuesAssessment() {
  const { profile, update } = useStore();
  const sorted = IDS.filter((v) => profile.values[v]).length;
  const essentials = IDS.filter((v) => profile.values[v] === 'essential');

  const set = (id: ValueId, tier: ValueTier) =>
    update((p) => {
      p.values[id] = tier;
      if (IDS.every((v) => p.values[v])) p.completed.values = new Date().toISOString();
    });

  return (
    <section className="runner runner--wide">
      <p>Sort each value. Choosing is the point: if everything is essential, nothing is. Try to keep your essentials to about {ESSENTIAL_SOFT_LIMIT}.</p>
      <div className="sticky-progress">
        <Progress value={sorted} max={IDS.length} label="Values sorted" />
      </div>
      {essentials.length > ESSENTIAL_SOFT_LIMIT && (
        <div style={{ marginTop: 'var(--s-4)' }}>
          <Callout tone="warn" title={`You have ${essentials.length} essentials`}>
            That’s okay, but your matches will be sharper if you move a few to Important.
          </Callout>
        </div>
      )}
      <ul className="value-list">
        {IDS.map((id) => (
          <li key={id} className="value-row">
            <div className="value-row__text">
              <span className="value-row__name" id={`v-${id}`}>
                {VALUES[id].label}
              </span>
              <span className="muted small">{VALUES[id].blurb}</span>
            </div>
            <div className="segmented value-row__tiers" role="group" aria-labelledby={`v-${id}`}>
              {VALUE_TIERS.map((t) => (
                <button key={t.id} type="button" aria-pressed={profile.values[id] === t.id} onClick={() => set(id, t.id)} className={`tier-${t.id}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {sorted === IDS.length && (
        <div className="panel" style={{ marginTop: 'var(--s-6)' }}>
          <h2 className="h3">Your values, ranked</h2>
          <div className="tier-summary">
            {VALUE_TIERS.slice(0, 3).map((t) => {
              const items = IDS.filter((v) => profile.values[v] === t.id);
              return (
                <div key={t.id}>
                  <h3 className="h4">{t.label}</h3>
                  {items.length ? (
                    <ul className="plain">
                      {items.map((v) => (
                        <li key={v}>{VALUES[v].label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted small">None</p>
                  )}
                </div>
              );
            })}
          </div>
          <NextAssessment current="values" />
        </div>
      )}
    </section>
  );
}
