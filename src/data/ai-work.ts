import type { Career, CareerFamily, SkillId } from '../types';
import { SKILLS } from './vocab';

export const AI_WORK_REVIEWED = 'October 2026';

export interface AiWorkSource {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  url: string;
  finding: string;
}

export const AI_WORK_SOURCES: AiWorkSource[] = [
  { id: 'onet-ai-2026', title: 'Indexing the Impact of AI within the O*NET System', authors: 'Putka, Voss, and Lewis', year: 2026, venue: 'National Center for O*NET Development', url: 'https://www.onetcenter.org/reports/AI_Impact_Review.html', finding: 'Task-only exposure measures can miss contextual and adaptive parts of job performance; O*NET recommends multiple transparent indicators.' },
  { id: 'ilo-2025', title: 'Generative AI and Jobs: A Refined Global Index of Occupational Exposure', authors: 'Gmyrek et al.', year: 2025, venue: 'International Labour Organization Working Paper 140', url: 'https://doi.org/10.54394/HETP0387', finding: 'Exposure varies by task, occupation, and context; transformation is generally more plausible than whole-job replacement.' },
  { id: 'oecd-2024', title: 'Artificial intelligence and the changing demand for skills in the labour market', authors: 'Green', year: 2024, venue: 'OECD Artificial Intelligence Papers', url: 'https://doi.org/10.1787/88684e36-en', finding: 'AI adoption changes task and skill demand, including in occupations whose workers do not need specialized AI credentials.' },
  { id: 'felten-2021', title: 'Occupational, industry, and geographic exposure to artificial intelligence', authors: 'Felten, Raj, and Seamans', year: 2021, venue: 'Strategic Management Journal', url: 'https://doi.org/10.1002/smj.3286', finding: 'AI exposure is associated more strongly with information-processing abilities than with physical work, but exposure is not the same as displacement.' },
  { id: 'noy-2023', title: 'Experimental evidence on the productivity effects of generative artificial intelligence', authors: 'Noy and Zhang', year: 2023, venue: 'Science', url: 'https://doi.org/10.1126/science.adh2586', finding: 'In a bounded professional-writing experiment, AI reduced completion time and increased rated output quality; the result should not be generalized to every job.' },
  { id: 'brynjolfsson-2025', title: 'Generative AI at Work', authors: 'Brynjolfsson, Li, and Raymond', year: 2025, venue: 'Quarterly Journal of Economics', url: 'https://doi.org/10.1093/qje/qjae044', finding: 'A workplace assistant improved customer-support productivity on average, with different effects by worker experience and task rarity.' },
  { id: 'vaccaro-2024', title: 'When combinations of humans and AI are useful: A systematic review and meta-analysis', authors: 'Vaccaro, Almaatouq, and Malone', year: 2024, venue: 'Nature Human Behaviour', url: 'https://doi.org/10.1038/s41562-024-02024-1', finding: 'Human–AI combinations do not automatically outperform the better of either alone, especially on decision tasks.' },
  { id: 'dellacqua-2026', title: 'Navigating the Jagged Technological Frontier', authors: 'Dell’Acqua et al.', year: 2026, venue: 'Organization Science', url: 'https://doi.org/10.1287/orsc.2023.24453', finding: 'AI effects can differ sharply across nearby tasks; workers need judgment about when a tool is inside or outside its capabilities.' },
];

export interface AiWorkGuide {
  signal: 'Hands-on or human-context work' | 'Mixed task change' | 'Digitized tasks changing quickly';
  summary: string;
  likelyAssistance: string[];
  humanResponsibilities: string[];
  durableSkills: string[];
  actions: string[];
  reviewed: string;
}

