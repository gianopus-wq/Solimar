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
| `/login` | Professionals and the Solimar team | Sign in, or create a professional account |
| `/invite?c=<token>` | Client (no sign-in) | Talent card and the "Add to Team / Request Onboarding" button |
| `/talent` | Professional | Clients by status, setup steps, and the "I Have Joined" confirmation |
| `/talent/profile` | Professional | Video intro, personal info, skills, education, experience |
| `/admin` | Solimar team | Overview, plus `/admin/talent`, `/admin/leads`, `/admin/invoices`, `/admin/contracts` |

## Backend (Supabase)

Data, sign-in, and file storage run on Supabase. The schema is in `supabase/migrations/`, and the public project URL and publishable key are in `.env` (both are safe to ship to the browser).

- **Who sees what** is enforced in the database with row level security. A professional can read and edit only their own profile and engagements; they cannot approve themselves or mark their own skills verified. Admins can read and change everything.
- **Client links** need no sign-in. The token in the link is the credential; the `get_invite` and `request_onboarding` database functions return only that one card.
- **Leads** from the landing form are inserted straight into the `leads` table. Anonymous visitors can add a lead but not read any.
- **Files**: intro videos are in the public `intro-videos` bucket (50 MB limit), signed agreements in the private `agreements` bucket, contract templates in the private `contracts` bucket.

### Making someone an admin

Add their email to `admin_emails` before they create their account at `/login`:

```sql
insert into public.admin_emails values ('person@yourcompany.com');
```

If they already have an account, also run `update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'person@yourcompany.com');`. Admin rights only apply once the email is confirmed.

### Supabase settings to check

- **Authentication → URL Configuration → Site URL**: set to your Vercel domain so the link in the confirmation email returns people to your site.
- **Authentication → Emails → SMTP**: Supabase's built-in sender only allows a few emails per hour. Connect your own SMTP before inviting professionals in bulk.

## Automation (Make.com)

`api/event.js` forwards two events to `MAKE_WEBHOOK_URL` (a Make.com custom webhook):

- `onboarding_requested`: a client clicked "Add to Team". Payload includes company, client contact email, tools, standup time, the default contract template file name, and the professional's name, email, and role.
- `talent_confirmed_setup`: a professional confirmed they joined the client's systems.

Generating the agreement, notifying the client's HR/IT team, starting the checklist, and updating the tracking sheet are scenarios you build in Make.com from those events. Without `MAKE_WEBHOOK_URL`, events are only written to the function logs.

## Lead form

The "Schedule a call" form saves to Supabase, then pings `/api/lead` (`api/lead.js`, a Vercel serverless function) as an optional notification.

- Each lead is saved to the `leads` table and shows up in `/admin/leads`.
- Optionally set `LEAD_WEBHOOK_URL` in the Vercel project to also be notified in Slack, Zapier, Make, or a CRM.

## Structure

- `src/app/`: routes (landing, `invite`, `talent/`, `admin/`)
- `src/data/`: types and the Supabase-backed store
- `src/lib/supabase.ts`: Supabase client
- `supabase/migrations/`: database schema, security policies, storage buckets
- `src/components/dash.tsx`: dashboard shell and UI primitives
- `src/components/LeadForm.tsx`: two-step call request form
- `src/components/ui.tsx`: shared UI primitives
- `src/theme.ts`: colors, fonts, fluid sizing helpers
- `api/lead.js`: lead intake function
- `api/event.js`: automation event forwarder
