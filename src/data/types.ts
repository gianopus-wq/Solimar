export const ROLES = [
  'Executive Assistant / Chief of Staff',
  'Digital Operations & Project Coordinator',
  'Client Onboarding & Implementation Specialist',
] as const;

export type TalentStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type Skill = { name: string; verified: boolean };
export type Education = { id: string; school: string; degree: string; year: string };
export type Experience = { id: string; company: string; title: string; period: string; summary: string };

export type Talent = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  headline: string;
  bio: string;
  qualities: string[];
  skills: Skill[];
  education: Education[];
  experience: Experience[];
  videoName: string;
  /** Path in the intro-videos storage bucket. */
  videoPath: string;
  status: TalentStatus;
};

export type EngagementStatus = 'invited' | 'pending_setup' | 'active';
export type StepKind = 'connect' | 'agreement' | 'standup';
export type Step = { id: string; kind: StepKind; label: string; done: boolean; fileName?: string; filePath?: string };

export type Engagement = {
  id: string;
  /** Secret in the client's link. */
  token: string;
  talentId: string;
  company: string;
  contactEmail: string;
  tools: string[];
  standup: string;
  status: EngagementStatus;
  steps: Step[];
  createdAt: string;
  requestedAt?: string;
  confirmedAt?: string;
};

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed';
export type Lead = { id: string; name: string; email: string; notes: string; receivedAt: string; status: LeadStatus };

export type InvoiceStatus = 'draft' | 'sent' | 'paid';
export type Invoice = {
  id: string;
  number: string;
  company: string;
  talentId: string;
  period: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
};

export type ContractTemplate = {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  size: number;
  uploadedAt: string;
  isDefault: boolean;
};

export type Role = 'talent' | 'admin';

/** Public view of a client link, returned by the get_invite database function. */
export type Invite = {
  engagement: {
    id: string;
    company: string;
    contactEmail: string;
    tools: string[];
    standup: string;
    status: EngagementStatus;
  };
  talent: Pick<
    Talent,
    | 'name'
    | 'role'
    | 'location'
    | 'headline'
    | 'bio'
    | 'qualities'
    | 'skills'
    | 'education'
    | 'experience'
    | 'videoPath'
    | 'videoName'
  >;
};
