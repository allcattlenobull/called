export function money(n: number): string {
  return `$${(Math.round(n / 1000) * 1000).toLocaleString('en-US')}`;
}

export function moneyK(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
