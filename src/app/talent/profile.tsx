import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Chip, d, DButton, Empty, Field, Panel, Shell, t, Tone } from '../../components/dash';
import { TALENT_NAV } from '../../components/nav';
import { Video } from '../../components/Video';
import { uid, useStore } from '../../data/store';
import { videoUrl } from '../../lib/supabase';
import { Education, Experience, ROLES, Talent, TalentStatus } from '../../data/types';

const STATUS: Record<TalentStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'gray' },
  pending: { label: 'Under review', tone: 'warn' },
  approved: { label: 'Approved', tone: 'good' },
  rejected: { label: 'Needs changes', tone: 'bad' },
};

/** The professional's profile: video intro, personal info, and what makes them the right fit. */
export default function Profile() {
  const store = useStore();
  const me = store.me;
  const [uploading, setUploading] = useState(false);

  if (!me) {
    return (
      <Shell title="My profile" subtitle="Show clients why you are the right fit" nav={TALENT_NAV}>
        <Empty>Your profile is not available. Please sign out and sign in again.</Empty>
      </Shell>
    );
  }

  const set = (patch: Partial<Talent>) => store.updateTalent(me.id, patch);
  const canSubmit = (me.status === 'draft' || me.status === 'rejected') && me.name.trim() !== '' && me.role !== '';

  async function pickVideo() {
    if (!me) return;
    const picked = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
    if (picked.canceled) return;
    setUploading(true);
    await store.uploadVideo(me, picked.assets[0]);
    setUploading(false);
  }

  return (
    <Shell
      title="My profile"
      subtitle="Show clients why you are the right fit. Changes save as you type."
      nav={TALENT_NAV}
      right={
        <View style={t.rowWrap}>
          <Badge label={STATUS[me.status].label} tone={STATUS[me.status].tone} />
          {(me.status === 'draft' || me.status === 'rejected') && (
            <DButton
              label="Submit for approval"
              icon="send"
              small
              disabled={!canSubmit}
              onPress={() => store.setTalentStatus(me.id, 'pending')}
            />
          )}
        </View>
      }
    >
      <View style={t.grid}>
        <View style={styles.colNarrow}>
          <Panel title="60-second video intro">
            <Video
              url={videoUrl(me.videoPath)}
              emptyText="Add a short video (up to 50 MB). Say who you are and how you help."
            />
            <DButton
              label={uploading ? 'Uploading…' : me.videoName ? 'Replace video' : 'Upload video'}
              disabled={uploading}
              icon="cloud-upload-outline"
              variant="soft"
              onPress={pickVideo}
              style={styles.upload}
            />
          </Panel>

          <Panel title="Personal info">
            <View style={styles.identity}>
              <Avatar name={me.name} size={52} />
              <View style={t.grow}>
                <Text style={t.strong}>{me.name || 'Your name'}</Text>
                <Text style={t.small}>{me.location || 'Your city, Puerto Rico'}</Text>
              </View>
            </View>
            <View style={styles.fields}>
              <Field label="Full name" value={me.name} onChangeText={(name) => set({ name })} />
              <Field label="Email" value={me.email} onChangeText={(email) => set({ email })} keyboardType="email-address" />
              <Field label="Phone" value={me.phone} onChangeText={(phone) => set({ phone })} keyboardType="phone-pad" />
              <Field label="Location" value={me.location} onChangeText={(location) => set({ location })} placeholder="San Juan, Puerto Rico" />
            </View>
          </Panel>
        </View>

        <View style={styles.colWide}>
          <Panel title="Role and pitch">
            <Text style={styles.label}>The role you want</Text>
            <View style={t.rowWrap}>
              {ROLES.map((role) => (
                <Chip key={role} label={role} selected={me.role === role} onPress={() => set({ role })} />
              ))}
            </View>
            <View style={styles.fields}>
              <Field
                label="Headline"
                value={me.headline}
                onChangeText={(headline) => set({ headline })}
                placeholder="One line a client will remember"
                style={styles.full}
              />
              <Field
                label="Why you are the perfect fit"
                value={me.bio}
                onChangeText={(bio) => set({ bio })}
                placeholder="What you do best and the results you have delivered"
                multiline
                style={styles.full}
              />
            </View>
          </Panel>

          <Panel title="Skills">
            <Text style={[t.small, styles.hint]}>Solimar verifies your skills when your profile is approved.</Text>
            <TagEditor
              items={me.skills.map((k) => k.name)}
              verified={me.skills.filter((k) => k.verified).map((k) => k.name)}
              placeholder="Add a skill, like Jira or Calendar management"
              onAdd={(name) => set({ skills: [...me.skills, { name, verified: false }] })}
              onRemove={(name) => set({ skills: me.skills.filter((k) => k.name !== name) })}
            />
          </Panel>

          <Panel title="Qualities">
            <TagEditor
              items={me.qualities}
              placeholder="Add a quality, like Calm under pressure"
              onAdd={(q) => set({ qualities: [...me.qualities, q] })}
              onRemove={(q) => set({ qualities: me.qualities.filter((x) => x !== q) })}
            />
          </Panel>

          <Panel
            title="Experience"
            action={
              <DButton
                label="Add"
                icon="add"
                variant="soft"
                small
                onPress={() =>
                  set({ experience: [...me.experience, { id: uid(), company: '', title: '', period: '', summary: '' }] })
                }
              />
            }
          >
            {me.experience.length === 0 && <Empty>Add the jobs that show you can do this role.</Empty>}
            {me.experience.map((x) => {
              const edit = (patch: Partial<Experience>) =>
                set({ experience: me.experience.map((e) => (e.id === x.id ? { ...e, ...patch } : e)) });
              return (
                <View key={x.id} style={[t.item, styles.entry]}>
                  <View style={styles.fields}>
                    <Field label="Job title" value={x.title} onChangeText={(title) => edit({ title })} />
                    <Field label="Company" value={x.company} onChangeText={(company) => edit({ company })} />
                    <Field label="Dates" value={x.period} onChangeText={(period) => edit({ period })} placeholder="2021 – 2025" />
                    <Field
                      label="What you did"
                      value={x.summary}
                      onChangeText={(summary) => edit({ summary })}
                      multiline
                      style={styles.full}
                    />
                  </View>
                  <DButton
                    label="Remove"
                    icon="trash-outline"
                    variant="danger"
                    small
                    onPress={() => set({ experience: me.experience.filter((e) => e.id !== x.id) })}
                    style={styles.remove}
                  />
                </View>
              );
            })}
          </Panel>

          <Panel
            title="Education"
            action={
              <DButton
                label="Add"
                icon="add"
                variant="soft"
                small
                onPress={() => set({ education: [...me.education, { id: uid(), school: '', degree: '', year: '' }] })}
              />
            }
          >
            {me.education.length === 0 && <Empty>Add your degrees and certificates.</Empty>}
            {me.education.map((ed) => {
              const edit = (patch: Partial<Education>) =>
                set({ education: me.education.map((e) => (e.id === ed.id ? { ...e, ...patch } : e)) });
              return (
                <View key={ed.id} style={[t.item, styles.entry]}>
                  <View style={styles.fields}>
                    <Field label="Degree or certificate" value={ed.degree} onChangeText={(degree) => edit({ degree })} />
                    <Field label="School" value={ed.school} onChangeText={(school) => edit({ school })} />
                    <Field label="Year" value={ed.year} onChangeText={(year) => edit({ year })} keyboardType="numeric" />
                  </View>
                  <DButton
                    label="Remove"
                    icon="trash-outline"
                    variant="danger"
                    small
                    onPress={() => set({ education: me.education.filter((e) => e.id !== ed.id) })}
                    style={styles.remove}
                  />
                </View>
              );
            })}
          </Panel>
        </View>
      </View>
    </Shell>
  );
}

