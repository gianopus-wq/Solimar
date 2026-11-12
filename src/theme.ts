import { Platform } from 'react-native';

export const color = {
  bg: '#FAFAFD',
  surface: '#FFFFFF',
  tint: '#F4F1FF',
  ink: '#14121F',
  body: '#4D4A5E',
  muted: '#7A778C',
  line: '#E9E6F2',
  accent: '#6D3DF5',
  accentDark: '#5429D6',
  accentSoft: '#E9E2FF',
  good: '#0E8A5F',
  goodSoft: '#E3F6EE',
  bad: '#B4474E',
  badSoft: '#FBECEC',
};

export const font = {
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const maxWidth = 1120;

/**
 * Fluid sizing that needs no JS breakpoints, so the statically rendered HTML
 * matches what the browser paints (no layout flash on hydration).
 * On native, falls back to the fixed `native` value.
 */
export function fluid(min: number, vw: number, max: number, native = min): number {
  return Platform.select({
    web: `clamp(${min}px, ${vw}vw, ${max}px)` as unknown as number,
    default: native,
  }) as number;
}

/** Styles that only exist on the web (gradients, blur, etc.). */
export function webOnly<T extends object>(style: T): object {
  return Platform.OS === 'web' ? style : {};
}