const FAMILY_ASSISTANCE: Record<CareerFamily, string[]> = {
  healthcare: ['drafting routine documentation', 'summarizing records for human review', 'supporting scheduling and administrative workflows'],
  technology: ['drafting and explaining code', 'searching technical documentation', 'producing first-pass tests and troubleshooting options'],
  business: ['drafting communications and plans', 'summarizing documents and meetings', 'organizing routine analysis'],
  finance: ['classifying and summarizing financial information', 'drafting routine reports', 'flagging patterns for human review'],
  education: ['drafting lesson materials', 'adapting practice content', 'summarizing administrative information'],
  trades: ['estimating and documenting jobs', 'finding manuals and specifications', 'supporting scheduling and customer communication'],
  government: ['summarizing documents', 'drafting routine public communication', 'organizing cases and records for review'],
  creative: ['rapidly producing concepts and variations', 'editing first drafts', 'supporting production and asset organization'],
  humanServices: ['drafting routine notes and resource lists', 'summarizing program information', 'supporting scheduling and follow-up'],
  engineering: ['drafting calculations, code, and documentation', 'comparing design alternatives', 'searching standards for human verification'],
  science: ['summarizing literature', 'drafting code and analysis workflows', 'organizing observations and documentation'],
  entrepreneurship: ['drafting market materials', 'summarizing customer feedback', 'automating routine administrative work'],
  operations: ['forecasting and scheduling support', 'drafting procedures', 'monitoring patterns and exceptions'],
  legal: ['document search and first-pass review', 'drafting routine language', 'summarizing cases for professional verification'],
  publicSafety: ['drafting routine reports', 'organizing incident information', 'supporting training and scenario preparation'],
};

const HUMAN_CONTEXT = /patient|client|student|customer|team|crew|community|teach|lead|negotiate|counsel|assess|diagnos|repair|install|operate|inspect|respond|protect|care|perform|build|test|decide|manage/i;
const DIGITAL_TASK = /document|report|analy|research|record|data|code|design|plan|schedule|forecast|write|draft|calculate|review/i;

function lowerFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1).replace(/[.]$/, '') : value;
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function skillLabels(skills: SkillId[]): string[] {
  return skills.slice(0, 4).map((skill) => SKILLS[skill].label);
}

export function aiWorkFor(career: Career): AiWorkGuide {
  const highlyDigitized = career.physical === 1 && career.remote !== 'none' && career.peopleData <= 0;
  const contextHeavy = career.physical >= 2 || career.peopleData >= 1 || career.skills.some((skill) => ['empathy', 'leadership', 'teaching', 'handsOn'].includes(skill));
  const signal: AiWorkGuide['signal'] = highlyDigitized ? 'Digitized tasks changing quickly' : contextHeavy ? 'Hands-on or human-context work' : 'Mixed task change';
  const digitalResponsibilities = career.responsibilities.filter((task) => DIGITAL_TASK.test(task)).slice(0, 2);
  const humanResponsibilities = career.responsibilities.filter((task) => HUMAN_CONTEXT.test(task)).slice(0, 3);
  const retained = unique([...humanResponsibilities, ...career.responsibilities.slice(-2)]).slice(0, 3).map(lowerFirst);
  const likelyAssistance = unique([
    ...FAMILY_ASSISTANCE[career.family].slice(0, 2),
    ...digitalResponsibilities.slice(0, 1).map((task) => `supporting parts of “${lowerFirst(task)}”`),
  ]).slice(0, 3);
  const skills = skillLabels(career.skills);

  return {
    signal,
    summary: highlyDigitized
      ? `${career.title} includes substantial information-processing work, so individual tasks may change quickly. That is an exposure signal—not a forecast that the occupation will disappear.`
      : contextHeavy
        ? `${career.title} combines work that software may assist with and responsibilities that depend on physical execution, trust, judgment, or live human context. Expect tools and workflows to change more readily than the whole role.`
        : `${career.title} contains a mix of tasks. Some routine information work may be assisted or automated, while responsibility for context, verification, and outcomes remains with people.`,
    likelyAssistance,
    humanResponsibilities: retained.map((task) => `Owning the context and outcome when ${task}`),
    durableSkills: unique([...skills, ...(career.peopleData >= 1 ? ['Trust and relationship judgment'] : []), ...(career.physical >= 2 ? ['Safe physical execution'] : []), 'Checking AI output against real evidence']).slice(0, 5),
    actions: [
      `Ask a working ${career.title.toLowerCase()} which tools changed their job in the past year.`,
      `Practice one core ${career.skills[0] ? SKILLS[career.skills[0]].label.toLowerCase() : 'domain'} skill without AI, then use AI and compare accuracy.`,
      'Learn the privacy, safety, bias, and verification rules for tools used in this field.',
    ],
    reviewed: AI_WORK_REVIEWED,
  };
}
