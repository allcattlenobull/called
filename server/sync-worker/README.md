# Called journey sync (optional)

This tiny Cloudflare Worker provides encrypted journey restore, seven-day encrypted report links, and an opt-in validation-research endpoint.

**Privacy design:** the browser encrypts the journey with a key derived from the code (PBKDF2, 210,000 iterations, then AES-256-GCM) before sending it. The worker stores only ciphertext under a SHA-256 hash of the code. Nobody running the worker can read anyone’s answers or recover a lost code. Entries expire after two years without an update.

Shared reports use a fresh AES key kept after the `#` in the link, so the worker stores ciphertext and never receives the key. They expire after seven days. Research events are a separate, explicit opt-in: they use a random research ID rather than a journey code and exclude names, journals, free text and complete profiles.

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

6. For authorized research export, create a secret with `npx wrangler secret put RESEARCH_EXPORT_TOKEN`. Send that token only in the `Authorization: Bearer …` header to the export endpoint; never put it in the site build.

The site turns on cross-device restore automatically once `SYNC_URL` is set. Users can turn backups off in *Your data*.

## API

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| `GET` | `/v1/journeys/:id` | | Encrypted journey or 404 |
| `PUT` | `/v1/journeys/:id` | `{"v":1,"iv":"…","ct":"…"}` (max 512 KB) | `{"ok":true}` |
| `DELETE` | `/v1/journeys/:id` | | `{"ok":true}` |
| `GET/PUT/DELETE` | `/v1/shares/:id` | Encrypted payload for PUT | Seven-day encrypted report |
| `POST` | `/v1/research/events` | De-identified consented event | `{"ok":true}` |
| `DELETE` | `/v1/research/participants/:id` | | Deletes that participant’s events |
| `GET` | `/v1/research/export` | Bearer token header | Up to 1,000 research events |

`:id` must be 64 lowercase hex characters.
