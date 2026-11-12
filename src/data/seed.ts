import { listWords } from '../lib/events';
import { Engagement, State, Step } from './types';

export function buildSteps(tools: string[], standup: string): Step[] {
  const steps: Step[] = [
    {
      id: 'connect',
      kind: 'connect',
      label: tools.length
        ? `This client uses ${listWords(tools)}. Sign in to each one with your company email.`
        : 'Sign in to the client’s tools with your company email.',
      done: false,
    },
    {
      id: 'agreement',
      kind: 'agreement',
      label: 'Upload your signed contractor agreement for tax compliance.',
      done: false,
    },
  ];
  if (standup) {
    steps.push({ id: 'standup', kind: 'standup', label: `Join the client’s daily standup at ${standup}.`, done: false });
  }
  return steps;
}

const done = (e: Engagement): Engagement => ({ ...e, steps: e.steps.map((s) => ({ ...s, done: true })) });

/** Sample data so every screen has something to show. Replace with a real backend. */
export const seed: State = {
  currentTalentId: 't-camila',
  talents: [
    {
      id: 't-camila',
      name: 'Camila Ortiz',
      email: 'camila@example.com',
      phone: '(787) 555-0142',
      location: 'San Juan, Puerto Rico',
      role: 'Executive Assistant / Chief of Staff',
      headline: 'Executive assistant who keeps founders two steps ahead',
      bio: 'I have supported C-level leaders for seven years. I run calendars, inboxes, and board prep so my executives can focus on the work only they can do.',
      qualities: ['Calm under pressure', 'Clear writer', 'Discreet', 'Fast learner'],
      skills: [
        { name: 'Calendar & inbox management', verified: true },
        { name: 'Board meeting prep', verified: true },
        { name: 'Notion', verified: true },
        { name: 'Google Workspace', verified: true },
        { name: 'Travel planning', verified: true },
      ],
      education: [{ id: 'e1', school: 'University of Puerto Rico, Río Piedras', degree: 'BBA, Management', year: '2017' }],
      experience: [
        {
          id: 'x1',
          company: 'Regional healthcare group',
          title: 'Executive Assistant to the CEO',
          period: '2020 – 2025',
          summary: 'Supported the CEO and a five-person leadership team across two time zones.',
        },
        {
          id: 'x2',
          company: 'Boutique law firm',
          title: 'Office Coordinator',
          period: '2017 – 2020',
          summary: 'Ran scheduling, vendor contracts, and client intake in English and Spanish.',
        },
      ],
      videoName: '',
      status: 'approved',
    },
    {
      id: 't-diego',
      name: 'Diego Santiago',
      email: 'diego@example.com',
      phone: '(787) 555-0177',
      location: 'Ponce, Puerto Rico',
      role: 'Digital Operations & Project Coordinator',
      headline: 'Project coordinator who lives in Jira and Asana',
      bio: 'I keep projects on track: clear owners, clear dates, no surprises. I have coordinated software and marketing teams for five years.',
      qualities: ['Organized', 'Proactive', 'Good with deadlines'],
      skills: [
        { name: 'Jira', verified: true },
        { name: 'Asana', verified: true },
        { name: 'Notion', verified: true },
        { name: 'Status reporting', verified: true },
      ],
      education: [{ id: 'e1', school: 'Pontifical Catholic University of Puerto Rico', degree: 'BS, Information Systems', year: '2019' }],
      experience: [
        {
          id: 'x1',
          company: 'E-commerce agency',
          title: 'Project Coordinator',
          period: '2021 – 2025',
          summary: 'Coordinated eight client projects at a time across design, engineering, and QA.',
        },
      ],
      videoName: '',
      status: 'approved',
    },
    {
      id: 't-valeria',
      name: 'Valeria Colón',
      email: 'valeria@example.com',
      phone: '(787) 555-0119',
      location: 'Mayagüez, Puerto Rico',
      role: 'Client Onboarding & Implementation Specialist',
      headline: 'Onboarding specialist who turns new customers into fans',
      bio: 'I guide new customers from kickoff to launch. I train teams in English and Spanish and make sure nothing falls through the cracks.',
      qualities: ['Patient teacher', 'Empathetic', 'Detail-oriented'],
      skills: [
        { name: 'Customer training', verified: false },
        { name: 'Zendesk', verified: false },
        { name: 'HubSpot', verified: false },
      ],
      education: [{ id: 'e1', school: 'University of Puerto Rico, Mayagüez', degree: 'BA, Communications', year: '2020' }],
      experience: [
        {
          id: 'x1',
          company: 'SaaS startup',
          title: 'Customer Success Associate',
          period: '2021 – 2025',
          summary: 'Onboarded more than 100 small-business accounts.',
        },
      ],
      videoName: '',
      status: 'pending',
    },
  ],
  engagements: [
    {
      id: 'g-acme',
      token: 'demo-acme',
      talentId: 't-camila',
      company: 'Acme Corp',
      contactEmail: 'hr@acme.example',
      tools: ['Slack', 'Notion'],
      standup: '9:30 AM EST',
      status: 'pending_setup',
      steps: buildSteps(['Slack', 'Notion'], '9:30 AM EST'),
      createdAt: '2026-11-02T15:00:00Z',
      requestedAt: '2026-11-05T15:00:00Z',
    },
    done({
      id: 'g-stellar',
      token: 'demo-stellar',
      talentId: 't-camila',
      company: 'Stellar SaaS',
      contactEmail: 'people@stellar.example',
      tools: ['Slack', 'Jira', 'Google Workspace'],
      standup: '10:00 AM EST',
      status: 'active',
      steps: buildSteps(['Slack', 'Jira', 'Google Workspace'], '10:00 AM EST'),
      createdAt: '2026-09-10T15:00:00Z',
      requestedAt: '2026-09-12T15:00:00Z',
      confirmedAt: '2026-09-15T15:00:00Z',
    }),
    {
      id: 'g-northwind',
      token: 'demo-northwind',
      talentId: 't-diego',
      company: 'Northwind Logistics',
      contactEmail: 'ops@northwind.example',
      tools: ['Slack', 'Asana'],
      standup: '9:00 AM EST',
      status: 'invited',
      steps: buildSteps(['Slack', 'Asana'], '9:00 AM EST'),
      createdAt: '2026-11-09T15:00:00Z',
    },
  ],
  leads: [
    {
      id: 'l1',
      name: 'Jordan Blake',
      email: 'jordan@brightpath.example',
      notes: 'Need an executive assistant for our CEO. Start in January.',
      receivedAt: '2026-11-10T14:20:00Z',
      status: 'new',
    },
    {
      id: 'l2',
      name: 'Priya Nair',
      email: 'priya@fieldstack.example',
      notes: 'Looking for a project coordinator who knows Jira. Team of 30.',
      receivedAt: '2026-11-07T18:05:00Z',
      status: 'contacted',
    },
    {
      id: 'l3',
      name: 'Marcus Lee',
      email: 'marcus@harborhq.example',
      notes: '',
      receivedAt: '2026-11-03T16:40:00Z',
      status: 'qualified',
    },
  ],
  invoices: [
    {
      id: 'i1',
      number: 'INV-0001',
      company: 'Stellar SaaS',
      talentId: 't-camila',
      period: 'October 2026',
      amount: 4200,
      status: 'paid',
      issuedAt: '2026-11-01T12:00:00Z',
    },
    {
      id: 'i2',
      number: 'INV-0002',
      company: 'Stellar SaaS',
      talentId: 't-camila',
      period: 'November 2026',
      amount: 4200,
      status: 'draft',
      issuedAt: '2026-11-11T12:00:00Z',
    },
  ],
  templates: [
    {
      id: 'c1',
      name: 'Standard Contractor Agreement',
      fileName: 'contractor-agreement-v1.docx',
      size: 48213,
      uploadedAt: '2026-10-20T12:00:00Z',
      isDefault: true,
    },
  ],
};
