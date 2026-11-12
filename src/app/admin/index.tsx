import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, d, DButton, Empty, Panel, Shell, Stat, t } from '../../components/dash';
import { ADMIN_NAV } from '../../components/nav';
import { useStore } from '../../data/store';
import { formatDate } from '../../lib/events';
import { ENGAGEMENT_BADGE, money } from './talent';

/** Side C: run everything. This screen is the daily summary. */
export default function AdminOverview() {
  const store = useStore();
  const pending = store.talents.filter((p) => p.status === 'pending');
  const newLeads = store.leads.filter((l) => l.status === 'new');
  const active = store.engagements.filter((e) => e.status === 'active');
  const unpaid = store.invoices.filter((i) => i.status === 'sent');
  const unpaidTotal = unpaid.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Shell
      title="Solimar Admin"
      subtitle="Talent, clients, leads, and billing in one place"
      nav={ADMIN_NAV}
    >
      <View style={t.grid}>
        <Stat icon="mail-unread-outline" label="New leads" value={String(newLeads.length)} note={`${store.leads.length} total`} />
        <Stat icon="people-outline" label="Talent to review" value={String(pending.length)} note={`${store.talents.length} profiles`} />
        <Stat icon="briefcase-outline" label="Active placements" value={String(active.length)} note={`${store.engagements.length} introductions`} />
        <Stat icon="receipt-outline" label="Awaiting payment" value={money(unpaidTotal)} note={`${unpaid.length} sent invoices`} />
      </View>

      <View style={[t.grid, styles.row]}>
        <Panel
          title="Talent waiting for approval"
          style={styles.half}
          action={
            <Link href="/admin/talent" style={styles.link}>
              Review all
            </Link>
          }
        >
          {pending.length === 0 && <Empty>No one is waiting.</Empty>}
          {pending.map((p) => (
            <View key={p.id} style={styles.line}>
              <Avatar name={p.name} size={38} />
              <View style={t.grow}>
                <Text style={t.strong}>{p.name}</Text>
                <Text style={t.small}>{p.role}</Text>
              </View>
              <DButton label="Approve" icon="checkmark" small onPress={() => store.setTalentStatus(p.id, 'approved')} />
            </View>
          ))}
        </Panel>

        <Panel
          title="New leads"
          style={styles.half}
          action={
            <Link href="/admin/leads" style={styles.link}>
              Open leads
            </Link>
          }
        >
          {newLeads.length === 0 && <Empty>No new leads.</Empty>}
          {newLeads.map((l) => (
            <View key={l.id} style={styles.line}>
              <View style={t.grow}>
                <Text style={t.strong}>{l.name}</Text>
                <Text style={t.small}>
                  {l.email} · {formatDate(l.receivedAt)}
                </Text>
                {!!l.notes && <Text style={t.text}>{l.notes}</Text>}
              </View>
            </View>
          ))}
        </Panel>
      </View>

      <Panel title="Placements" style={styles.row}>
        {store.engagements.length === 0 && <Empty>No client links yet. Create one from the Talent page.</Empty>}
        {store.engagements.map((e) => {
          const talent = store.talents.find((p) => p.id === e.talentId);
          const badge = ENGAGEMENT_BADGE[e.status];
          return (
            <View key={e.id} style={styles.line}>
              <View style={[t.grow, styles.cell]}>
                <Text style={t.strong}>{e.company}</Text>
                <Text style={t.small}>{talent?.name ?? 'Unknown'}</Text>
              </View>
              <Text style={[t.small, styles.cell]}>{e.tools.join(', ') || 'No tools listed'}</Text>
              <Badge label={badge.label} tone={badge.tone} />
            </View>
          );
        })}
      </Panel>
    </Shell>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: 14 },
  half: { flexGrow: 1, flexBasis: 340 },
  link: { fontFamily: 'Manrope_700Bold', fontSize: 13, color: d.blue },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: d.line,
  },
  cell: { flexGrow: 1, flexShrink: 1, flexBasis: 160, minWidth: 0 },
});
