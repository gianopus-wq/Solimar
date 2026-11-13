import type { Session } from '@supabase/supabase-js';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { fireEvent } from '../lib/events';
import { BUCKET, safeFileName, supabase } from '../lib/supabase';
import { buildSteps } from './steps';
import {
  ContractTemplate,
  Engagement,
  Invoice,
  InvoiceStatus,
  Lead,
  LeadStatus,
  Role,
  Talent,
  TalentStatus,
} from './types';

/**
 * App data, backed by Supabase (Postgres, Auth, Storage).
 *
 * What each signed-in person can read or change is enforced by the database's
 * row level security, not by this file: a professional only ever receives their
 * own profile and engagements, an admin receives everything.
 */

export const uid = () => Math.random().toString(36).slice(2, 10);

type Row = Record<string, any>;

const toTalent = (r: Row): Talent => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  location: r.location,
  role: r.role,
  headline: r.headline,
  bio: r.bio,
  qualities: r.qualities ?? [],
  skills: r.skills ?? [],
  education: r.education ?? [],
  experience: r.experience ?? [],
  videoName: r.video_name,
  videoPath: r.video_path,
  payRate: Number(r.pay_rate ?? 0),
  employmentSignedAt: r.employment_signed_at ?? undefined,
  status: r.status,
});

const TALENT_COLUMNS: Partial<Record<keyof Talent, string>> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  location: 'location',
  role: 'role',
  headline: 'headline',
  bio: 'bio',
  qualities: 'qualities',
  skills: 'skills',
  education: 'education',
  experience: 'experience',
  videoName: 'video_name',
  videoPath: 'video_path',
  payRate: 'pay_rate',
  status: 'status',
};

function talentRow(patch: Partial<Talent>): Row {
  const row: Row = {};
  for (const [k, v] of Object.entries(patch)) {
    const column = TALENT_COLUMNS[k as keyof Talent];
    if (column) row[column] = v;
  }
  return row;
}

const toEngagement = (r: Row): Engagement => ({
  id: r.id,
  token: r.token,
  talentId: r.talent_id,
  company: r.company,
  contactEmail: r.contact_email,
  tools: r.tools ?? [],
  standup: r.standup,
  status: r.status,
  steps: r.steps ?? [],
  createdAt: r.created_at,
  requestedAt: r.requested_at ?? undefined,
  confirmedAt: r.confirmed_at ?? undefined,
  msaSignedAt: r.msa_signed_at ?? undefined,
  sowSignedAt: r.sow_signed_at ?? undefined,
  hourlyRate: Number(r.hourly_rate ?? 0),
  hoursPerWeek: Number(r.hours_per_week ?? 0),
  termWeeks: Number(r.term_weeks ?? 0),
});

const toLead = (r: Row): Lead => ({
  id: r.id,
  name: r.name,
  email: r.email,
  notes: r.notes,
  receivedAt: r.received_at,
  status: r.status,
});

const toInvoice = (r: Row): Invoice => ({
  id: r.id,
  number: r.number,
  company: r.company,
  talentId: r.talent_id ?? '',
  period: r.period,
  amount: Number(r.amount),
  status: r.status,
  issuedAt: r.issued_at,
});

const toTemplate = (r: Row): ContractTemplate => ({
  id: r.id,
  name: r.name,
  fileName: r.file_name,
  filePath: r.file_path,
  size: Number(r.size),
  uploadedAt: r.uploaded_at,
  isDefault: r.is_default,
});

/** A picked file as something Storage can upload (a File on web, a blob on native). */
async function fileBody(asset: DocumentPickerAsset): Promise<Blob> {
  return asset.file ?? (await (await fetch(asset.uri)).blob());
}

type Data = {
  talents: Talent[];
  engagements: Engagement[];
  leads: Lead[];
  invoices: Invoice[];
  templates: ContractTemplate[];
};
const EMPTY: Data = { talents: [], engagements: [], leads: [], invoices: [], templates: [] };

