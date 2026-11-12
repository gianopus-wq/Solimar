import Ionicons from '@expo/vector-icons/Ionicons';
import { createElement } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { font } from '../theme';
import { d } from './dash';

/** 60-second intro video. Plays in the browser; shows a placeholder when there is no file. */
export function Video({ url, emptyText }: { url?: string; emptyText: string }) {
  if (url && Platform.OS === 'web') {
    return createElement('video', {
      src: url,
      controls: true,
      playsInline: true,
      style: { width: '100%', aspectRatio: '16 / 9', borderRadius: 16, backgroundColor: '#0E1426', objectFit: 'cover' },
    });
  }
  return (
    <View style={styles.empty}>
      <View style={styles.play}>
        <Ionicons name={url ? 'play' : 'videocam-outline'} size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.text}>{emptyText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: '#18213B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  play: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: d.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: font.semibold, fontSize: 13, color: '#C9D3EC', textAlign: 'center' },
});
