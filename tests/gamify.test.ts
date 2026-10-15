import { webcrypto } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { emptyProfile, generateCode, normalizeCode } from '../src/lib/profile';
import { BADGES, earnedBadges, levelFor, pickQuests, questStatus, totalPoints, weeklyStreak } from '../src/lib/gamify';
import { decryptJourney, encryptJourney, journeyId } from '../src/lib/sync';
import { unfinished } from '../src/lib/resume';

if (!globalThis.crypto) (globalThis as { crypto?: unknown }).crypto = webcrypto;

describe('game layer', () => {
  it('starts at zero and level one', () => {
    const p = emptyProfile();
    expect(totalPoints(p)).toBe(0);
    expect(levelFor(0).level.name).toBe('Curious');
    expect(earnedBadges(p)).toHaveLength(0);
  });

  it('rewards real exploration and levels up', () => {
    const p = emptyProfile();
    p.onboarded = true;
    p.completed = { interests: 'x', skills: 'x', values: 'x' };
    p.simulations.push({ simulationId: 'software', completedAt: '', enjoyment: 4, enjoyed: [], frustrated: [], regularly: 'yes', natural: '', quality: 1 });
    const pts = totalPoints(p);
    expect(pts).toBe(25 + 3 * 60 + 80);
    expect(levelFor(pts).level.name).toBe('Explorer');
    expect(earnedBadges(p).map((b) => b.id)).toEqual(expect.arrayContaining(['first-step', 'field-tester']));
  });

  it('caps repetitive actions so points cannot be farmed', () => {
    const p = emptyProfile();
    p.careerViews = Array.from({ length: 500 }, (_, i) => `c${i}`);
    expect(totalPoints(p)).toBe(40 * 5);
  });

  it('counts weekly streaks without punishing a missed day', () => {
    const today = new Date('2026-10-15T12:00:00Z'); // a Thursday
    expect(weeklyStreak(['2026-10-13', '2026-10-06', '2026-09-29'], today)).toBe(3);
    expect(weeklyStreak(['2026-10-06', '2026-09-29'], today)).toBe(2);
    expect(weeklyStreak(['2026-09-15'], today)).toBe(0);
  });

  it('measures quest progress from the start of the week', () => {
    const p = emptyProfile();
    const snap = pickQuests(p, '2026-10-12');
    expect(snap.ids).toHaveLength(3);
    p.journal.push({ id: 'j', createdAt: '', body: 'x' });
    p.feedback.push({ id: 'f', createdAt: '', from: 'x', said: 'y', gifts: [] });
    p.careerViews = ['a', 'b', 'c', 'd', 'e'];
    const status = questStatus(p, snap);
    expect(status.length).toBe(3);
    expect(status.every((s) => s.have <= s.target)).toBe(true);
  });

  it('has unique badge ids', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
});

describe('journey codes', () => {
  it('generates readable codes and normalizes what people type', () => {
    const code = generateCode();
    expect(code).toMatch(/^CALL(-[2-9A-HJKMNP-TV-Z]{4}){4}$/);
    expect(normalizeCode(code.toLowerCase().replace(/-/g, ' '))).toBe(code);
    expect(normalizeCode(code.replace('CALL-', ''))).toBe(code);
    expect(normalizeCode('CALL-1234')).toBeNull();
  });

  it('encrypts so the backup cannot be read without the code', async () => {
    const p = emptyProfile();
    p.name = 'Private name';
    p.journal.push({ id: 'j', createdAt: '', body: 'my secret reflection' });
    const payload = await encryptJourney(p);
    expect(payload).not.toContain('secret');
    expect(payload).not.toContain(p.code);
    const back = await decryptJourney(p.code, payload);
    expect(back.journal[0].body).toBe('my secret reflection');
    await expect(decryptJourney(generateCode(), payload)).rejects.toBeTruthy();
    expect(await journeyId(p.code)).toMatch(/^[0-9a-f]{64}$/);
  }, 20000);
});

describe('resume', () => {
  it('lists partly finished assessments and simulations', () => {
    const p = emptyProfile();
    p.interests = { i1: 1, i2: 0 };
    p.drafts['sim:software'] = { phase: 'steps', stepIdx: 1, answers: {}, before: {} };
    const items = unfinished(p);
    expect(items.map((i) => i.id)).toEqual(expect.arrayContaining(['interests', 'sim:software']));
  });
});

describe('evidence is the game', () => {
  it('every badge explains what it taught and which evidence it builds', async () => {
    const { BADGES } = await import('../src/lib/gamify');
    for (const b of BADGES) {
      expect(b.insight.headline.length).toBeGreaterThan(10);
      expect(b.insight.body.length).toBeGreaterThan(30);
      expect(['self', 'exposure', 'real', 'decision']).toContain(b.evidence);
    }
    expect(BADGES.find((b) => b.id === 'honest-no')?.insight.headline).toBe('Ruling something out is progress.');
  });

  it('keeps names free of destination or religiously coded language', async () => {
    const { BADGES, LEVELS } = await import('../src/lib/gamify');
    expect(LEVELS.map((l) => l.name)).not.toContain('Called');
    expect(BADGES.map((b) => b.name)).not.toContain('Faithful steps');
  });

  it('activities raise the matching kind of evidence', async () => {
    const { evidenceProfile } = await import('../src/lib/evidence');
    const { emptyProfile } = await import('../src/lib/profile');
    const p = emptyProfile();
    const score = (id: string) => evidenceProfile(p).find((c) => c.id === id)!.score;
    expect(evidenceProfile(p).every((c) => c.score === 0)).toBe(true);
    p.experiments.push({ experimentId: 'interview-pro', status: 'done', startedAt: '' });
    expect(score('real')).toBeGreaterThan(0);
    expect(score('self')).toBe(0);
    p.simulations.push({ simulationId: 'healthcare', completedAt: '', enjoyment: 4, enjoyed: [], frustrated: [], regularly: 'yes', natural: '', quality: 1 });
    expect(score('exposure')).toBeGreaterThan(0);
    expect(evidenceProfile(p).find((c) => c.id === 'decision')!.next?.to).toBeTruthy();
  });
});
