import Head from 'expo-router/head';
import { ComponentRef, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LeadForm, LeadFormHandle } from '../components/LeadForm';
import { Bullet, Button, Card, Container, Eyebrow, H2, Lead, Mark, Section } from '../components/ui';
import { color, fluid, font, radius, webOnly } from '../theme';

const TITLE = 'Solimar | Bilingual U.S. operations talent from Puerto Rico';
const DESCRIPTION =
  'Hire bilingual executive assistants, operations coordinators, and onboarding specialists in Puerto Rico. U.S. talent, your work hours, a fraction of mainland cost.';

const FACTS = [
  { value: '0–1 hr', label: 'from Eastern Time, all year' },
  { value: '2', label: 'native languages: English and Spanish' },
  { value: 'U.S.', label: 'law, courts, and IP protection' },
  { value: 'USD', label: 'payroll. No currency risk' },
];

// Shared hours between a 9-to-5 local workday and a 9-to-5 day in New York.
const OVERLAP = [
  { place: 'San Juan, Puerto Rico', hours: 8, label: '7–8 hrs', highlight: true },
  { place: 'Kraków, Poland', hours: 2, label: '2 hrs' },
  { place: 'Manila, Philippines', hours: 0, label: '0 hrs' },
];

const REASONS = [
  {
    n: '01',
    title: 'Native English and Spanish',
    offshore: 'Language gaps and heavy accents slow calls and cost you client trust.',
    pr: 'Your hire speaks both languages like a native. They can lead a Zoom with a U.S. client, then switch to Spanish for Latin America.',
  },
  {
    n: '02',
    title: 'Your hours. Your culture.',
    offshore: 'A team 12 time zones away answers tomorrow. Small choices take days.',
    pr: 'Your hire works the same day you do. They know U.S. business manners, idioms, and pace from day one.',
  },
  {
    n: '03',
    title: 'U.S. legal framework',
    offshore: 'Foreign payroll rules, tax traps, and contracts that are hard to enforce.',
    pr: 'Puerto Rico is a U.S. territory. Your work is covered by U.S. federal law, U.S. courts, and U.S. IP rules.',
  },
  {
    n: '04',
    title: 'The human work AI can’t do',
    offshore: 'Data entry and basic scripts are the first jobs software takes over.',
    pr: 'Our people do the work that needs judgment: caring for clients, moving projects across teams, and reading the room.',
  },
];

const ROLES = [
  {
    title: 'Executive Assistant / Chief of Staff',
    blurb: 'A right hand who protects your time and keeps leaders in sync.',
    points: ['Calendar, inbox, and travel', 'Meeting prep and follow-ups', 'Special projects and reporting'],
  },
  {
    title: 'Digital Operations & Project Coordinator',
    blurb: 'Keeps work moving in the tools your team already uses.',
    points: ['Runs Jira, Notion, and Asana', 'Tracks owners, dates, and blockers', 'Clear status updates every week'],
  },
  {
    title: 'Client Onboarding & Implementation Specialist',
    blurb: 'Turns new customers into happy, active ones.',
    points: ['Kickoff calls and setup', 'Training in English or Spanish', 'One point of contact for each client'],
  },
];

const COMPARE_ROWS = ['Lower cost', 'Works your hours', 'Native English', 'U.S. legal framework'];
const COMPARE = [
  { name: 'Mainland hire', values: [false, true, true, true] },
  { name: 'Offshore agency', values: [true, false, false, false] },
  { name: 'Puerto Rico with Solimar', values: [true, true, true, true], highlight: true },
];

const STEPS = [
  { n: '1', title: 'Talk to our team', text: 'Tell us the role, your tools, and how your team works.' },
  { n: '2', title: 'Meet your matches', text: 'We introduce vetted, bilingual professionals. You interview and choose.' },
  { n: '3', title: 'Start working', text: 'Your hire joins your team, on your hours. We run payroll and paperwork.' },
];

