import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import Head from 'expo-router/head';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { d, DButton, Field, pageBackground, Panel, t } from '../components/dash';
import { SunMark } from '../components/SunMark';
import { useStore } from '../data/store';
import { font } from '../theme';

/** Sign in for professionals and the Naboria team. New professionals create their account here. */
export default function Login() {
  const store = useStore();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  if (store.ready && store.session && store.role) {
    return <Redirect href={store.role === 'admin' ? '/admin' : '/talent'} />;
  }

  async function submit() {
    setError('');
    setNotice('');
    if (!email.trim() || password.length < 8) {
      setError('Enter your email and a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    if (mode === 'in') {
      setError(await store.signIn(email, password));
    } else {
      const res = await store.signUp(email, password);
      setError(res.error);
      if (res.needsConfirmation) {
        setNotice('Check your email and click the link to confirm your account. Then sign in here.');
        setMode('in');
        setPassword('');
      }
    }
    setBusy(false);
  }

  return (
    <ScrollView style={[styles.page, pageBackground]} contentContainerStyle={styles.content}>
      <Head>
        <title>Sign in | Naboria</title>
        <meta name="robots" content="noindex" />
      </Head>

      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <SunMark size={24} color="#FFFFFF" detail={d.blue} />
        </View>
        <Text style={styles.brandName}>Naboria</Text>
      </View>

      <Panel style={styles.card}>
        <Text role="heading" aria-level={1} style={styles.title}>
          {mode === 'in' ? 'Sign in' : 'Create your account'}
        </Text>
        <Text style={t.text}>
          {mode === 'in'
            ? 'For Naboria professionals and the Naboria team.'
            : 'For professionals in Puerto Rico who want to be matched with U.S. companies.'}
        </Text>

        <View style={styles.fields}>
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field label="Password" value={password} onChangeText={setPassword} secure onSubmit={submit} />
        </View>

        {!!error && (
          <Text style={styles.error} role="alert">
            {error}
          </Text>
        )}
        {!!notice && (
          <Text style={styles.notice} aria-live="polite">
            {notice}
          </Text>
        )}

        <DButton
          label={busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
          onPress={submit}
          disabled={busy}
          style={styles.submit}
        />

        <Pressable onPress={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(''); }} role="button" style={styles.switch}>
          <Text style={styles.switchText}>
            {mode === 'in' ? 'New professional? Create an account' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: d.bg },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 18 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: d.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontFamily: font.extrabold, fontSize: 20, letterSpacing: -0.4, color: d.ink },
  card: { width: '100%', maxWidth: 420, padding: 26, flexShrink: 0 },
  title: { fontFamily: font.extrabold, fontSize: 24, letterSpacing: -0.5, color: d.ink, marginBottom: 4 },
  fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  error: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: d.bad, marginTop: 12 },
  notice: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: d.good, marginTop: 12 },
  submit: { alignSelf: 'stretch', paddingVertical: 14, marginTop: 18 },
  switch: { alignSelf: 'center', marginTop: 14, padding: 6 },
  switchText: { fontFamily: font.bold, fontSize: 14, color: d.blue },
});
