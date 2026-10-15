import { useEffect } from 'react';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Called` : 'Called: discover what you’ve been given';
  }, [title]);
}
