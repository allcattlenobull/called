import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="wrap" style={{ paddingTop: 'var(--s-7)' }}>
      <EmptyState
        icon="discover"
        as="h1"
        title="This page doesn’t exist"
        action={
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link to="/" className="btn btn--primary">
              Go home
            </Link>
            <Link to="/careers" className="btn btn--secondary">
              Explore careers
            </Link>
          </div>
        }
      >
        The link may be old, or the address may have a typo.
      </EmptyState>
    </div>
  );
}
