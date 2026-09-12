# Life Command Center v0.7 — Auth error visibility fix

This build fixes authentication errors being hidden behind Netlify UI.

Changes:
- Supabase sign-up/sign-in errors are now shown directly inside the auth modal.
- The auth modal is layered above app UI.
- Sign-up validates email/password before calling Supabase.
- If email confirmation is required, the modal tells you explicitly.
- Successful auth messages also display in the modal.

Deploy this version to the same Netlify site, hard-refresh, then try Create account again.
