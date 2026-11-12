import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { buildSteps, seed } from './seed';
import {
  ContractTemplate,
  Engagement,
  Invoice,
  InvoiceStatus,
  Lead,
  LeadStatus,
  State,
  Talent,
  TalentStatus,
} from './types';

/**
 * App data, kept in this browser's localStorage.
 *
 * This is a stand-in for a real backend: there is no sign-in and nothing is
 * shared between devices. Every read and write goes through this file, so it is
 * the one place to swap in a database and authentication.
 */

const KEY = 'solimar:v1';

export const uid = () => Math.random().toString(36).slice(2, 10);

function newToken(): string {
  const bytes = new Uint8Array(12);
  globalThis.crypto?.getRandomValues?.(bytes);
  return Array.from(bytes, (b) => (b || Math.floor(Math.random() * 256)).toString(16).padStart(2, '0')).join('');
}

type Actions = {
  setCurrentTalent: (id: string) => void;
  addTalent: () => string;
  updateTalent: (id: string, patch: Partial<Talent>) => void;
  setTalentStatus: (id: string, status: TalentStatus) => void;
  setVideo: (talentId: string, name: string, url: string) => void;
  addEngagement: (input: { talentId: string; company: string; contactEmail: string; tools: string[]; standup: string }) => Engagement;
  requestOnboarding: (token: string) => void;
  setStep: (engagementId: string, stepId: string, done: boolean, fileName?: string) => void;
  confirmEngagement: (engagementId: string) => void;
  addLead: (input: { name: string; email: string; notes: string }) => void;
  setLeadStatus: (id: string, status: LeadStatus) => void;
  addInvoice: (input: { company: string; talentId: string; period: string; amount: number }) => void;
  setInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  addTemplate: (input: { name: string; fileName: string; size: number }) => void;
  setDefaultTemplate: (id: string) => void;
  removeTemplate: (id: string) => void;
  reset: () => void;
};

type Store = State &
  Actions & {
    /** False until saved data has been read; avoids flashing sample data. */
    ready: boolean;
    /** Uploaded videos for this session only (object URLs cannot be saved). */
    videoUrls: Record<string, string>;
  };

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seed);
  const [ready, setReady] = useState(false);
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = globalThis.localStorage?.getItem(KEY);
      if (raw) setState({ ...seed, ...JSON.parse(raw) });
    } catch {
      // Unreadable or blocked storage: keep the sample data.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      globalThis.localStorage?.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the session still works in memory.
    }
  }, [state, ready]);

  const actions = useMemo<Actions>(() => {
    const now = () => new Date().toISOString();
    const mapEngagement = (id: string, fn: (e: Engagement) => Engagement) =>
      setState((s) => ({ ...s, engagements: s.engagements.map((e) => (e.id === id ? fn(e) : e)) }));

    return {
      setCurrentTalent: (id) => setState((s) => ({ ...s, currentTalentId: id })),

      addTalent: () => {
        const talent: Talent = {
          id: `t-${uid()}`,
          name: '',
          email: '',
          phone: '',
          location: '',
          role: '',
          headline: '',
          bio: '',
          qualities: [],
          skills: [],
          education: [],
          experience: [],
          videoName: '',
          status: 'draft',
        };
        setState((s) => ({ ...s, talents: [...s.talents, talent], currentTalentId: talent.id }));
        return talent.id;
      },

      updateTalent: (id, patch) =>
        setState((s) => ({ ...s, talents: s.talents.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

      // Approving a professional also marks the skills on their profile as verified.
      setTalentStatus: (id, status) =>
        setState((s) => ({
          ...s,
          talents: s.talents.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  skills: status === 'approved' ? t.skills.map((k) => ({ ...k, verified: true })) : t.skills,
                }
              : t,
          ),
        })),

      setVideo: (talentId, name, url) => {
        setVideoUrls((v) => ({ ...v, [talentId]: url }));
        setState((s) => ({
          ...s,
          talents: s.talents.map((t) => (t.id === talentId ? { ...t, videoName: name } : t)),
        }));
      },

      addEngagement: (input) => {
        const engagement: Engagement = {
          id: `g-${uid()}`,
          token: newToken(),
          status: 'invited',
          steps: buildSteps(input.tools, input.standup),
          createdAt: now(),
          ...input,
        };
        setState((s) => ({ ...s, engagements: [engagement, ...s.engagements] }));
        return engagement;
      },

      requestOnboarding: (token) =>
        setState((s) => ({
          ...s,
          engagements: s.engagements.map((e) =>
            e.token === token && e.status === 'invited' ? { ...e, status: 'pending_setup', requestedAt: now() } : e,
          ),
        })),

      setStep: (engagementId, stepId, done, fileName) =>
        mapEngagement(engagementId, (e) => ({
          ...e,
          steps: e.steps.map((st) => (st.id === stepId ? { ...st, done, fileName: fileName ?? st.fileName } : st)),
        })),

      confirmEngagement: (engagementId) =>
        mapEngagement(engagementId, (e) => ({
          ...e,
          status: 'active',
          confirmedAt: now(),
          steps: e.steps.map((st) => ({ ...st, done: true })),
        })),

      addLead: (input) => {
        const lead: Lead = { id: `l-${uid()}`, receivedAt: now(), status: 'new', ...input };
        setState((s) => ({ ...s, leads: [lead, ...s.leads] }));
      },

      setLeadStatus: (id, status) =>
        setState((s) => ({ ...s, leads: s.leads.map((l) => (l.id === id ? { ...l, status } : l)) })),

      addInvoice: (input) =>
        setState((s) => {
          const invoice: Invoice = {
            id: `i-${uid()}`,
            number: `INV-${String(s.invoices.length + 1).padStart(4, '0')}`,
            status: 'draft',
            issuedAt: now(),
            ...input,
          };
          return { ...s, invoices: [invoice, ...s.invoices] };
        }),

      setInvoiceStatus: (id, status) =>
        setState((s) => ({ ...s, invoices: s.invoices.map((i) => (i.id === id ? { ...i, status } : i)) })),

      addTemplate: (input) =>
        setState((s) => {
          const template: ContractTemplate = {
            id: `c-${uid()}`,
            uploadedAt: now(),
            isDefault: s.templates.length === 0,
            ...input,
          };
          return { ...s, templates: [template, ...s.templates] };
        }),

      setDefaultTemplate: (id) =>
        setState((s) => ({ ...s, templates: s.templates.map((t) => ({ ...t, isDefault: t.id === id })) })),

      removeTemplate: (id) =>
        setState((s) => {
          const rest = s.templates.filter((t) => t.id !== id);
          if (rest.length && !rest.some((t) => t.isDefault)) rest[0] = { ...rest[0], isDefault: true };
          return { ...s, templates: rest };
        }),

      reset: () => setState(seed),
    };
  }, []);

  const value = useMemo<Store>(() => ({ ...state, ...actions, ready, videoUrls }), [state, actions, ready, videoUrls]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