export default function Landing() {
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const form = useRef<LeadFormHandle>(null);
  const formY = useRef(0);

  function goToForm() {
    scroller.current?.scrollTo({ y: Math.max(formY.current - 24, 0), animated: true });
    setTimeout(() => form.current?.focus(), 500);
  }

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:type" content="website" />
      </Head>

      <ScrollView ref={scroller} style={styles.page} contentContainerStyle={styles.pageContent}>
        {/* ───────── Hero ───────── */}
        <View style={styles.hero}>
          <View style={[styles.glow, webOnly(glowWeb)]} aria-hidden />

          <Container style={styles.topbar}>
            <View style={styles.brand}>
              <View style={styles.brandMark} />
              <Text style={styles.brandName}>Solimar</Text>
            </View>
            <Button label="Talk to our team" onPress={goToForm} size="sm" />
          </Container>

          <Container style={styles.heroInner}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>U.S. talent · Based in Puerto Rico</Text>
            </View>

            <Text role="heading" aria-level={1} style={styles.h1}>
              Hire your first <Mark>bilingual operations pro</Mark> in weeks, without the offshore friction
            </Text>

            <Text style={styles.heroSub}>
              We connect mainland U.S. companies with English-speaking professionals in Puerto Rico. Native
              English and Spanish. Your work hours. U.S. law. A fraction of mainland cost.
            </Text>

            <Button label="Talk to our team" onPress={goToForm} size="lg" style={styles.heroCta} />
            <Text style={styles.heroFine}>Free call · No commitment</Text>
          </Container>

          <Container>
            <View style={styles.facts}>
              {FACTS.map((f) => (
                <View key={f.value} style={styles.fact}>
                  <Text style={styles.factValue}>{f.value}</Text>
                  <Text style={styles.factLabel}>{f.label}</Text>
                </View>
              ))}
            </View>
          </Container>
        </View>

        {/* ───────── Why Puerto Rico ───────── */}
        <Section>
          <Eyebrow>Why Puerto Rico</Eyebrow>
          <H2>
            Puerto Rico has a rare <Mark>superpower</Mark>: U.S. professionals who work in two languages, on your
            clock.
          </H2>

          <View style={styles.row}>
            <Card style={styles.whyCard}>
              <Text style={styles.cardTitle}>What you get</Text>
              <Bullet>Native English and Spanish, with a clear, neutral accent</Bullet>
              <Bullet>The same U.S. business culture as your team</Bullet>
              <Bullet>A work day that lines up with the East Coast</Bullet>
              <Bullet>U.S. legal and IP protection</Bullet>
            </Card>

            <Card style={styles.overlapCard}>
              <Text style={styles.cardTitle}>Work hours shared with New York</Text>
              <Text style={styles.cardNote}>Out of a normal 8-hour day, 9 to 5 local time.</Text>
              <View style={styles.bars}>
                {OVERLAP.map((o) => (
                  <View key={o.place} style={styles.barRow}>
                    <View style={styles.barHead}>
                      <Text style={[styles.barPlace, o.highlight && styles.barPlaceOn]}>{o.place}</Text>
                      <Text style={[styles.barValue, o.highlight && styles.barPlaceOn]}>{o.label}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${(o.hours / 8) * 100}%` },
                          o.highlight && styles.barFillOn,
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        </Section>

        {/* ───────── The four differences ───────── */}
        <Section tinted>
          <Eyebrow>The difference</Eyebrow>
          <H2>Four problems with offshore hiring. Puerto Rico solves each one.</H2>

          <View style={styles.row}>
            {REASONS.map((r) => (
              <Card key={r.n} style={styles.reasonCard}>
                <Text style={styles.reasonN}>{r.n}</Text>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.tagBad}>Offshore</Text>
                <Bullet tone="bad">{r.offshore}</Bullet>
                <Text style={styles.tagGood}>Puerto Rico</Text>
                <Bullet>{r.pr}</Bullet>
              </Card>
            ))}
          </View>
        </Section>

        {/* ───────── Roles ───────── */}
        <Section>
          <Eyebrow>Roles we fill</Eyebrow>
          <H2>Start with the roles that keep your company running.</H2>
          <Lead>Operations, project coordination, and executive support. One great hire gives your whole team time back.</Lead>

          <View style={styles.row}>
            {ROLES.map((role, i) => (
              <Card key={role.title} style={styles.roleCard}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardNote}>{role.blurb}</Text>
                <View style={styles.rolePoints}>
                  {role.points.map((p) => (
                    <Bullet key={p} tone="accent">
                      {p}
                    </Bullet>
                  ))}
                </View>
              </Card>
            ))}
          </View>

          <Button label="Talk to our team" onPress={goToForm} size="lg" style={styles.midCta} />
        </Section>

        {/* ───────── Cost vs quality ───────── */}
        <Section tinted>
          <Eyebrow>Cost and quality</Eyebrow>
          <H2>
            Stop choosing between <Mark>cost</Mark> and <Mark>quality</Mark>.
          </H2>
          <Lead>
            You don’t have to burn cash on mainland payroll or fight the friction of overseas outsourcing.
          </Lead>

          <View style={styles.row}>
            {COMPARE.map((c) => (
              <Card key={c.name} style={[styles.compareCard, c.highlight && styles.compareCardOn]}>
                <Text style={[styles.cardTitle, c.highlight && styles.onDark]}>{c.name}</Text>
                <View style={styles.compareRows}>
                  {COMPARE_ROWS.map((label, i) => (
                    <View key={label} style={styles.compareRow}>
                      <View
                        style={[
                          styles.compareDot,
                          { backgroundColor: c.values[i] ? color.goodSoft : color.badSoft },
                        ]}
                      >
                        <Text style={[styles.compareGlyph, { color: c.values[i] ? color.good : color.bad }]}>
                          {c.values[i] ? '✓' : '✕'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.compareLabel,
                          c.highlight && styles.onDark,
                          !c.values[i] && styles.compareLabelOff,
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </Section>

        {/* ───────── How it works ───────── */}
        <Section>
          <Eyebrow>How it works</Eyebrow>
          <H2>Three steps to your new hire.</H2>

          <View style={styles.row}>
            {STEPS.map((s) => (
              <View key={s.n} style={styles.step}>
                <Text style={styles.stepN}>{s.n}</Text>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardNote}>{s.text}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ───────── Final CTA + form ───────── */}
        <View
          style={styles.final}
          onLayout={(e) => {
            formY.current = e.nativeEvent.layout.y;
          }}
        >
          <View style={[styles.glow, styles.glowFinal, webOnly(glowWeb)]} aria-hidden />
          <Container style={styles.finalInner}>
            <View style={styles.finalCopy}>
              <Eyebrow>Talk to our team</Eyebrow>
              <H2>Ready to scale your team without the friction?</H2>
              <Lead>
                Tell us what you need. We will show you how a bilingual professional in Puerto Rico can fill the
                role.
              </Lead>
              <View style={styles.finalPoints}>
                <Bullet>Free call, no commitment</Bullet>
                <Bullet>Top talent in your time zone</Bullet>
                <Bullet>A fraction of mainland cost</Bullet>
                <Bullet>We handle payroll and paperwork</Bullet>
              </View>
            </View>
            <View style={styles.finalForm}>
              <LeadForm ref={form} />
            </View>
          </Container>
        </View>

        <Container style={styles.footer}>
          <Text style={styles.footerText}>© {new Date().getFullYear()} Solimar. U.S. talent, based in Puerto Rico.</Text>
        </Container>
      </ScrollView>
    </>
  );
}

const glowWeb = {
  backgroundImage:
    'radial-gradient(40% 55% at 30% 35%, rgba(196,170,255,0.85) 0%, rgba(196,170,255,0) 70%),' +
    'radial-gradient(35% 50% at 68% 30%, rgba(255,196,214,0.8) 0%, rgba(255,196,214,0) 70%),' +
    'radial-gradient(40% 50% at 55% 70%, rgba(255,232,170,0.75) 0%, rgba(255,232,170,0) 70%)',
  filter: 'blur(30px)',
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.bg },
  pageContent: { flexGrow: 1 },

  // Hero
  hero: { overflow: 'hidden', paddingBottom: fluid(40, 6, 72, 40) },
  glow: {
    position: 'absolute',
    top: -80,
    left: 0,
    right: 0,
    height: 640,
    opacity: 0.9,
    pointerEvents: 'none',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.accent,
    borderWidth: 5,
    borderColor: '#FFC56B',
  },
  brandName: { fontFamily: font.extrabold, fontSize: 19, letterSpacing: -0.4, color: color.ink },
  heroInner: { alignItems: 'center', paddingTop: fluid(36, 6, 72, 36) },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 22,
  },
  heroPillText: { fontFamily: font.semibold, fontSize: 13, color: color.body },
  h1: {
    fontFamily: font.extrabold,
    fontSize: fluid(34, 6.2, 64, 36),
    lineHeight: fluid(42, 7.3, 76, 44),
    letterSpacing: -1.4,
    color: color.ink,
    textAlign: 'center',
    maxWidth: 920,
  },
  heroSub: {
    fontFamily: font.medium,
    fontSize: fluid(16, 2, 19, 16),
    lineHeight: fluid(26, 3.1, 30, 26),
    color: color.body,
    textAlign: 'center',
    maxWidth: 640,
    marginTop: 22,
  },
  heroCta: { alignSelf: 'center', marginTop: 30 },
  heroFine: { fontFamily: font.semibold, fontSize: 13, color: color.muted, marginTop: 12 },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: fluid(40, 6, 64, 40),
  },
  fact: {
    flexGrow: 1,
    flexBasis: 150,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.md,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  factValue: { fontFamily: font.extrabold, fontSize: 30, letterSpacing: -0.8, color: color.ink },
  factLabel: { fontFamily: font.medium, fontSize: 14, lineHeight: 20, color: color.body, marginTop: 4 },

  // Shared layout
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 36 },
  cardTitle: { fontFamily: font.bold, fontSize: 19, lineHeight: 26, letterSpacing: -0.3, color: color.ink },
  cardNote: { fontFamily: font.medium, fontSize: 15, lineHeight: 23, color: color.body, marginTop: 6 },
  onDark: { color: '#FFFFFF' },

  // Why
  whyCard: { flexGrow: 1, flexBasis: 300, backgroundColor: color.tint, borderColor: color.accentSoft },
  overlapCard: { flexGrow: 2, flexBasis: 380 },
  bars: { marginTop: 18, gap: 18 },
  barRow: { gap: 8 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  barPlace: { fontFamily: font.semibold, fontSize: 15, color: color.body },
  barValue: { fontFamily: font.bold, fontSize: 15, color: color.body },
  barPlaceOn: { color: color.ink },
  barTrack: { height: 14, borderRadius: 7, backgroundColor: '#EFEDF5', overflow: 'hidden' },
  barFill: { height: 14, borderRadius: 7, backgroundColor: '#B9B4CC' },
  barFillOn: { backgroundColor: color.accent },

  // Reasons
  reasonCard: { flexGrow: 1, flexBasis: 420 },
  reasonN: { fontFamily: font.extrabold, fontSize: 14, color: color.accent, marginBottom: 8 },
  tagBad: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.bad,
    marginTop: 18,
  },
  tagGood: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: color.good,
    marginTop: 18,
  },

  // Roles
  roleCard: { flexGrow: 1, flexBasis: 300 },
  roleBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleBadgeText: { fontFamily: font.extrabold, fontSize: 15, color: color.accent },
  rolePoints: { marginTop: 8 },
  midCta: { marginTop: 36 },

  // Compare
  compareCard: { flexGrow: 1, flexBasis: 280 },
  compareCardOn: { backgroundColor: color.ink, borderColor: color.ink },
  compareRows: { marginTop: 14, gap: 12 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compareDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  compareGlyph: { fontFamily: font.extrabold, fontSize: 12, lineHeight: 15 },
  compareLabel: { fontFamily: font.semibold, fontSize: 15, color: color.ink },
  compareLabelOff: { opacity: 0.55, textDecorationLine: 'line-through' },

  // Steps
  step: {
    flexGrow: 1,
    flexBasis: 260,
    flexShrink: 1,
    minWidth: 0,
    borderTopWidth: 2,
    borderTopColor: color.ink,
    paddingTop: 18,
  },
  stepN: { fontFamily: font.extrabold, fontSize: 40, letterSpacing: -1, color: color.accent, marginBottom: 6 },

  // Final
  final: { overflow: 'hidden', paddingVertical: fluid(56, 8, 96, 56) },
  glowFinal: { top: 0, height: 700, opacity: 0.6 },
  finalInner: { flexDirection: 'row', flexWrap: 'wrap', gap: 40, alignItems: 'center' },
  finalCopy: { flexGrow: 1, flexBasis: 340, flexShrink: 1, minWidth: 0 },
  finalPoints: { marginTop: 14 },
  finalForm: { flexGrow: 1, flexBasis: 340, flexShrink: 1, minWidth: 0, maxWidth: 480 },

  footer: { paddingVertical: 28, borderTopWidth: 1, borderTopColor: color.line },
  footerText: { fontFamily: font.medium, fontSize: 13, color: color.muted, textAlign: 'center' },
});
