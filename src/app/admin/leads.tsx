import { StyleSheet, Text, View } from 'react-native';

import { Badge, Chip, d, Empty, Panel, Shell, t, Tone } from '../../components/dash';
import { ADMIN_NAV } from '../../components/nav';
import { useStore } from '../../data/store';
import { LeadStatus } from '../../data/types';
import { formatDate } from '../../lib/events';

const STATUSES: { value: LeadStatus; label: string; tone: Tone }[] = [
  { value: 'new', label: 'New', tone: 'blue' },
  { value: 'contacted', label: 'Contacted', tone: 'warn' },
  { value: 'qualified', label: 'Qualified', tone: 'good' },
  { value: 'closed', label: 'Closed', tone: 'gray' },
];

/** Leads from the "Schedule a call" form on the landing page. */
export default function AdminLeads() {
  const store = useStore();
  return (
    <Shell title="Leads" subtitle="Companies that asked to talk to the team" nav={ADMIN_NAV}>
      <Panel title={`${store.leads.length} leads`}>
        {store.leads.length === 0 && <Empty>No leads yet. They appear here when someone fills out the form.</Empty>}
        {store.leads.map((l) => {
          const current = STATUSES.find((x) => x.value === l.status) ?? STATUSES[0];
          return (
            <View key={l.id} style={styles.row}>
              <View style={styles.who}>
                <Text style={t.strong}>{l.name}</Text>
                <Text style={t.small}>{l.email}</Text>
                <Text style={t.small}>{formatDate(l.receivedAt)}</Text>
              </View>
              <View style={styles.notes}>
                <Text style={t.text}>{l.notes || 'No notes.'}</Text>
              </View>
              <View style={styles.status}>
                <Badge label={current.label} tone={current.tone} />
                <View style={[t.rowWrap, styles.move]}>
                  {STATUSES.filter((x) => x.value !== l.status).map((x) => (
                    <Chip key={x.value} label={`Mark ${x.label.toLowerCase()}`} onPress={() => store.setLeadStatus(l.id, x.value)} />
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </Panel>
    </Shell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: d.line,
  },
  who: { flexGrow: 1, flexShrink: 1, flexBasis: 200, minWidth: 0 },
  notes: { flexGrow: 2, flexShrink: 1, flexBasis: 260, minWidth: 0 },
  status: { flexGrow: 1, flexShrink: 1, flexBasis: 240, minWidth: 0 },
  move: { marginTop: 8 },
});
