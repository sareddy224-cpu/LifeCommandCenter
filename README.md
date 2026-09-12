# Life Command Center v0.6 — Laptop login fix

Fixes the desktop Sign in button doing nothing.

Changes:
- Auth modal can be opened through a direct fallback, even if later app rendering has a problem.
- Added a visible desktop cloud/sign-in button in the Today header.
- Raised desktop account controls above sidebar layers.
- Made modal helpers safer.
- Account UI updates consistently across sidebar, header, and mobile cloud button.
- Added an auth diagnostic message if the Supabase browser connection fails to initialize.

Deploy this version to the SAME Netlify site and hard-refresh the laptop page.
