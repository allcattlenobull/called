import { describe, expect, it } from 'vitest';
import { createCounselorPacket, parseCounselorPacket } from '../src/lib/counselorReports';
import { emptyProfile } from '../src/lib/profile';

describe('counselor packets', () => {
  it('contains a structured summary without journey secrets or journal text', () => {
    const profile = emptyProfile();
    profile.name = 'Jordan';
    profile.lastName = 'Lee';
    profile.journal.push({ id: 'private', createdAt: new Date().toISOString(), body: 'This must stay private' });
    profile.skills.communication = 3;
    const packet = createCounselorPacket(profile, true);
    const serialized = JSON.stringify(packet);
    expect(packet.displayName).toBe('Jordan Lee');
    expect(packet.firstName).toBe('Jordan');
    expect(packet.lastName).toBe('Lee');
    expect(packet.memberId).toBe(profile.memberId);
    expect(serialized).not.toContain(profile.code);
    expect(serialized).not.toContain('This must stay private');
    expect(serialized).not.toContain('journal');
    expect(parseCounselorPacket(serialized).studentId).toBe(profile.memberId);
  });

  it('supports anonymous exports and rejects ordinary journey files', () => {
    const profile = emptyProfile();
    profile.name = 'Jordan';
    expect(createCounselorPacket(profile, false).displayName).toBeUndefined();
    expect(() => parseCounselorPacket(JSON.stringify({ app: 'called', kind: 'journey' }))).toThrow(/counselor packet/);
  });
});
