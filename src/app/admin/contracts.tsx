import Ionicons from '@expo/vector-icons/Ionicons';
import * as DocumentPicker from 'expo-document-picker';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, d, DButton, Empty, Panel, Shell, t } from '../../components/dash';
import { ADMIN_NAV } from '../../components/nav';
import { useStore } from '../../data/store';
import { formatDate } from '../../lib/events';

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Contract templates. The default one is named in every onboarding request. */
export default function AdminContracts() {
  const store = useStore();

  async function upload() {
    const picked = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    });
    if (picked.canceled) return;
    const file = picked.assets[0];
    store.addTemplate({ name: file.name.replace(/\.[^.]+$/, ''), fileName: file.name, size: file.size ?? 0 });
  }

  return (
    <Shell
      title="Contract templates"
      subtitle="The agreement used when a client adds someone to their team"
      nav={ADMIN_NAV}
      right={<DButton label="Upload template" icon="cloud-upload-outline" onPress={upload} />}
    >
      <Panel title="Templates">
        {store.templates.length === 0 && <Empty>Upload a contractor agreement or SOW to get started.</Empty>}
        {store.templates.map((c) => (
          <View key={c.id} style={styles.row}>
            <View style={styles.icon}>
              <Ionicons name="document-text-outline" size={20} color={d.blue} />
            </View>
            <View style={t.grow}>
              <Text style={t.strong}>{c.name}</Text>
              <Text style={t.small}>
                {c.fileName} · {kb(c.size)} · {formatDate(c.uploadedAt)}
              </Text>
            </View>
            {c.isDefault ? (
              <Badge label="Default" tone="good" icon="checkmark-circle" />
            ) : (
              <DButton label="Make default" variant="soft" small onPress={() => store.setDefaultTemplate(c.id)} />
            )}
            <DButton label="Remove" icon="trash-outline" variant="danger" small onPress={() => store.removeTemplate(c.id)} />
          </View>
        ))}
      </Panel>

      <Panel style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color={d.blue} />
        <Text style={[t.text, t.grow]}>
          When a client clicks “Add to Team”, the default template’s file name is sent with the onboarding request so
          your automation knows which agreement to generate.
        </Text>
      </Panel>
    </Shell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: d.line,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: d.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 14 },
});