type Actions = {
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string) => Promise<{ error: string; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  updateTalent: (id: string, patch: Partial<Talent>) => void;
  setTalentStatus: (id: string, status: TalentStatus) => Promise<void>;
  uploadVideo: (talent: Talent, asset: DocumentPickerAsset) => Promise<void>;
  addEngagement: (input: {
    talentId: string;
    company: string;
    contactEmail: string;
    tools: string[];
    standup: string;
    hourlyRate: number;
    hoursPerWeek: number;
    termWeeks: number;
  }) => Promise<void>;
  setStep: (engagement: Engagement, stepId: string, done: boolean, file?: { name: string; path: string }) => Promise<void>;
  uploadAgreement: (engagement: Engagement, stepId: string, asset: DocumentPickerAsset) => Promise<void>;
  confirmEngagement: (engagement: Engagement) => Promise<boolean>;
  setLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
  addInvoice: (input: { company: string; talentId: string; period: string; amount: number }) => Promise<void>;
  setInvoiceStatus: (id: string, status: InvoiceStatus) => Promise<void>;
  addTemplate: (asset: DocumentPickerAsset) => Promise<void>;
  setDefaultTemplate: (id: string) => Promise<void>;
  removeTemplate: (template: ContractTemplate) => Promise<void>;
  /** Short-lived link to a private file (signed agreement or contract template). */
  fileUrl: (bucket: 'agreements' | 'contracts', path: string) => Promise<string | null>;
};

