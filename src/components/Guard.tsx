import { Redirect, Slot } from 'expo-router';
import { View } from 'react-native';

import { useStore } from '../data/store';
import { Role } from '../data/types';
import { d, pageBackground } from './dash';

/** Lets a section render only for the signed-in role it belongs to. */
export function Guard({ role }: { role: Role }) {
  const store = useStore();
  if (!store.ready) return <View style={[{ flex: 1, backgroundColor: d.bg }, pageBackground]} />;
  if (!store.session) return <Redirect href="/login" />;
  if (store.role !== role) return <Redirect href={store.role === 'admin' ? '/admin' : '/talent'} />;
  return <Slot />;
}
