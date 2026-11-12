import { ComponentRef, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../lib/supabase';
import { color, font, radius } from '../theme';
import { Button } from './ui';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ENDPOINT = process.env.EXPO_PUBLIC_LEAD_ENDPOINT ?? '/api/lead';

export type LeadFormHandle = { focus: () => void };

type Status = 'idle' | 'sending' | 'done';

/**
 * "Schedule a call" form with progressive disclosure:
 * step 1 asks only for a work email, step 2 reveals name + notes.
 */
export const LeadForm = forwardRef<LeadFormHandle>(function LeadForm(_props, ref) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [trap, setTrap] = useState(''); // honeypot, hidden from people
  const [error, setError] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);

  useImperativeHandle(ref, () => ({
    focus: () => (step === 1 ? emailRef.current?.focus() : nameRef.current?.focus()),
  }));

  function next() {
    if (!EMAIL.test(email.trim())) {
      setError('Please enter a valid work email.');
      return;
    }
    setError('');
    setStep(2);
    setTimeout(() => nameRef.current?.focus(), 50);
  }

  async function submit() {
    if (!name.trim()) {
      setError('Please tell us your name.');
      return;
    }
    setError('');
    setStatus('sending');
    try {
      const lead = { name: name.trim(), email: email.trim(), notes: notes.trim() };
      // A filled honeypot means a bot: show success, save nothing.
      if (!trap) {
        const { error: failed } = await supabase.from('leads').insert(lead);
        if (failed) throw failed;
        // Optional notification (Slack, CRM). The lead is already saved, so a failure here is not shown.
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        }).catch(() => {});
      }
      setStatus('done');
    } catch {
      setStatus('idle');
      setError('We could not send your request. Please try again in a moment.');
    }
  }

  if (status === 'done') {
    return (
      <View style={styles.box} aria-live="polite">
        <View style={styles.doneBadge}>
          <Text style={styles.doneGlyph}>✓</Text>
        </View>
        <Text style={styles.title}>Thanks, {name.trim().split(' ')[0]}. We got it.</Text>
        <Text style={styles.sub}>
          We will email {email.trim()} to set up a time to talk.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Schedule a call</Text>
      <Text style={styles.sub}>
        {step === 1 ? 'Start with your work email.' : 'Two more details and you are done.'}
      </Text>

      <Text style={styles.label} nativeID="lead-email-label">
        Work email
      </Text>
      <TextInput
        ref={emailRef}
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={step === 1 ? next : undefined}
        placeholder="you@company.com"
        placeholderTextColor={color.muted}
        keyboardType="email-address"
        inputMode="email"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        returnKeyType={step === 1 ? 'next' : 'default'}
        aria-labelledby="lead-email-label"
        style={styles.input}
      />

      {step === 2 && (
        <>
          <Text style={styles.label} nativeID="lead-name-label">
            Name
          </Text>
          <TextInput
            ref={nameRef}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={color.muted}
            autoComplete="name"
            aria-labelledby="lead-name-label"
            style={styles.input}
          />

          <Text style={styles.label} nativeID="lead-notes-label">
            Things we should know <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="The role you need, your tools, your timeline…"
            placeholderTextColor={color.muted}
            multiline
            numberOfLines={4}
            aria-labelledby="lead-notes-label"
            style={[styles.input, styles.textarea]}
          />

          {/* Honeypot field: off-screen and skipped by keyboard and screen readers. */}
          <View style={styles.trap} aria-hidden>
            <TextInput value={trap} onChangeText={setTrap} tabIndex={-1} autoComplete="off" />
          </View>
        </>
      )}

      {!!error && (
        <Text style={styles.error} role="alert">
          {error}
        </Text>
      )}

      <Button
        label={step === 1 ? 'Continue' : status === 'sending' ? 'Sending…' : 'Schedule my call'}
        onPress={step === 1 ? next : submit}
        disabled={status === 'sending'}
        size="lg"
        style={styles.submit}
      />
      <Text style={styles.fine}>Free call. No commitment.</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: 28,
    boxShadow: '0 24px 60px rgba(60, 30, 160, 0.12)',
  },
  title: { fontFamily: font.bold, fontSize: 24, letterSpacing: -0.4, color: color.ink },
  sub: { fontFamily: font.medium, fontSize: 15, lineHeight: 22, color: color.body, marginTop: 6 },
  label: { fontFamily: font.semibold, fontSize: 13, color: color.ink, marginTop: 18, marginBottom: 6 },
  optional: { fontFamily: font.medium, color: color.muted },
  input: {
    fontFamily: font.medium,
    fontSize: 16,
    color: color.ink,
    backgroundColor: color.bg,
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  textarea: { minHeight: 104, textAlignVertical: 'top' },
  trap: { position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' },
  error: { fontFamily: font.semibold, fontSize: 14, color: color.bad, marginTop: 12 },
  submit: { alignSelf: 'stretch', marginTop: 20 },
  fine: {
    fontFamily: font.medium,
    fontSize: 13,
    color: color.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  doneBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.goodSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  doneGlyph: { fontFamily: font.extrabold, fontSize: 20, color: color.good },
});