function TagEditor({
  items,
  verified = [],
  placeholder,
  onAdd,
  onRemove,
}: {
  items: string[];
  verified?: string[];
  placeholder: string;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
}) {
  const [draft, setDraft] = useState('');
  function add() {
    const value = draft.trim();
    if (!value || items.some((i) => i.toLowerCase() === value.toLowerCase())) return;
    onAdd(value);
    setDraft('');
  }
  return (
    <>
      <View style={t.rowWrap}>
        {items.map((item) => (
          <Chip key={item} label={item} verified={verified.includes(item)} onRemove={() => onRemove(item)} />
        ))}
      </View>
      <View style={styles.tagAdd}>
        <Field label={placeholder} value={draft} onChangeText={setDraft} />
        <DButton label="Add" icon="add" variant="soft" onPress={add} disabled={!draft.trim()} style={styles.tagBtn} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  colNarrow: { flexGrow: 1, flexShrink: 1, flexBasis: 300, minWidth: 0, gap: 14 },
  colWide: { flexGrow: 2, flexShrink: 1, flexBasis: 440, minWidth: 0, gap: 14 },
  upload: { marginTop: 12, alignSelf: 'stretch' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  full: { flexBasis: '100%' },
  label: { fontFamily: 'Manrope_600SemiBold', fontSize: 12, color: d.body, marginBottom: 8 },
  hint: { marginBottom: 10, marginTop: -6 },
  entry: { marginBottom: 10 },
  remove: { marginTop: 10 },
  tagAdd: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12 },
  tagBtn: { alignSelf: 'flex-end' },
});
