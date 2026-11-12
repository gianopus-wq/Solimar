import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';

import { useStore } from '../data/store';
import { SunMark } from './SunMark';
import { font, webOnly } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Dashboard palette: cool blue-gray surfaces with one blue accent. */
export const d = {
  bg: '#E9EFFB',
  panel: '#FFFFFF',
  soft: '#F3F6FD',
  line: '#E1E8F5',
  ink: '#121A2F',
  body: '#48546F',
  muted: '#8390AC',
  blue: '#3A66F0',
  blueDark: '#2B50CC',
  blueSoft: '#E3EBFF',
  good: '#0E8A5F',
  goodSoft: '#E1F5EC',
  warn: '#A8660B',
  warnSoft: '#FFF1D9',
  bad: '#B4474E',
  badSoft: '#FBE9EA',
};

export const pageBackground = webOnly({
  backgroundImage: 'linear-gradient(160deg, #DDE7FB 0%, #EEF2FC 45%, #E4EAFA 100%)',
});

export type NavItem = { href: string; label: string; icon: IconName };

// Rail sits on the left on wide screens and becomes a bottom bar on phones.
// Plain CSS keeps the pre-rendered HTML and the hydrated page identical.
const SHELL_CSS = `
@media (max-width: 760px) {
  #dash-frame { flex-direction: column-reverse !important; padding: 0 !important; gap: 0 !important; }
  #dash-rail { flex-direction: row !important; width: auto !important; justify-content: space-around !important;
    border-radius: 0 !important; padding: 6px 4px !important; border-width: 1px 0 0 0 !important; }
  #dash-brand { display: none !important; }
  #dash-main { border-radius: 0 !important; }
}`;

