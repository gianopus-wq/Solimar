import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, d, Empty, Panel, Shell, Stat, t, Tone } from '../../components/dash';
import { ADMIN_NAV } from '../../components/nav';
import { useStore } from '../../data/store';
import { Engagement, Talent } from '../../data/types';
import { formatDate } from '../../lib/events';
import { ENGAGEMENT_BADGE, money } from './talent';

/** Contract value for a placement: hourly rate × hours per week × weeks. */
export const contractValue = (e: Engagement) => e.hourlyRate * e.hoursPerWeek * e.termWeeks;

/**
 * Contract fulfillment: what each placement is worth, how many hours it covers,
 * and which signatures are still missing. Documents are sent and tracked in DocuSeal.
 */
export default function AdminContracts() {
  const store = useStore();
  const invoices = store.invoices;

  const rows = store.engagements.map((e) => {
    const talent = store.talents.find((p) => p.id === e.talentId);
    const invoiced = invoices.filter((i) => i.company === e.company && i.talentId === e.talentId);
    return { e, talent, value: contractValue(e), invoiced: sum(invoiced.map((i) => i.amount)), paid: sum(invoiced.filter((i) => i.status === 'paid').map((i) => i.amount)) };
  });

  const totalValue = sum(rows.map((r) => r.value));
  const weeklyHours = sum(store.engagements.map((e) => e.hoursPerWeek));
  const weeklySpend = sum(store.engagements.map((e) => e.hourlyRate * e.hoursPerWeek));
  const outstanding = countOutstanding(store.engagements, store.talents);

  return (
    <Shell title="Contract fulfillment" subtitle="Value, hours, and signatures for every placement" nav={ADMIN_NAV}>
      <View style={t.grid}>
        <Stat icon="cash-outline" label="Total contract value" value={money(totalValue)} note={`${rows.length} placements`} />
        <Stat icon="time-outline" label="Hours per week" value={String(weeklyHours)} note={`${money(weeklySpend)} per week`} />
        <Stat icon="create-outline" label="Signatures outstanding" value={String(outstanding)} note="client and professional" />
        <Stat icon="receipt-outline" label="Invoiced" value={money(sum(invoices.map((i) => i.amount)))} note={`${money(sum(invoices.filter((i) => i.status === 'paid').map((i) => i.amount)))} paid`} />
      </View>

      {rows.length === 0 && (
        <Panel style={styles.gap}>
          <Empty>No placements yet. Create a client link from the Talent page, with rate, hours and term, to start tracking.</Empty>
        </Panel>
      )}

      <View style={styles.list}>
        {rows.map(({ e, talent, value, invoiced, paid }) => (
          <Panel key={e.id} style={styles.card}>
            <View style={styles.head}>
              <View style={t.grow}>
                <Text style={t.strong}>{e.company}</Text>
                <Text style={t.small}>
                  {talent?.name ?? 'Unknown professional'} · {talent?.role || 'No role'}
                </Text>
              </View>
              <Badge label={ENGAGEMENT_BADGE[e.status].label} tone={ENGAGEMENT_BADGE[e.status].tone} />
            </View>

            <View style={styles.terms}>
              <Term label="Contract value" value={money(value)} strong />
              <Term label="Bill rate" value={`${money(e.hourlyRate)}/hr`} note="Billed to the client" />
              <Term label="Hours" value={`${e.hoursPerWeek}/wk`} note={e.termWeeks ? `${e.hoursPerWeek * e.termWeeks} total over ${e.termWeeks} wks` : 'Term not set'} />
              <Term label="Invoiced" value={money(invoiced)} note={`${money(paid)} paid`} />
            </View>

            <Text style={styles.sectionLabel}>Signatures</Text>
            <View style={styles.signers}>
              <Signer name="Master Services Agreement" who={e.contactEmail || 'Client'} signedAt={e.msaSignedAt} />
              <Signer name="Statement of Work" who={e.contactEmail || 'Client'} signedAt={e.sowSignedAt} />
              <Signer name="W-2 employment agreement" who={talent?.name ?? 'Professional'} signedAt={talent?.employmentSignedAt} />
            </View>

            <Text style={[t.small, styles.foot]}>
              {progress(e, talent)} signed
              {e.confirmedAt ? ` · Setup confirmed ${formatDate(e.confirmedAt)}` : ''}
            </Text>
          </Panel>
        ))}
      </View>
    </Shell>
  );
}

function Term({ label, value, note, strong }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <View style={styles.term}>
      <Text style={styles.termLabel}>{label}</Text>
      <Text style={strong ? styles.termValueStrong : styles.termValue}>{value}</Text>
      {!!note && <Text style={t.small}>{note}</Text>}
    </View>
  );
}

function Signer({ name, who, signedAt }: { name: string; who: string; signedAt?: string }) {
  const tone: Tone = signedAt ? 'good' : 'warn';
  return (
    <View style={styles.signer}>
      <Ionicons name={signedAt ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={signedAt ? d.good : d.warn} />
      <View style={t.grow}>
        <Text style={t.strong}>{name}</Text>
        <Text style={t.small}>{who}</Text>
      </View>
      <Badge label={signedAt ? `Signed ${formatDate(signedAt)}` : 'Awaiting signature'} tone={tone} />
    </View>
  );
}

/** How many of the three signatures for this placement are done (MSA, SOW, W-2 employment). */
function progress(e: Engagement, talent?: Talent): string {
  const done = [e.msaSignedAt, e.sowSignedAt, talent?.employmentSignedAt].filter(Boolean).length;
  return `${done} of 3`;
}

/** Client signatures (MSA, SOW) and professional signatures still missing across all placements. */
function countOutstanding(engagements: Engagement[], talents: Talent[]): number {
  let n = 0;
  for (const e of engagements) {
    if (!e.msaSignedAt) n += 1;
    if (!e.sowSignedAt) n += 1;
  }
  const placed = new Set(engagements.map((e) => e.talentId));
  for (const id of placed) {
    const talent = talents.find((p) => p.id === id);
    if (talent && !talent.employmentSignedAt) n += 1;
  }
  return n;
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

const styles = StyleSheet.create({
  gap: { marginTop: 14 },
  list: { gap: 14, marginTop: 14 },
  card: { flexGrow: 1, flexBasis: 480 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  terms: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: d.line },
  term: { flexGrow: 1, flexBasis: 120, minWidth: 0, gap: 2 },
  termLabel: { fontFamily: 'Manrope_700Bold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: d.muted },
  termValue: { fontFamily: 'Manrope_700Bold', fontSize: 16, color: d.ink },
  termValueStrong: { fontFamily: 'Manrope_800ExtraBold', fontSize: 20, letterSpacing: -0.4, color: d.ink },
  sectionLabel: { fontFamily: 'Manrope_700Bold', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: d.muted, marginTop: 14, marginBottom: 6 },
  signers: { gap: 6 },
  signer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, flexWrap: 'wrap' },
  foot: { marginTop: 10 },
});
