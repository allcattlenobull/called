import type { ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ASSESSMENTS } from '../../data/assessments';
import type { AssessmentId } from '../../types';
import { PageHeader } from '../../components/ui';
import NotFound from '../NotFound';
import { InterestsAssessment } from './InterestsAssessment';
import { SkillsAssessment } from './SkillsAssessment';
import { AptitudesAssessment } from './AptitudesAssessment';
import { WorkStyleAssessment } from './WorkStyleAssessment';
import { ValuesAssessment } from './ValuesAssessment';
import { LifestyleAssessment } from './LifestyleAssessment';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

const VIEWS: Record<AssessmentId, ComponentType> = {
  interests: InterestsAssessment,
  skills: SkillsAssessment,
  aptitudes: AptitudesAssessment,
  workStyle: WorkStyleAssessment,
  values: ValuesAssessment,
  lifestyle: LifestyleAssessment,
};

export default function Assessment() {
  const { id } = useParams();
  const meta = ASSESSMENTS.find((a) => a.id === id);
  useDocumentTitle(meta?.title);
  if (!meta) return <NotFound />;
  const View = VIEWS[meta.id];
  return (
    <div className="wrap">
      <PageHeader title={meta.question} lead={meta.blurb} back={{ to: '/discover', label: 'Discover' }} />
      <View />
    </div>
  );
}

export function NextAssessment({ current }: { current: AssessmentId }) {
  const idx = ASSESSMENTS.findIndex((a) => a.id === current);
  const next = ASSESSMENTS[idx + 1];
  return (
    <div className="row" style={{ marginTop: 'var(--s-5)' }}>
      {next ? (
        <Link to={`/discover/${next.id}`} className="btn btn--primary">
          Next: {next.title}
        </Link>
      ) : (
        <Link to="/careers?sort=match" className="btn btn--primary">
          See matching careers
        </Link>
      )}
      <Link to="/purpose" className="btn btn--secondary">
        View my compass
      </Link>
    </div>
  );
}
