import type { Settings } from '../types';

const RESEARCH_URL = ((import.meta.env.VITE_RESEARCH_URL as string | undefined) ?? (import.meta.env.VITE_SYNC_URL as string | undefined))?.replace(/\/$/, '');
const PARTICIPANT_KEY = 'called.research.participant';
const QUEUE_KEY = 'called.research.queue';
const CONSENT_VERSION = '2026-10-15';

export const researchServiceAvailable = !!RESEARCH_URL;

export interface ResearchEvent {
  eventId: string;
  participantId: string;
  kind: 'simulation_completion' | 'simulation_outcome' | 'follow_up' | 'page_view' | 'usability_feedback';
  occurredAt: string;
  consentVersion: string;
  payload: Record<string, unknown>;
}

function randomId(bytes = 16): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(data, (n) => n.toString(16).padStart(2, '0')).join('');
}

function readQueue(): ResearchEvent[] {
  try {
    const value = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
    return Array.isArray(value) ? value.slice(-250) : [];
  } catch {
    return [];
  }
}

function writeQueue(events: ResearchEvent[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-250)));
  } catch {
    /* The live journey still works if research storage is unavailable. */
  }
}

export function researchParticipantId(): string {
  try {
    const existing = localStorage.getItem(PARTICIPANT_KEY);
    if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing;
    const next = randomId();
    localStorage.setItem(PARTICIPANT_KEY, next);
    return next;
  } catch {
    return randomId();
  }
}

export function queuedResearchEvents(): number {
  return readQueue().length;
}

async function transmit(event: ResearchEvent): Promise<boolean> {
  if (!RESEARCH_URL) return false;
  try {
    const response = await fetch(`${RESEARCH_URL}/v1/research/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}

const isPermitted = (settings: Settings, kind: ResearchEvent['kind']) => kind === 'page_view' ? settings.productAnalytics : settings.researchParticipation;

export async function flushResearchQueue(settings: Settings): Promise<number> {
  const queue = readQueue().filter((event) => isPermitted(settings, event.kind));
  if (!queue.length || !RESEARCH_URL) {
    writeQueue(queue);
    return queue.length;
  }
  const remaining: ResearchEvent[] = [];
  for (const event of queue) if (!(await transmit(event))) remaining.push(event);
  writeQueue(remaining);
  return remaining.length;
}

export async function recordResearchEvent(settings: Settings, kind: ResearchEvent['kind'], payload: Record<string, unknown>): Promise<void> {
  if (!isPermitted(settings, kind)) return;
  const event: ResearchEvent = {
    eventId: randomId(12),
    participantId: researchParticipantId(),
    kind,
    occurredAt: new Date().toISOString(),
    consentVersion: CONSENT_VERSION,
    payload,
  };
  if (!(await transmit(event))) writeQueue([...readQueue(), event]);
}

export async function withdrawResearchParticipation(): Promise<boolean> {
  let deleted = !RESEARCH_URL;
  try {
    const participantId = localStorage.getItem(PARTICIPANT_KEY);
    if (RESEARCH_URL && participantId) {
      const response = await fetch(`${RESEARCH_URL}/v1/research/participants/${participantId}`, { method: 'DELETE' });
      deleted = response.ok;
    }
  } catch {
    deleted = false;
  }
  try {
    localStorage.removeItem(PARTICIPANT_KEY);
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    /* ignore */
  }
  return deleted;
}
