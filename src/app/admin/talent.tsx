import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Chip, d, DButton, Field, Panel, Shell, t, Tone } from '../../components/dash';
import { ADMIN_NAV } from '../../components/nav';
import { useStore } from '../../data/store';
import { EngagementStatus, Talent, TalentStatus } from '../../data/types';

export const TALENT_BADGE: Record<TalentStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'gray' },
  pending: { label: 'Needs review', tone: 'warn' },
  approved: { label: 'Approved', tone: 'good' },
  rejected: { label: 'Rejected', tone: 'bad' },
};

export const ENGAGEMENT_BADGE: Record<EngagementStatus, { label: string; tone: Tone }> = {
  invited: { label: 'Link sent', tone: 'gray' },
  pending_setup: { label: 'Pending IT setup', tone: 'warn' },
  active: { label: 'Active', tone: 'good' },
};

export const money = (n: number) => `$${n.toLocaleString('en-US')}`;

const ORDER: TalentStatus[] = ['pending', 'approved', 'draft', 'rejected'];

/** Approve professionals and create the private link a client opens. */
export default function AdminTalent() {
  const store = useStore();
  const sorted = [...store.talents].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status));

  return (
    <Shell title="Talent" subtitle="Review profiles, approve them, and send them to clients" nav={ADMIN_NAV}>
      <View style={t.grid}>
        {sorted.map((p) => (
          <TalentCard key={p.id} talent={p} />
        ))}
      </View>
    </Shell>
  );
}

function TalentCard({ talent: p }: { talent: Talent }) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [tools, setTools] = useState('');
  const [standup, setStandup] = useState('');
  const [copied, setCopied] = useState('');

  const links = store.engagements.filter((e) => e.talentId === p.id);
  const badge = TALENT_BADGE[p.status];

  function createLink() {
    store.addEngagement({
      talentId: p.id,
      company: company.trim(),
      contactEmail: contactEmail.trim(),
      tools: tools.split(',').map((x) => x.trim()).filter(Boolean),
      standup: standup.trim(),
    });
    setCompany('');
    setContactEmail('');
    setTools('');
    setStandup('');
    setOpen(false);
  }

  async function copy(token: string) {
    if (Platform.OS !== 'web') return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/invite?c=${token}`);
      setCopied(token);
    } catch {
      setCopied('');
    }
  }

  return (
    <Panel style={styles.card}>
      <View style={styles.head}>
        <Avatar name={p.name} size={46} />
        <View style={t.grow}>
          <Text style={t.strong}>{p.name || 'Unnamed profile'}</Text>
          <Text style={t.small}>{p.role || 'No role chosen'}</Text>
          <Text style={t.small}>{[p.location, p.email].filter(Boolean).join(' · ')}</Text>
        </View>
        <Badge label={badge.label} tone={badge.tone} />
      </View>

      {!!p.headline && <Text style={[t.text, styles.gap]}>{p.headline}</Text>}

      <View style={[t.rowWrap, styles.gap]}>
        {p.skills.map((k) => (
          <Chip key={k.name} label={k.name} verified={k.verified} />
        ))}
      </View>

      <Text style={[t.small, styles.gap]}>
        {p.experience.length} {p.experience.length === 1 ? 'job' : 'jobs'} · {p.education.length}{' '}
        {p.education.length === 1 ? 'degree' : 'degrees'} · {p.videoName ? 'Video uploaded' : 'No video yet'}
      </Text>

      <View style={[t.rowWrap, styles.actions]}>
        {p.status !== 'approved' && (
          <DButton label="Approve" icon="checkmark" small onPress={() => store.setTalentStatus(p.id, 'approved')} />
        )}
        {p.status !== 'rejected' && (
          <DButton
            label={p.status === 'approved' ? 'Remove approval' : 'Reject'}
            icon="close"
            variant="danger"
            small
            onPress={() => store.setTalentStatus(p.id, 'rejected')}
          />
        )}
        {p.status === 'approved' && (
          <DButton
            label={open ? 'Cancel' : 'Create client link'}
            icon={open ? 'close' : 'link'}
            variant="soft"
            small
            onPress={() => setOpen(!open)}
          />
        )}
      </View>

      {open && (
        <View style={[t.item, styles.form]}>
          <View style={styles.fields}>
            <Field label="Client company" value={company} onChangeText={setCompany} placeholder="Acme Corp" />
            <Field label="Client HR / IT email" value={contactEmail} onChangeText={setContactEmail} keyboardType="email-address" />
            <Field label="Tools they use (comma separated)" value={tools} onChangeText={setTools} placeholder="Slack, Notion" />
            <Field label="Daily standup time" value={standup} onChangeText={setStandup} placeholder="9:30 AM EST" />
          </View>
          <DButton label="Create link" icon="link" onPress={createLink} disabled={!company.trim()} style={styles.gap} />
        </View>
      )}

      {links.length > 0 && (
        <View style={styles.links}>
          {links.map((e) => {
            const eb = ENGAGEMENT_BADGE[e.status];
            return (
              <View key={e.id} style={styles.linkRow}>
                <View style={t.grow}>
                  <Text style={t.strong}>{e.company}</Text>
                  <Text style={t.small}>{e.tools.join(', ') || 'No tools listed'}</Text>
                </View>
                <Badge label={eb.label} tone={eb.tone} />
                <DButton
                  label={copied === e.token ? 'Copied' : 'Copy link'}
                  icon="copy-outline"
                  variant="ghost"
                  small
                  onPress={() => copy(e.token)}
                />
                <Link href={`/invite?c=${e.token}` as never} style={styles.openLink}>
                  Open
                </Link>
              </View>
            );
          })}
        </View>
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: 420 },
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  gap: { marginTop: 12 },
  actions: { marginTop: 14 },
  form: { marginTop: 12, backgroundColor: d.soft },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  links: { marginTop: 14 },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: d.line,
  },
  openLink: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: d.blue },
});
