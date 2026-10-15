// Line icons on a 24px grid, 2px stroke, round caps: drawn to match the logo's ring.
import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'discover'
  | 'purpose'
  | 'careers'
  | 'try'
  | 'compare'
  | 'path'
  | 'about'
  | 'menu'
  | 'close'
  | 'check'
  | 'plus'
  | 'minus'
  | 'arrowRight'
  | 'arrowLeft'
  | 'bookmark'
  | 'bookmarkFilled'
  | 'search'
  | 'filter'
  | 'alert'
  | 'info'
  | 'lock'
  | 'download'
  | 'upload'
  | 'trash'
  | 'edit'
  | 'clock'
  | 'spark'
  | 'journal'
  | 'flask'
  | 'print'
  | 'up'
  | 'down'
  | 'external'
  | 'mail'
  | 'copy'
  | 'user';

const paths: Record<IconName, ReactElement> = {
  home: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  discover: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  purpose: (
    <>
      <path d="M16.6 7.4A6.5 6.5 0 1 0 16.6 16.6" />
      <circle cx="19.5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  careers: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </>
  ),
  try: <path d="M8 5.5v13l10-6.5z" />,
  compare: (
    <>
      <path d="M7 4v16M17 4v16" />
      <path d="M4 9h6M14 14h6" />
    </>
  ),
  path: (
    <>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h5a3 3 0 0 0 0-6h-2a3 3 0 0 1 0-6h5" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
  arrowLeft: <path d="M19 12H5m5-5-5 5 5 5" />,
  bookmark: <path d="M7 4h10v16l-5-3.5L7 20z" />,
  bookmarkFilled: <path d="M7 4h10v16l-5-3.5L7 20z" fill="currentColor" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  alert: (
    <>
      <path d="M12 4 21 19H3z" />
      <path d="M12 10v4M12 16.5h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  download: <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19h14" />,
  upload: <path d="M12 15V4m-4.5 4.5L12 4l4.5 4.5M5 19h14" />,
  trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />,
  edit: <path d="M5 19h3.5L19 8.5 15.5 5 5 15.5zM13.5 7l3.5 3.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  spark: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />,
  journal: (
    <>
      <path d="M6 4h11a1 1 0 0 1 1 1v15H7a1 1 0 0 1-1-1z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  flask: <path d="M9 4h6M10 4v5l-5 9a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 18l-5-9V4M7.5 14h9" />,
  print: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7" rx="1.5" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  external: <path d="M14 5h5v5M19 5l-8 8M17 14v5H5V7h5" />,
  mail: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  copy: <path d="M9 8h10v12H9zM5 16H4V4h10v1" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
};

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
