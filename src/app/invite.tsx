import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Chip, d, DButton, pageBackground, Panel, t } from '../components/dash';
import { SunMark } from '../components/SunMark';
import { Video } from '../components/Video';
import { Invite as InviteData } from '../data/types';
import { EventResult, fireEvent, listWords } from '../lib/events';
import { supabase, videoUrl } from '../lib/supabase';
import { font } from '../theme';

const NEXT_STEPS = [
  { icon: 'document-text-outline' as const, text: 'We email you the Master Services Agreement and Statement of Work to sign.' },
  { icon: 'key-outline' as const, text: 'Your HR or IT team gets the professional’s contact details.' },
  { icon: 'checkbox-outline' as const, text: 'The onboarding checklist starts in the tools you already use.' },
];

function clock(timeZone: string): string {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone });
}

/**
 * Side A: the client's link. No sign-in. One talent card, one button.
 * Opened as /invite?c=<token>.
 */
export default function Invite() {
  const { c } = useLocalSearchParams<{ c?: string }>();
  // undefined = still loading, null = link not valid
  const [invite, setInvite] = useState<InviteData | null | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<EventResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [times, setTimes] = useState<{ pr: string; ny: string } | null>(null);

  // Live clocks are filled in after load so the pre-rendered page stays stable.
  useEffect(() => {
    const tick = () => setTimes({ pr: clock('America/Puerto_Rico'), ny: clock('America/New_York') });
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // The token in the link is the only credential. The database returns just this card's data.
  useEffect(() => {
    if (!c) {
      // Before hydration the query string is not known yet; decide once the browser has it.
      const id = setTimeout(() => setInvite((v) => (v === undefined ? null : v)), 1500);
      return () => clearTimeout(id);
    }
    let cancelled = false;
    supabase.rpc('get_invite', { p_token: c }).then(({ data }) => {
      if (!cancelled) setInvite((data as InviteData | null) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [c]);

  if (invite === undefined) return <View style={[styles.page, pageBackground]} />;

  const engagement = invite?.engagement;
  const talent = invite?.talent;

  if (!engagement || !talent) {
    return (
      <View style={[styles.page, styles.center, pageBackground]}>
        <Panel style={styles.notFound}>
          <Ionicons name="link-outline" size={28} color={d.muted} />
          <Text style={styles.name}>This link is not active</Text>
          <Text style={t.text}>It may have expired or been copied incorrectly. Ask your Naboria contact for a new one.</Text>
        </Panel>
      </View>
    );
  }

  const requested = engagement.status !== 'invited';
  const verified = talent.skills.filter((k) => k.verified);

  async function addToTeam() {
    if (!invite || !c) return;
    setSending(true);
    setFailed(false);
    // Records the request and returns the details the automation needs.
    const { data: payload, error } = await supabase.rpc('request_onboarding', { p_token: c });
    if (error || !payload) {
      setFailed(true);
      setSending(false);
      return;
    }
    setInvite({ ...invite, engagement: { ...invite.engagement, status: 'pending_setup' } });
    // Sends the MSA and SOW for signature. A failure here is shown, but the request is still recorded.
    const sent = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'client', token: c }),
    });
    if (!sent.ok) setFailed(true);
    setResult(await fireEvent('onboarding_requested', payload as Record<string, unknown>));
    setSending(false);
  }

  return (
    <ScrollView style={[styles.page, pageBackground]} contentContainerStyle={styles.content}>
      <Head>
        <title>{`${talent.name} for ${engagement.company} | Naboria`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <View style={styles.top}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <SunMark size={22} color="#FFFFFF" detail={d.blue} />
          </View>
          <Text style={styles.brandName}>Naboria</Text>
        </View>
        <Badge label={`Private link for ${engagement.company}`} tone="gray" icon="lock-closed" />
      </View>

      <Panel style={styles.card}>
        <View style={styles.who}>
          <Avatar name={talent.name} size={64} />
          <View style={t.grow}>
            <Text role="heading" aria-level={1} style={styles.name}>
              {talent.name}
            </Text>
            <Text style={t.text}>{talent.role}</Text>
            <Text style={t.small}>{talent.location}</Text>
          </View>
          <Badge label="Pre-vetted by Naboria" tone="good" icon="shield-checkmark" />
        </View>

        <Text style={styles.headline}>{talent.headline}</Text>

        <View style={[t.grid, styles.block]}>
          <View style={styles.videoCol}>
            <Video
              url={videoUrl(talent.videoPath)}
              emptyText={talent.videoName ? '60-second intro' : '60-second intro coming soon'}
            />
          </View>

          <View style={styles.sideCol}>
            <Text style={styles.label}>Time zone</Text>
            <View style={styles.zone}>
              <View style={styles.zoneRow}>
                <Text style={t.text}>San Juan</Text>
                <Text style={t.strong}>{times?.pr ?? '—'}</Text>
              </View>
              <View style={styles.zoneRow}>
                <Text style={t.text}>New York</Text>
                <Text style={t.strong}>{times?.ny ?? '—'}</Text>
              </View>
              <Text style={[t.small, styles.zoneNote]}>Works your East Coast day. Never more than 1 hour apart.</Text>
            </View>

            <Text style={[styles.label, styles.gap]}>Languages</Text>
            <View style={t.rowWrap}>
              <Chip label="English · Native" />
              <Chip label="Spanish · Native" />
            </View>
          </View>
        </View>

        <Text style={[styles.label, styles.block]}>Verified skills</Text>
        <View style={t.rowWrap}>
          {verified.length ? (
            verified.map((k) => <Chip key={k.name} label={k.name} verified />)
          ) : (
            <Text style={t.small}>Skills are being verified.</Text>
          )}
        </View>

        {!!talent.bio && (
          <>
            <Text style={[styles.label, styles.block]}>Why {talent.name.split(' ')[0]} fits</Text>
            <Text style={t.text}>{talent.bio}</Text>
            <View style={[t.rowWrap, styles.qualities]}>
              {talent.qualities.map((q) => (
                <Chip key={q} label={q} />
              ))}
            </View>
          </>
        )}

        {talent.experience.length > 0 && (
          <>
            <Text style={[styles.label, styles.block]}>Experience</Text>
            {talent.experience.map((x) => (
              <View key={x.id} style={styles.line}>
                <Text style={t.strong}>{x.title}</Text>
                <Text style={t.small}>
                  {x.company} · {x.period}
                </Text>
                {!!x.summary && <Text style={t.text}>{x.summary}</Text>}
              </View>
            ))}
          </>
        )}

        {talent.education.length > 0 && (
          <>
            <Text style={[styles.label, styles.block]}>Education</Text>
            {talent.education.map((e) => (
              <View key={e.id} style={styles.line}>
                <Text style={t.strong}>{e.degree}</Text>
                <Text style={t.small}>
                  {e.school} · {e.year}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.action}>
          {requested ? (
            <View aria-live="polite">
              <View style={styles.doneHead}>
                <Ionicons name="checkmark-circle" size={24} color={d.good} />
                <Text style={styles.doneTitle}>Onboarding requested</Text>
              </View>
              <Text style={t.text}>
                {talent.name.split(' ')[0]} is being set up for {engagement.company}
                {engagement.tools.length ? ` in ${listWords(engagement.tools)}` : ''}. We will email{' '}
                {engagement.contactEmail || 'your team'} with next steps.
              </Text>
              {result === 'failed' && (
                <Text style={styles.warn}>
                  Your request is saved, but our automation did not respond. Your Naboria contact will follow up by hand.
                </Text>
              )}
            </View>
          ) : (
            <>
              <Text style={styles.label}>What happens when you click</Text>
              {NEXT_STEPS.map((n) => (
                <View key={n.text} style={styles.next}>
                  <Ionicons name={n.icon} size={18} color={d.blue} />
                  <Text style={[t.text, t.grow]}>{n.text}</Text>
                </View>
              ))}
              <DButton
                label={sending ? 'Sending…' : 'Add to Team / Request Onboarding'}
                icon="person-add"
                onPress={addToTeam}
                disabled={sending}
                style={styles.cta}
              />
              {failed && (
                <Text style={styles.warn} role="alert">
                  We could not send your request. Please try again.
                </Text>
              )}
              <Text style={[t.small, styles.ctaNote]}>No account needed. One click starts onboarding.</Text>
            </>
          )}
        </View>
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: d.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 20 },
  notFound: { maxWidth: 420, gap: 8, alignItems: 'flex-start' },
  content: { padding: 16, paddingBottom: 48, width: '100%', maxWidth: 860, alignSelf: 'center' },
  top: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    marginBottom: 6,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: d.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontFamily: font.extrabold, fontSize: 18, letterSpacing: -0.4, color: d.ink },
  card: { padding: 24 },
  who: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  name: { fontFamily: font.extrabold, fontSize: 24, letterSpacing: -0.5, color: d.ink },
  headline: { fontFamily: font.semibold, fontSize: 17, lineHeight: 25, color: d.ink, marginTop: 16 },
  block: { marginTop: 22 },
  gap: { marginTop: 16 },
  videoCol: { flexGrow: 3, flexShrink: 1, flexBasis: 320, minWidth: 0 },
  sideCol: { flexGrow: 2, flexShrink: 1, flexBasis: 220, minWidth: 0 },
  label: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: d.muted,
    marginBottom: 8,
  },
  zone: { backgroundColor: d.soft, borderRadius: 14, borderWidth: 1, borderColor: d.line, padding: 14, gap: 6 },
  zoneRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  zoneNote: { marginTop: 4 },
  qualities: { marginTop: 10 },
  line: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: d.line, gap: 2 },
  action: {
    marginTop: 24,
    backgroundColor: d.soft,
    borderWidth: 1,
    borderColor: d.line,
    borderRadius: 16,
    padding: 18,
  },
  next: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  cta: { alignSelf: 'stretch', paddingVertical: 16, marginTop: 10 },
  ctaNote: { textAlign: 'center', marginTop: 8 },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  doneTitle: { fontFamily: font.bold, fontSize: 18, color: d.ink },
  warn: { fontFamily: font.semibold, fontSize: 13, lineHeight: 19, color: d.warn, marginTop: 10 },
});
