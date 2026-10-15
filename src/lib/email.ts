export function openEmailDraft(subject: string, body: string): void {
  const safeBody = body.length > 10_000 ? `${body.slice(0, 9_700)}\n\n[The report was shortened for email. Download the full report from Called.]` : body;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(safeBody)}`;
}

export async function shareFile(file: File, title: string, text: string): Promise<'shared' | 'downloaded'> {
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title, text });
    return 'shared';
  }
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
