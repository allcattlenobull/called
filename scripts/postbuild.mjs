// GitHub Pages has no SPA fallback. Copying index.html to 404.html lets deep links
// like /called/careers/electrician load the app, which then routes client-side.
import { copyFileSync, writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

copyFileSync('dist/index.html', 'dist/404.html');
// Disable Jekyll processing so files and folders beginning with "_" are served.
writeFileSync('dist/.nojekyll', '');
if (process.env.CUSTOM_DOMAIN && !existsSync('dist/CNAME')) {
  writeFileSync('dist/CNAME', `${process.env.CUSTOM_DOMAIN}\n`);
}

const basePath = (process.env.BASE_PATH ?? '/called/').replace(/^\/+|\/+$/g, '');
const siteOrigin = (process.env.SITE_URL ?? (process.env.CUSTOM_DOMAIN ? `https://${process.env.CUSTOM_DOMAIN}` : 'https://allcattlenobull.github.io')).replace(/\/$/, '');
const siteBase = `${siteOrigin}/${basePath}`.replace(/\/$/, '');
const routes = new Set(['', 'discover', 'discover/validated-aptitude', 'purpose', 'careers', 'try', 'try/experiments', 'compare', 'compare/education', 'places', 'network', 'achievements', 'path', 'account', 'account/ai-export', 'about', 'research', 'feedback', 'counselor', 'terms']);

for (const file of readdirSync('src/data/careers').filter((name) => name.endsWith('.ts') && name !== 'index.ts')) {
  const source = readFileSync(join('src/data/careers', file), 'utf8');
  for (const match of source.matchAll(/^\s{4}id:\s*'([^']+)'/gm)) {
    routes.add(`careers/${match[1]}`);
    routes.add(`careers/${match[1]}/interview`);
  }
}
const evidenceSource = readFileSync('src/data/simulations/evidence.ts', 'utf8').split('export const SIMULATION_EVIDENCE')[1]?.split('\n};')[0] ?? '';
for (const match of evidenceSource.matchAll(/^  (?:'([^']+)'|([a-z][\w-]*)):/gm)) routes.add(`try/${match[1] ?? match[2]}`);

const indexHtml = readFileSync('dist/index.html', 'utf8');
for (const route of routes) {
  if (!route) continue;
  const directory = join('dist', route);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'index.html'), indexHtml);
}
const urls = [...routes].sort().map((route) => `  <url><loc>${siteBase}${route ? `/${route}` : ''}</loc></url>`).join('\n');
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteBase}/sitemap.xml\n`);
console.log(`postbuild: wrote route shells, sitemap (${routes.size} URLs), robots, 404, and .nojekyll`);
