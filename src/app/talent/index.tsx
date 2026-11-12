import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Chip, d, DButton, Empty, Panel, Shell, t, Tone } from '../../components/dash';
import { TALENT_NAV } from '../../components/nav';
import { useStore } from '../../data/store';
import { Engagement, EngagementStatus } from '../../data/types';
import { fireEvent, formatDate, listWords } from '../../lib/events';
import { font } from '../../theme';

const COLUMNS: { status: EngagementStatus; title: string; tone: Tone; empty: string }[] = [
  { status: 'pending_setup', title: 'Pending IT Setup', tone: 'warn', empty: 'Nothing waiting on you.' },
  { status: 'active', title: 'Active', tone: 'good', empty: 'No active clients yet.' },
  { status: 'invited', title: 'Waiting for client', tone: 'gray', empty: 'No open introductions.' },
];

/** Side B: the professional's hub. Which companies accepted them and what to do next. */
export default function TalentHome() {
  const store = useStore();
  const me = store.talents.find((p) => p.id === store.currentTalentId) ?? store.talents[0];
  const mine = store.engagements.filter((e) => e.talentId === me?.id);

  return (
    <Shell
      title="My clients"
      subtitle="Companies you are matched with and your next steps"
      nav={TALENT_NAV}
      right={me && <ViewingAs />}
    >
      {me && me.status !== 'approved' && (
        <Panel style={styles.notice}>
          <Ionicons name="hourglass-outline" size={18} color={d.warn} />
          <Text style={[t.text, t.grow]}>
            {me.status === 'pending'
              ? 'Your profile is under review. Clients will see it once Solimar approves it.'
              : 'Finish your profile and submit it for approval to be matched with clients.'}
          </Text>
        </Panel>
      )}

      <View style={t.grid}>
        {COLUMNS.map((col) => {
          const items = mine.filter((e) => e.status === col.status);
          return (
            <View key={col.status} style={styles.column}>
              <View style={styles.columnHead}>
                <Badge label={col.title} tone={col.tone} />
                <Text style={t.small}>{items.length}</Text>
              </View>
              {items.length === 0 && (
                <Panel>
                  <Empty>{col.empty}</Empty>
                </Panel>
              )}
              {items.map((e) => (
                <EngagementCard key={e.id} engagement={e} />
              ))}
            </View>
          );
        })}
      </View>
    </Shell>
  );
}

/** There is no sign-in yet, so this switcher stands in for "who is logged in". */
function ViewingAs() {
  const store = useStore();
  return (
    <View style={t.rowWrap}>
      <Text style={t.small}>Viewing as</Text>
      {store.talents.map((p) => (
        <Chip
          key={p.id}
          label={p.name || 'New profile'}
          selected={p.id === store.currentTalentId}
          onPress={() => store.setCurrentTalent(p.id)}
        />
      ))}
    </View>
  );
}

function EngagementCard({ engagement: e }: { engagement: Engagement }) {
  const store = useStore();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = e.status === 'pending_setup';

  async function uploadAgreement(stepId: string) {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });
    if (picked.canceled) return;
    store.setStep(e.id, stepId, true, picked.assets[0].name);
  }

  async function confirm() {
    setBusy(true);
    const me = store.talents.find((p) => p.id === e.talentId);
    const outcome = await fireEvent('talent_confirmed_setup', {
      engagementId: e.id,
      company: e.company,
      talent: { name: me?.name, email: me?.email },
    });
    store.confirmEngagement(e.id);
    setNote(outcome === 'failed' ? 'Saved here. The tracking sheet could not be reached.' : '');
    setBusy(false);
  }

  return (
    <Panel style={styles.card}>
      <View style={styles.cardHead}>
        <Avatar name={e.company} size={40} />
        <View style={t.grow}>
          <Text style={t.strong}>{e.company}</Text>
          <Text style={t.small}>
            {e.status === 'invited'
              ? `Introduced ${formatDate(e.createdAt)}`
              : e.status === 'active'
                ? `Active since ${formatDate(e.confirmedAt ?? e.createdAt)}`
                : `Accepted you ${formatDate(e.requestedAt ?? e.createdAt)}`}
          </Text>
        </View>
      </View>

      {e.tools.length > 0 && (
        <View style={[t.rowWrap, styles.tools]}>
          {e.tools.map((tool) => (
            <Chip key={tool} label={tool} />
          ))}
        </View>
      )}

      {e.status === 'invited' ? (
        <Text style={[t.text, styles.body]}>
          We sent your profile to {e.company}. You will see your setup steps here when they add you to their team.
        </Text>
      ) : (
        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>{pending ? 'Your setup steps' : 'Setup complete'}</Text>
          {e.steps.map((step) => (
            <View key={step.id} style={styles.step}>
              <Pressable
                role="checkbox"
                aria-checked={step.done}
                aria-label={step.label}
                disabled={!pending}
                onPress={() => store.setStep(e.id, step.id, !step.done)}
                hitSlop={6}
              >
                <Ionicons
                  name={step.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={step.done ? d.good : d.muted}
                />
              </Pressable>
              <View style={t.grow}>
                <Text style={[t.text, step.done && styles.stepDone]}>{step.label}</Text>
                {step.kind === 'agreement' && step.fileName && <Text style={t.small}>Uploaded: {step.fileName}</Text>}
                {step.kind === 'agreement' && pending && (
                  <DButton
                    label={step.fileName ? 'Replace file' : 'Upload agreement'}
                    icon="cloud-upload-outline"
                    variant="soft"
                    small
                    onPress={() => uploadAgreement(step.id)}
                    style={styles.stepAction}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {pending && (
        <DButton
          label={busy ? 'Saving…' : `I Have Joined Their ${e.tools[0] ?? 'Systems'} / Systems Configured`}
          icon="checkmark-done"
          onPress={confirm}
          disabled={busy}
          style={styles.confirm}
        />
      )}
      {e.status === 'active' && e.standup !== '' && (
        <Text style={[t.small, styles.body]}>
          Daily standup at {e.standup}
          {e.tools.length ? ` · ${listWords(e.tools)}` : ''}
        </Text>
      )}
      {!!note && <Text style={styles.note}>{note}</Text>}
    </Panel>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 14, backgroundColor: d.warnSoft },
  column: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minWidth: 0, gap: 12 },
  columnHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  card: { gap: 0 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tools: { marginTop: 12 },
  body: { marginTop: 12 },
  steps: { marginTop: 14, borderTopWidth: 1, borderTopColor: d.line, paddingTop: 12 },
  stepsTitle: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: d.muted,
    marginBottom: 8,
  },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 },
  stepDone: { color: d.muted },
  stepAction: { marginTop: 8 },
  confirm: { alignSelf: 'stretch', marginTop: 14, paddingVertical: 14 },
  note: { fontFamily: font.semibold, fontSize: 13, color: d.warn, marginTop: 8 },
});
