import { useCallback, useRef, useState } from 'react';
import { useStore } from './store';

/**
 * Like useState, but the value is saved in the profile as a draft so the user can close the
 * tab and come back later to finish. Call `clear` when the work is complete.
 */
export function useDraft<T>(key: string, initial: T | (() => T)) {
  const { profile, setDraft, clearDraft } = useStore();
  const saved = profile.drafts[key] as T | undefined;
  const [resumed] = useState(saved !== undefined);
  const [value, setValue] = useState<T>(() => (saved !== undefined ? saved : typeof initial === 'function' ? (initial as () => T)() : initial));
  const latest = useRef(value);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const v = typeof next === 'function' ? (next as (p: T) => T)(latest.current) : next;
      latest.current = v;
      setValue(v);
      setDraft(key, v);
    },
    [key, setDraft],
  );

  const clear = useCallback(() => clearDraft(key), [key, clearDraft]);
  return [value, set, clear, resumed] as const;
}
