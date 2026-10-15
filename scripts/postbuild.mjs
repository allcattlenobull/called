// GitHub Pages has no SPA fallback. Copying index.html to 404.html lets deep links
// like /called/careers/electrician load the app, which then routes client-side.
import { copyFileSync, writeFileSync, existsSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');
// Disable Jekyll processing so files and folders beginning with "_" are served.
writeFileSync('dist/.nojekyll', '');
if (process.env.CUSTOM_DOMAIN && !existsSync('dist/CNAME')) {
  writeFileSync('dist/CNAME', `${process.env.CUSTOM_DOMAIN}\n`);
}
console.log('postbuild: wrote 404.html and .nojekyll');
