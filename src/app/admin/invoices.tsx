import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Chip, d, DButton, Empty, Field, Panel, Shell, t, Tone } from '../../components/dash';
import { ADMIN_NAV } from '../../components/nav';
import { useStore } from '../../data/store';
import { InvoiceStatus } from '../../data/types';
import { formatDate } from '../../lib/events';
import { money } from './talent';

const BADGE: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'gray' },
  sent: { label: 'Sent', tone: 'warn' },
  paid: { label: 'Paid', tone: 'good' },
};

/** Create invoices for client placements and track them to paid. */
export default function AdminInvoices() {
  const store = useStore();
  const approved = store.talents.filter((p) => p.status === 'approved');
  const [company, setCompany] = useState('');
  const [talentId, setTalentId] = useState('');
  const [period, setPeriod] = useState('');
  const [amount, setAmount] = useState('');

  const value = Number(amount.replace(/[^0-9.]/g, ''));
  const valid = company.trim() !== '' && talentId !== '' && period.trim() !== '' && value > 0;
  const total = (status: InvoiceStatus) =>
    store.invoices.filter((i) => i.status === status).reduce((sum, i) => sum + i.amount, 0);

  function create() {
    store.addInvoice({ company: company.trim(), talentId, period: period.trim(), amount: value });
    setCompany('');
    setPeriod('');
    setAmount('');
  }

  return (
    <Shell title="Invoices" subtitle="Bill clients for their placements" nav={ADMIN_NAV}>
      <View style={t.grid}>
        <Panel title="New invoice" style={styles.form}>
          <View style={styles.fields}>
            <Field label="Client company" value={company} onChangeText={setCompany} placeholder="Stellar SaaS" />
            <Field label="Billing period" value={period} onChangeText={setPeriod} placeholder="November 2026" />
            <Field label="Amount (USD)" value={amount} onChangeText={setAmount} placeholder="4200" keyboardType="numeric" />
          </View>
          <Text style={styles.label}>Professional</Text>
          <View style={t.rowWrap}>
            {approved.map((p) => (
              <Chip key={p.id} label={p.name} selected={talentId === p.id} onPress={() => setTalentId(p.id)} />
            ))}
          </View>
          <DButton label="Create draft invoice" icon="add" onPress={create} disabled={!valid} style={styles.create} />
        </Panel>

        <Panel title="Totals" style={styles.totals}>
          {(['draft', 'sent', 'paid'] as InvoiceStatus[]).map((st) => (
            <View key={st} style={styles.totalRow}>
              <Badge label={BADGE[st].label} tone={BADGE[st].tone} />
              <Text style={styles.totalValue}>{money(total(st))}</Text>
            </View>
          ))}
        </Panel>
      </View>

      <Panel title="All invoices" style={styles.list}>
        {store.invoices.length === 0 && <Empty>No invoices yet.</Empty>}
        {store.invoices.map((i) => {
          const talent = store.talents.find((p) => p.id === i.talentId);
          return (
            <View key={i.id} style={styles.row}>
              <View style={styles.cell}>
                <Text style={t.strong}>{i.number}</Text>
                <Text style={t.small}>{formatDate(i.issuedAt)}</Text>
              </View>
              <View style={[styles.cell, styles.cellWide]}>
                <Text style={t.strong}>{i.company}</Text>
                <Text style={t.small}>
                  {talent?.name ?? 'Unknown'} · {i.period}
                </Text>
              </View>
              <Text style={[t.strong, styles.amount]}>{money(i.amount)}</Text>
              <Badge label={BADGE[i.status].label} tone={BADGE[i.status].tone} />
              {i.status === 'draft' && (
                <DButton label="Mark sent" icon="send" variant="soft" small onPress={() => store.setInvoiceStatus(i.id, 'sent')} />
              )}
              {i.status === 'sent' && (
                <DButton label="Mark paid" icon="checkmark" small onPress={() => store.setInvoiceStatus(i.id, 'paid')} />
              )}
            </View>
          );
        })}
      </Panel>
    </Shell>
  );
}

const styles = StyleSheet.create({
  form: { flexGrow: 2, flexBasis: 420 },
  totals: { flexGrow: 1, flexBasis: 240 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  label: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: d.body, marginTop: 14, marginBottom: 8 },
  create: { marginTop: 16 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: d.line,
  },
  totalValue: { fontFamily: 'Manrope_800ExtraBold', fontSize: 20, letterSpacing: -0.4, color: d.ink },
  list: { marginTop: 14 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: d.line,
  },
  cell: { flexGrow: 1, flexShrink: 1, flexBasis: 120, minWidth: 0 },
  cellWide: { flexGrow: 2, flexBasis: 220 },
  amount: { minWidth: 80, textAlign: 'right' },
});
