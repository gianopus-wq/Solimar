# Solimar

B2B talent pipeline connecting mainland U.S. companies with English-speaking professionals in Puerto Rico.

This repo is an Expo (React Native + React Native Web) app using Expo Router. Today it serves the marketing landing page; future dashboards can be added as new routes in `src/app/` and reuse the same components on web, iOS, and Android.

## Develop

```bash
npm install
npm run web        # dev server
npm run typecheck
npm run build      # static export to dist/
```

## Deploy to Vercel

Import the repo in Vercel. `vercel.json` already sets the build command (`npx expo export -p web`) and output directory (`dist`).

## Lead form

The "Schedule a call" form posts to `/api/lead` (`api/lead.js`, a Vercel serverless function).

- Set `LEAD_WEBHOOK_URL` in the Vercel project to forward each lead as JSON to Slack, Zapier, Make, or a CRM.
- Without it, leads are only written to the Vercel function logs.
- `/api/lead` does not exist under `npm run web`; set `EXPO_PUBLIC_LEAD_ENDPOINT` to point the form elsewhere during local development.

## Structure

- `src/app/index.tsx`: landing page and its copy
- `src/components/LeadForm.tsx`: two-step call request form
- `src/components/ui.tsx`: shared UI primitives
- `src/theme.ts`: colors, fonts, fluid sizing helpers
- `api/lead.js`: lead intake function
