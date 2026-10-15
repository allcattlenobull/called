# Called journey sync (optional)

This tiny Cloudflare Worker lets someone type their journey code on any device and get their Called journey back.

**Privacy design:** the browser encrypts the journey with a key derived from the code (PBKDF2, 210,000 iterations, then AES-256-GCM) before sending it. The worker stores only ciphertext under a SHA-256 hash of the code. Nobody running the worker can read anyone’s answers or recover a lost code. Entries expire after two years without an update.

Without this worker deployed, journey codes still work on the same device, and *Export my journey* still moves data between devices.

## Deploy (about 10 minutes, free tier is plenty)

1. Create a free Cloudflare account at <https://dash.cloudflare.com/sign-up>.
2. From this folder:

   ```bash
   npx wrangler login
   npx wrangler kv namespace create JOURNEYS
   ```

   Copy the `id` it prints into `wrangler.toml` in place of `REPLACE_WITH_KV_NAMESPACE_ID`.
3. If your site lives somewhere other than `https://allcattlenobull.github.io`, update `ALLOWED_ORIGINS` (comma-separated; include a custom domain if you add one).
4. Deploy:

   ```bash
   npx wrangler deploy
   ```

   Wrangler prints a URL like `https://called-sync.<your-subdomain>.workers.dev`.
5. In GitHub, add a repository variable (**Settings → Secrets and variables → Actions → Variables**) named `SYNC_URL` with that URL, then re-run the *Deploy to GitHub Pages* workflow.

The site turns on cross-device restore automatically once `SYNC_URL` is set. Users can turn backups off in *Your data*.

## API

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| `GET` | `/v1/journeys/:id` | | Encrypted journey or 404 |
| `PUT` | `/v1/journeys/:id` | `{"v":1,"iv":"…","ct":"…"}` (max 512 KB) | `{"ok":true}` |
| `DELETE` | `/v1/journeys/:id` | | `{"ok":true}` |

`:id` must be 64 lowercase hex characters.
