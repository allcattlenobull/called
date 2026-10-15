import { useParams } from 'react-router-dom';
import { PURPOSE_SECTIONS, type PurposeSectionId } from '../../data/purpose/prompts';
import { PageHeader } from '../../components/ui';
import NotFound from '../NotFound';
import { GiftsSection, ProblemsSection, ServeSection } from './ChooseSections';
import { ExperiencesSection } from './ExperiencesSection';
import { FeedbackSection } from './FeedbackSection';
import { PrinciplesSection } from './PrinciplesSection';
import { JournalSection } from './JournalSection';
import { StatementSection } from './StatementSection';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import type { ComponentType } from 'react';

const VIEWS: Record<PurposeSectionId, ComponentType> = {
  gifts: GiftsSection,
  care: ProblemsSection,
  serve: ServeSection,
  experiences: ExperiencesSection,
  feedback: FeedbackSection,
  principles: PrinciplesSection,
  journal: JournalSection,
  statement: StatementSection,
};

export default function PurposeSection() {
  const { section } = useParams();
  const meta = PURPOSE_SECTIONS.find((s) => s.id === section);
  useDocumentTitle(meta?.title);
  if (!meta) return <NotFound />;
  const View = VIEWS[meta.id];
  return (
    <div className="wrap">
      <PageHeader title={meta.title} lead={meta.question} back={{ to: '/purpose', label: 'Purpose Compass' }} />
      <View />
    </div>
  );
}
