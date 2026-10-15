import { aiWorkFor } from '../data/ai-work';
import { SKILLS } from '../data/vocab';
import type { Career } from '../types';

export function practiceQuestions(career: Career): string[] {
  const ai = aiWorkFor(career);
  return [
    `What does a normal week as a ${career.title.toLowerCase()} actually look like?`,
    `Which part of the work surprises people after they enter the field?`,
    `Which ${career.skills.slice(0, 2).map((skill) => SKILLS[skill].label.toLowerCase()).join(' and ')} skills matter most when the work gets difficult?`,
    `What is one common frustration or reason people leave this work?`,
    `How are AI and other new tools changing ${ai.likelyAssistance[0]}?`,
    'What evidence could I gather in the next month to learn whether this work fits me?',
  ];
}

export function aiRolePlayPrompt(career: Career): string {
  const ai = aiWorkFor(career);
  return `Run a synthetic informational-interview practice with me about becoming a ${career.title}.

Important boundaries:
- You are a practice simulator, not a real professional. Never claim personal experiences or invent an employer.
- Ask one question at a time and wait for my answer.
- Push back on romanticized assumptions and include realistic frustrations: ${career.frustrations.join('; ')}.
- Cover day-to-day work, training, schedule, emotional or physical demands, and how AI may assist with ${ai.likelyAssistance.join('; ')}.
- Ask me what evidence I have, not just what sounds appealing.
- After 6–8 turns, summarize what I learned, what remains uncertain, and one real professional I should talk to next.
- Do not make a career decision for me and do not produce or change a Called score.`;
}