type Store = Data &
  Actions & {
    /** False until the session is known and its data has loaded. */
    ready: boolean;
    session: Session | null;
    role: Role | null;
    /** The signed-in professional's own record. */
    me?: Talent;
    /** Last failed save, shown at the top of every dashboard. */
    error: string;
  };

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authKnown, setAuthKnown] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null | undefined>(undefined);
  const [data, setData] = useState<Data>(EMPTY);
  const [error, setError] = useState('');

  const userId = session?.user.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: d }) => {
      setSession(d.session);
      setAuthKnown(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load everything this person is allowed to see whenever the signed-in user changes.
  useEffect(() => {
    if (!authKnown) return;
    let cancelled = false;
    (async () => {
      if (!userId) {
        setRole(null);
        setData(EMPTY);
        setLoadedFor(null);
        return;
      }
      const profile = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      const nextRole: Role = profile.data?.role === 'admin' ? 'admin' : 'talent';
      const [talents, engagements] = await Promise.all([
        supabase.from('talents').select('*').order('created_at'),
        supabase.from('engagements').select('*').order('created_at', { ascending: false }),
      ]);
      const admin =
        nextRole === 'admin'
          ? await Promise.all([
              supabase.from('leads').select('*').order('received_at', { ascending: false }),
              supabase.from('invoices').select('*').order('issued_at', { ascending: false }),
              supabase.from('contract_templates').select('*').order('uploaded_at', { ascending: false }),
            ])
          : null;
      if (cancelled) return;
      const failed = [profile, talents, engagements, ...(admin ?? [])].find((r) => r.error);
      if (failed?.error) setError(`Could not load your data: ${failed.error.message}`);
      setRole(nextRole);
      setData({
        talents: (talents.data ?? []).map(toTalent),
        engagements: (engagements.data ?? []).map(toEngagement),
        leads: (admin?.[0].data ?? []).map(toLead),
        invoices: (admin?.[1].data ?? []).map(toInvoice),
        templates: (admin?.[2].data ?? []).map(toTemplate),
      });
      setLoadedFor(userId);
    })();
    return () => {
      cancelled = true;
    };
  }, [authKnown, userId]);

  // Profile fields save as you type: edits show at once and are written in one batch shortly after.
  const pending = useRef<Record<string, { patch: Partial<Talent>; timer: ReturnType<typeof setTimeout> }>>({});

  const actions = useMemo<Actions>(() => {
    const fail = (message: string) => setError(message);
    const patchList = <K extends keyof Data>(key: K, id: string, fn: (item: Data[K][number]) => Data[K][number]) =>
      setData((d) => ({ ...d, [key]: (d[key] as any[]).map((item) => (item.id === id ? fn(item) : item)) }));

    const flushTalent = async (id: string) => {
      const entry = pending.current[id];
      if (!entry) return;
      delete pending.current[id];
      const { error: e } = await supabase.from('talents').update(talentRow(entry.patch)).eq('id', id);
      if (e) fail(`Your changes were not saved: ${e.message}`);
    };

    const saveSteps = async (engagement: Engagement, steps: Engagement['steps']) => {
      patchList('engagements', engagement.id, (e) => ({ ...e, steps }));
      const { error: e } = await supabase.from('engagements').update({ steps }).eq('id', engagement.id);
      if (e) fail(`That step was not saved: ${e.message}`);
    };

    return {
      signIn: async (email, password) => {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return e?.message ?? '';
      },

      signUp: async (email, password) => {
        const { data: d, error: e } = await supabase.auth.signUp({ email: email.trim(), password });
        return { error: e?.message ?? '', needsConfirmation: !e && !d.session };
      },

      signOut: async () => {
        await supabase.auth.signOut();
      },

      clearError: () => setError(''),

      updateTalent: (id, patch) => {
        patchList('talents', id, (t) => ({ ...t, ...patch }));
        const entry = pending.current[id];
        if (entry) clearTimeout(entry.timer);
        pending.current[id] = {
          patch: { ...entry?.patch, ...patch },
          timer: setTimeout(() => flushTalent(id), 700),
        };
      },

      setTalentStatus: async (id, status) => {
        const entry = pending.current[id];
        if (entry) {
          clearTimeout(entry.timer);
          await flushTalent(id);
        }
        const { data: row, error: e } = await supabase.from('talents').update({ status }).eq('id', id).select().single();
        if (e || !row) return fail(`Status was not changed: ${e?.message ?? 'not allowed'}`);
        patchList('talents', id, () => toTalent(row));
        // Approval sends the W-2 employment agreement through DocuSeal (server route).
        if (status === 'approved') {
          const outcome = await fireEvent('talent_approved', { talentId: id, name: row.name, email: row.email, role: row.role });
          if (outcome === 'failed') fail('Approved, but the Make notification failed.');
          const { data: session } = await supabase.auth.getSession();
          const sent = await fetch('/api/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session?.access_token ?? ''}` },
            body: JSON.stringify({ kind: 'employment', talentId: id }),
          });
          if (!sent.ok) fail('Approved, but the employment agreement could not be sent. Check the DocuSeal settings.');
        }
      },

      uploadVideo: async (talent, asset) => {
        const ext = asset.name.includes('.') ? asset.name.split('.').pop() : 'mp4';
        const path = `${talent.userId}/intro-${Date.now()}.${ext}`;
        const { error: e } = await supabase.storage
          .from(BUCKET.videos)
          .upload(path, await fileBody(asset), { contentType: asset.mimeType ?? undefined });
        if (e) return fail(`The video was not uploaded: ${e.message}`);
        const { error: e2 } = await supabase
          .from('talents')
          .update({ video_path: path, video_name: asset.name })
          .eq('id', talent.id);
        if (e2) return fail(`The video was not saved to your profile: ${e2.message}`);
        if (talent.videoPath) await supabase.storage.from(BUCKET.videos).remove([talent.videoPath]);
        patchList('talents', talent.id, (t) => ({ ...t, videoPath: path, videoName: asset.name }));
      },

      addEngagement: async (input) => {
        const { data: row, error: e } = await supabase
          .from('engagements')
          .insert({
            talent_id: input.talentId,
            company: input.company,
            contact_email: input.contactEmail,
            tools: input.tools,
            standup: input.standup,
            hourly_rate: input.hourlyRate,
            hours_per_week: input.hoursPerWeek,
            term_weeks: input.termWeeks,
            steps: buildSteps(input.tools, input.standup),
          })
          .select()
          .single();
        if (e || !row) return fail(`The client link was not created: ${e?.message ?? 'not allowed'}`);
        setData((d) => ({ ...d, engagements: [toEngagement(row), ...d.engagements] }));
      },

      setStep: (engagement, stepId, done, file) =>
        saveSteps(
          engagement,
          engagement.steps.map((s) =>
            s.id === stepId ? { ...s, done, fileName: file?.name ?? s.fileName, filePath: file?.path ?? s.filePath } : s,
          ),
        ),

      uploadAgreement: async (engagement, stepId, asset) => {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) return fail('Please sign in again.');
        const path = `${auth.user.id}/${engagement.id}/${Date.now()}-${safeFileName(asset.name)}`;
        const { error: e } = await supabase.storage
          .from(BUCKET.agreements)
          .upload(path, await fileBody(asset), { contentType: asset.mimeType ?? undefined });
        if (e) return fail(`The agreement was not uploaded: ${e.message}`);
        await saveSteps(
          engagement,
          engagement.steps.map((s) => (s.id === stepId ? { ...s, done: true, fileName: asset.name, filePath: path } : s)),
        );
      },

      confirmEngagement: async (engagement) => {
        const steps = engagement.steps.map((s) => ({ ...s, done: true }));
        const { data: row, error: e } = await supabase
          .from('engagements')
          .update({ status: 'active', steps })
          .eq('id', engagement.id)
          .select()
          .single();
        if (e || !row) {
          fail(`Your confirmation was not saved: ${e?.message ?? 'not allowed'}`);
          return false;
        }
        patchList('engagements', engagement.id, () => toEngagement(row));
        return true;
      },

      setLeadStatus: async (id, status) => {
        patchList('leads', id, (l) => ({ ...l, status }));
        const { error: e } = await supabase.from('leads').update({ status }).eq('id', id);
        if (e) fail(`The lead was not updated: ${e.message}`);
      },

      addInvoice: async (input) => {
        const { data: row, error: e } = await supabase
          .from('invoices')
          .insert({ company: input.company, talent_id: input.talentId, period: input.period, amount: input.amount })
          .select()
          .single();
        if (e || !row) return fail(`The invoice was not created: ${e?.message ?? 'not allowed'}`);
        setData((d) => ({ ...d, invoices: [toInvoice(row), ...d.invoices] }));
      },

      setInvoiceStatus: async (id, status) => {
        patchList('invoices', id, (i) => ({ ...i, status }));
        const { error: e } = await supabase.from('invoices').update({ status }).eq('id', id);
        if (e) fail(`The invoice was not updated: ${e.message}`);
      },

      addTemplate: async (asset) => {
        const path = `${Date.now()}-${safeFileName(asset.name)}`;
        const { error: e } = await supabase.storage
          .from(BUCKET.contracts)
          .upload(path, await fileBody(asset), { contentType: asset.mimeType ?? undefined });
        if (e) return fail(`The template was not uploaded: ${e.message}`);
        const existing = await supabase.from('contract_templates').select('id', { count: 'exact', head: true });
        const { data: row, error: e2 } = await supabase
          .from('contract_templates')
          .insert({
            name: asset.name.replace(/\.[^.]+$/, ''),
            file_name: asset.name,
            file_path: path,
            size: asset.size ?? 0,
            is_default: (existing.count ?? 0) === 0,
          })
          .select()
          .single();
        if (e2 || !row) return fail(`The template was not saved: ${e2?.message ?? 'not allowed'}`);
        setData((d) => ({ ...d, templates: [toTemplate(row), ...d.templates] }));
      },

      setDefaultTemplate: async (id) => {
        const cleared = await supabase.from('contract_templates').update({ is_default: false }).eq('is_default', true);
        const set = cleared.error
          ? cleared
          : await supabase.from('contract_templates').update({ is_default: true }).eq('id', id);
        if (set.error) return fail(`The default was not changed: ${set.error.message}`);
        setData((d) => ({ ...d, templates: d.templates.map((t) => ({ ...t, isDefault: t.id === id })) }));
      },

      removeTemplate: async (template) => {
        const { error: e } = await supabase.from('contract_templates').delete().eq('id', template.id);
        if (e) return fail(`The template was not removed: ${e.message}`);
        await supabase.storage.from(BUCKET.contracts).remove([template.filePath]);
        setData((d) => ({ ...d, templates: d.templates.filter((t) => t.id !== template.id) }));
      },

      fileUrl: async (bucket, path) => {
        const { data: d, error: e } = await supabase.storage.from(BUCKET[bucket]).createSignedUrl(path, 300);
        if (e) fail(`That file could not be opened: ${e.message}`);
        return d?.signedUrl ?? null;
      },
    };
  }, []);

  const ready = authKnown && loadedFor === userId;
  const value = useMemo<Store>(
    () => ({
      ...data,
      ...actions,
      ready,
      session,
      role: ready ? role : null,
      me: role === 'talent' ? data.talents.find((t) => t.userId === userId) : undefined,
      error,
    }),
    [data, actions, ready, session, role, userId, error],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
