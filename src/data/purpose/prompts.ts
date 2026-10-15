export interface JournalPrompt {
  id: string;
  text: string;
  faith?: boolean;
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  { id: 'notice', text: 'What gifts do people consistently notice in you?' },
  { id: 'useful', text: 'When do you feel most useful?' },
  { id: 'ignore', text: 'What problem is difficult for you to ignore?' },
  { id: 'energy', text: 'What kind of work gives you energy?' },
  { id: 'drain', text: 'What work drains you?' },
  { id: 'excellent', text: 'What are you willing to become excellent at?' },
  { id: 'serving', text: 'Who do you feel responsible for serving?' },
  { id: 'opportunities', text: 'What opportunities keep appearing?' },
  { id: 'learned', text: 'What have you recently learned about yourself?' },
  { id: 'entrusted', text: 'What have you been entrusted with that you haven’t used yet?', faith: true },
  { id: 'counsel', text: 'Who are the wise voices in your life, and what are they saying?', faith: true },
  { id: 'prayer', text: 'What have you been praying about for your future? What do you notice when you do?', faith: true },
  { id: 'heartily', text: 'Where could you work more wholeheartedly this week, even on something ordinary?', faith: true },
];

export const PURPOSE_SECTIONS = [
  { id: 'gifts', title: 'My gifts', question: 'What abilities or strengths appear repeatedly?' },
  { id: 'care', title: 'What I care about', question: 'What problems in the world do you care about?' },
  { id: 'serve', title: 'Who I want to help', question: 'Who or what do you feel drawn toward helping?' },
  { id: 'experiences', title: 'My experiences', question: 'What activities have you actually enjoyed doing?' },
  { id: 'feedback', title: 'What others see in me', question: 'What do other people consistently recognize in you?' },
  { id: 'principles', title: 'Biblical principles', question: 'How does faith shape the way you choose?' },
  { id: 'journal', title: 'Purpose journal', question: 'Private reflections, kept on this device.' },
  { id: 'statement', title: 'Purpose statement', question: 'Where your gifts and the world’s needs might meet.' },
] as const;

export type PurposeSectionId = (typeof PURPOSE_SECTIONS)[number]['id'];
