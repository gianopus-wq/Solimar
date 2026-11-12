import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { StoreProvider } from '../data/store';
import { color } from '../theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  // On web the page is pre-rendered, so show it right away and let the font swap in.
  if (!loaded && Platform.OS !== 'web') return null;

  return (
    <StoreProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }} />
    </StoreProvider>
  );
}
