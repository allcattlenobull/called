import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { readSharedReport } from '../lib/sharedReport';
import { Callout, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function SharedReport() {
  useDocumentTitle('Shared exploration report');
  const { id = '' } = useParams();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const key = window.location.hash.slice(1);
    readSharedReport(id, key).then(setText).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'This private report could not be opened.'));
  }, [id]);

  return (
    <div className="wrap wrap--narrow">
      <PageHeader title="Shared exploration report" lead="A private, read-only snapshot created in Called." />
      {error ? <Callout tone="warn">{error}</Callout> : text ? <article className="report report--shared"><pre>{text}</pre></article> : <p role="status">Opening the encrypted report…</p>}
      <Callout title="Private by design">The report is decrypted in this browser. The key is in the link after # and is not sent to the storage service. Links expire after seven days.</Callout>
      <p><Link to="/about">Learn how Called works</Link></p>
    </div>
  );
}
