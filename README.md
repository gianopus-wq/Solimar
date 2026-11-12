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

## Screens

| Route | Who | What |
| --- | --- | --- |
| `/` | Prospects | Landing page with the "Schedule a call" form |
| `/invite?c=<token>` | Client (no sign-in) | Talent card and the "Add to Team / Request Onboarding" button |
| `/talent` | Professional | Clients by status, setup steps, and the "I Have Joined" confirmation |
| `/talent/profile` | Professional | Video intro, personal info, skills, education, experience |
| `/admin` | Solimar team | Overview, plus `/admin/talent`, `/admin/leads`, `/admin/invoices`, `/admin/contracts` |

Sample client links: `/invite?c=demo-northwind` (not yet accepted) and `/invite?c=demo-acme`.

## Data and sign-in (prototype)

All dashboard data lives in the browser's `localStorage` through `src/data/store.tsx`, seeded from `src/data/seed.ts`. That means:

- There is no sign-in. `/talent` and `/admin` are open to anyone with the URL.
- Data is not shared between browsers or devices. A client link created in the admin panel only works in the browser that created it.
- Uploaded videos and files are not stored; only their file names are kept.

`src/data/store.tsx` is the single place to replace with a real database, file storage, and authentication.

## Automation (Make.com)

`api/event.js` forwards two events to `MAKE_WEBHOOK_URL` (a Make.com custom webhook):

- `onboarding_requested`: a client clicked "Add to Team". Payload includes company, client contact email, tools, standup time, the default contract template file name, and the professional's name, email, and role.
- `talent_confirmed_setup`: a professional confirmed they joined the client's systems.

Generating the agreement, notifying the client's HR/IT team, starting the checklist, and updating the tracking sheet are scenarios you build in Make.com from those events. Without `MAKE_WEBHOOK_URL`, events are only written to the function logs.

## Lead form

The "Schedule a call" form posts to `/api/lead` (`api/lead.js`, a Vercel serverless function).

- Set `LEAD_WEBHOOK_URL` in the Vercel project to forward each lead as JSON to Slack, Zapier, Make, or a CRM.
- Without it, leads are only written to the Vercel function logs.
- `/api/lead` does not exist under `npm run web`; set `EXPO_PUBLIC_LEAD_ENDPOINT` to point the form elsewhere during local development.

## Structure

- `src/app/`: routes (landing, `invite`, `talent/`, `admin/`)
- `src/data/`: types, sample data, and the store
- `src/components/dash.tsx`: dashboard shell and UI primitives
- `src/components/LeadForm.tsx`: two-step call request form
- `src/components/ui.tsx`: shared UI primitives
- `src/theme.ts`: colors, fonts, fluid sizing helpers
- `api/lead.js`: lead intake function
- `api/event.js`: automation event forwarder
