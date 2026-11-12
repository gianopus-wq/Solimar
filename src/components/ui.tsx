import { ReactNode } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { color, fluid, font, maxWidth, radius } from '../theme';

export function Container({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.container, style]}>{children}</View>;
}

export function Section({
  children,
  tinted,
  style,
}: {
  children: ReactNode;
  tinted?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, tinted && styles.sectionTinted]}>
      <Container style={style}>{children}</Container>
    </View>
  );
}

/** Small pill label that sits above a section heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.eyebrow}>
      <Text style={styles.eyebrowText}>{children}</Text>
    </View>
  );
}

export function H2({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text role="heading" aria-level={2} style={[styles.h2, style]}>
      {children}
    </Text>
  );
}

export function Lead({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.lead, style]}>{children}</Text>;
}

/** Purple highlight chip used inside headlines. */
export function Mark({ children }: { children: ReactNode }) {
  return <Text style={styles.mark}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  size = 'md',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      role="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.button,
        size === 'sm' && styles.buttonSm,
        size === 'lg' && styles.buttonLg,
        hovered && styles.buttonHover,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.buttonText, size === 'sm' && styles.buttonTextSm, size === 'lg' && styles.buttonTextLg]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A check / cross bullet row. */
export function Bullet({
  children,
  tone = 'good',
}: {
  children: ReactNode;
  tone?: 'good' | 'bad' | 'accent';
}) {
  const bg = tone === 'good' ? color.goodSoft : tone === 'bad' ? color.badSoft : color.accentSoft;
  const fg = tone === 'good' ? color.good : tone === 'bad' ? color.bad : color.accent;
  return (
    <View style={styles.bullet}>
      <View style={[styles.bulletDot, { backgroundColor: bg }]}>
        <Text style={[styles.bulletGlyph, { color: fg }]}>{tone === 'bad' ? '✕' : '✓'}</Text>
      </View>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: fluid(56, 8, 96, 56),
  },
  sectionTinted: {
    backgroundColor: color.tint,
  },
  eyebrow: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  eyebrowText: {
    fontFamily: font.semibold,
    fontSize: 12,
    letterSpacing: 0.2,
    color: color.body,
  },
  h2: {
    fontFamily: font.bold,
    fontSize: fluid(28, 4.2, 42, 28),
    lineHeight: fluid(35, 5.1, 51, 35),
    letterSpacing: -0.8,
    color: color.ink,
    maxWidth: 760,
  },
  lead: {
    fontFamily: font.medium,
    fontSize: 17,
    lineHeight: 27,
    color: color.body,
    maxWidth: 640,
    marginTop: 14,
  },
  mark: {
    backgroundColor: color.accent,
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  card: {
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.line,
    padding: 24,
  },
  button: {
    backgroundColor: color.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  buttonSm: { paddingHorizontal: 16, paddingVertical: 9 },
  buttonLg: { paddingHorizontal: 30, paddingVertical: 17 },
  buttonHover: { backgroundColor: color.accentDark },
  buttonPressed: { backgroundColor: color.accent },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontFamily: font.bold, fontSize: 15, color: '#FFFFFF' },
  buttonTextSm: { fontSize: 13 },
  buttonTextLg: { fontSize: 17 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  bulletDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bulletGlyph: { fontSize: 11, fontFamily: font.extrabold, lineHeight: 14 },
  bulletText: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 15,
    lineHeight: 23,
    color: color.body,
  },
});
