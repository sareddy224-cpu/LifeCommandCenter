# Life Command Center v0.5 — Multi-device sync fix

This build fixes the v0.4 sync problems.

## Fixes
- Sign-in/cloud control is now visible on phones.
- The app checks Supabase for new changes every 4 seconds while open.
- Returning to the tab/app triggers a cloud refresh.
- Cloud deletions for tasks/projects/inbox are sent explicitly.
- Removed the old "delete anything missing from this device" sync behavior, which was unsafe for multiple devices.
- Fixed task/project ID handling after cloud data is loaded.
- A floating cloud button shows sync state and can be tapped to manually refresh.

## Test
1. Deploy these files to the same Netlify site.
2. On laptop, sign in to Life Command Center with your Supabase account.
3. On phone, open the same Netlify URL and sign in with the EXACT same Life Command Center email/password.
4. Add a task on laptop.
5. Within about 4 seconds it should appear on phone, or tap the cloud button.
6. Add a task on phone and verify it appears on laptop.

The Netlify site itself should remain public. Supabase authentication protects the personal app data.
