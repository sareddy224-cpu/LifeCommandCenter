# Life Command Center v0.4 — Multi-device cloud sync

This version adds a real cloud-sync layer using Supabase.

## What changes
- Sign in with the same email/password on phone and laptop.
- Tasks, projects, and inbox items sync through the cloud.
- Local storage remains as an offline/local fallback.
- First sign-in to an empty cloud account uploads your existing local data.
- Row Level Security keeps each user's data separated.

## One-time setup
1. Create a free Supabase project.
2. Open Supabase SQL Editor and run `schema.sql`.
3. In Supabase Project Settings -> API, copy:
   - Project URL
   - anon/public key
4. Open `config.js` and paste those two values.
5. Put this folder on any static web host (Vercel, Netlify, GitHub Pages, etc.) or test locally.
6. Open the same hosted URL on your phone and laptop.
7. Create an account / sign in with the same credentials on both devices.

## Important security note
Use the **anon/public key only** in config.js. Never put the service_role key in a browser app.

## Current sync model
Changes are saved locally immediately and pushed to Supabase shortly after. When you sign in, the app loads cloud data. If your cloud account is empty, the current device's local data is uploaded first.

## Included files
- `index.html`
- `styles.css`
- `app.js`
- `cloud.js`
- `config.js`
- `schema.sql`

## Not yet included
- Real-time live updates while two devices are simultaneously open
- Google Calendar
- push notifications
- recurring tasks
- real AI classification

The current version is now structurally ready for those features.