export function Shell({
  title,
  subtitle,
  nav,
  right,
  children,
}: {
  title: string;
  subtitle: string;
  nav: NavItem[];
  right?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { error, clearError, signOut } = useStore();
  return (
    <View style={[s.root, pageBackground]}>
      <Head>
        <title>{`${title} | Naboria`}</title>
        <meta name="robots" content="noindex" />
        <style>{SHELL_CSS}</style>
      </Head>
      <View nativeID="dash-frame" style={s.frame}>
        <View nativeID="dash-rail" style={s.rail}>
          <View nativeID="dash-brand" style={s.brand}>
            <SunMark size={30} color="#FFFFFF" detail={d.blue} />
          </View>
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Pressable
                key={item.href}
                role="link"
                onPress={() => router.push(item.href as never)}
                style={[s.navItem, active && s.navItemOn]}
                aria-current={active ? 'page' : undefined}
              >
                <Ionicons name={item.icon} size={20} color={active ? d.blue : d.muted} />
                <Text style={[s.navLabel, active && s.navLabelOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView nativeID="dash-main" style={s.main} contentContainerStyle={s.mainContent}>
          <View style={s.header}>
            <View style={s.headerText}>
              <Text role="heading" aria-level={1} style={s.title}>
                {title}
              </Text>
              <Text style={s.subtitle}>{subtitle}</Text>
            </View>
            <View style={[s.headerRight, t.rowWrap]}>
              {right}
              <DButton label="Sign out" icon="log-out-outline" variant="ghost" small onPress={signOut} />
            </View>
          </View>
          {!!error && (
            <Pressable onPress={clearError} role="alert" style={s.error}>
              <Ionicons name="alert-circle" size={18} color={d.bad} />
              <Text style={s.errorText}>{error}</Text>
              <Ionicons name="close" size={16} color={d.bad} />
            </Pressable>
          )}
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

export function Panel({
  title,
  action,
  children,
  style,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.panel, style]}>
      {(title || action) && (
        <View style={s.panelHead}>
          {!!title && (
            <Text role="heading" aria-level={2} style={s.panelTitle}>
              {title}
            </Text>
          )}
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

export type Tone = 'blue' | 'good' | 'warn' | 'bad' | 'gray';
const TONES: Record<Tone, { bg: string; fg: string }> = {
  blue: { bg: d.blueSoft, fg: d.blueDark },
  good: { bg: d.goodSoft, fg: d.good },
  warn: { bg: d.warnSoft, fg: d.warn },
  bad: { bg: d.badSoft, fg: d.bad },
  gray: { bg: d.soft, fg: d.body },
};

export function Badge({ label, tone = 'blue', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const t = TONES[tone];
  return (
    <View style={[s.badge, { backgroundColor: t.bg }]}>
      {icon && <Ionicons name={icon} size={13} color={t.fg} />}
      <Text style={[s.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function DButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? d.bad : variant === 'soft' ? d.blueDark : d.body;
  return (
    <Pressable
      role="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        s.btn,
        small && s.btnSmall,
        variant === 'primary' && s.btnPrimary,
        variant === 'soft' && s.btnSoft,
        (variant === 'ghost' || variant === 'danger') && s.btnGhost,
        hovered && (variant === 'primary' ? s.btnPrimaryHover : s.btnHover),
        pressed && s.btnPressed,
        disabled && s.btnDisabled,
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={small ? 14 : 16} color={fg} />}
      <Text style={[s.btnText, small && s.btnTextSmall, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  style,
  keyboardType,
  secure,
  onSubmit,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secure?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <View style={[s.field, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={d.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' || secure ? 'none' : undefined}
        secureTextEntry={secure}
        onSubmitEditing={onSubmit}
        aria-label={label}
        style={[s.input, multiline && s.inputMulti]}
      />
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.36 }]}>{initials || '?'}</Text>
    </View>
  );
}

export function Chip({
  label,
  verified,
  selected,
  onPress,
  onRemove,
}: {
  label: string;
  verified?: boolean;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  const body = (
    <>
      {verified && <Ionicons name="checkmark-circle" size={14} color={d.good} />}
      <Text style={[s.chipText, selected && s.chipTextOn]}>{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} aria-label={`Remove ${label}`} hitSlop={8}>
          <Ionicons name="close" size={14} color={d.muted} />
        </Pressable>
      )}
    </>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} role="button" aria-pressed={!!selected} style={[s.chip, selected && s.chipOn]}>
        {body}
      </Pressable>
    );
  }
  return <View style={s.chip}>{body}</View>;
}

export function Stat({ label, value, note, icon }: { label: string; value: string; note?: string; icon: IconName }) {
  return (
    <Panel style={s.stat}>
      <View style={s.statIcon}>
        <Ionicons name={icon} size={18} color={d.blue} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {!!note && <Text style={s.statNote}>{note}</Text>}
    </Panel>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <Text style={s.empty}>{children}</Text>;
}

/** Shared text + layout styles for dashboard screens. */
export const t = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  strong: { fontFamily: font.bold, fontSize: 15, lineHeight: 21, color: d.ink },
  text: { fontFamily: font.medium, fontSize: 14, lineHeight: 21, color: d.body },
  small: { fontFamily: font.medium, fontSize: 13, lineHeight: 19, color: d.muted },
  divider: { height: 1, backgroundColor: d.line, marginVertical: 14 },
  item: {
    borderWidth: 1,
    borderColor: d.line,
    borderRadius: 14,
    padding: 14,
    backgroundColor: d.panel,
  },
  grow: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: d.bg },
  frame: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
    ...webOnly({ height: '100dvh' }),
  },
  rail: {
    width: 84,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: d.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    minWidth: 64,
  },
  navItemOn: { backgroundColor: d.blueSoft },
  navLabel: { fontFamily: font.semibold, fontSize: 11, color: d.muted },
  navLabelOn: { color: d.blueDark },
  main: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 22,
  },
  mainContent: { padding: 18, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  headerText: { flexShrink: 1, minWidth: 0 },
  headerRight: { flexShrink: 1, minWidth: 0, maxWidth: '100%' },
  title: { fontFamily: font.bold, fontSize: 24, letterSpacing: -0.5, color: d.ink },
  subtitle: { fontFamily: font.medium, fontSize: 14, color: d.muted, marginTop: 2 },

  panel: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    flexShrink: 1,
    minWidth: 0,
    boxShadow: '0 8px 24px rgba(40, 70, 150, 0.06)',
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  panelTitle: { fontFamily: font.bold, fontSize: 16, color: d.ink },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: font.bold, fontSize: 12 },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignSelf: 'flex-start',
  },
  btnSmall: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10 },
  btnPrimary: { backgroundColor: d.blue },
  btnPrimaryHover: { backgroundColor: d.blueDark },
  btnSoft: { backgroundColor: d.blueSoft },
  btnGhost: { backgroundColor: d.panel, borderWidth: 1, borderColor: d.line },
  btnHover: { opacity: 0.85 },
  btnPressed: { opacity: 0.7 },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontFamily: font.bold, fontSize: 14 },
  btnTextSmall: { fontSize: 13 },

  field: { flexGrow: 1, flexShrink: 1, flexBasis: 220, minWidth: 0 },
  fieldLabel: { fontFamily: font.semibold, fontSize: 12, color: d.body, marginBottom: 5 },
  input: {
    fontFamily: font.medium,
    fontSize: 15,
    color: d.ink,
    backgroundColor: d.soft,
    borderWidth: 1,
    borderColor: d.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },

  avatar: { backgroundColor: d.blueSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.extrabold, color: d.blueDark },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: d.soft,
    borderWidth: 1,
    borderColor: d.line,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: d.blueSoft, borderColor: d.blue },
  chipText: { fontFamily: font.semibold, fontSize: 13, color: d.body },
  chipTextOn: { color: d.blueDark },

  stat: { flexGrow: 1, flexBasis: 180 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: d.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { fontFamily: font.extrabold, fontSize: 28, letterSpacing: -0.8, color: d.ink },
  statLabel: { fontFamily: font.semibold, fontSize: 13, color: d.body, marginTop: 2 },
  statNote: { fontFamily: font.medium, fontSize: 12, color: d.muted, marginTop: 2 },

  empty: { fontFamily: font.medium, fontSize: 14, color: d.muted, paddingVertical: 8 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: d.badSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { flex: 1, fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: d.bad },
});
