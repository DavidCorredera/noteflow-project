import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '../constants/theme';
import { t, Locale } from '../i18n';
import type { Folder } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  folders: Folder[];
  colors: AppColors;
  locale: Locale;
  onSelect: (folderId: string | null) => void;
}

export default function FolderPickerModal({ visible, onClose, folders, colors, locale, onSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t(locale, 'folderPicker.title')}</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            <TouchableOpacity
              style={[styles.folderOption, { borderBottomColor: colors.borderLight }]}
              onPress={() => { onSelect(null); onClose(); }}
              activeOpacity={0.7}
            >
              <View style={[styles.folderIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="folder-open-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.folderName, { color: colors.text }]}>{t(locale, 'folderPicker.noFolder')}</Text>
            </TouchableOpacity>
            {folders.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.folderOption, { borderBottomColor: colors.borderLight }]}
                onPress={() => { onSelect(f.id); onClose(); }}
                activeOpacity={0.7}
              >
                <View style={[styles.folderIcon, { backgroundColor: f.color + '20' }]}>
                  <Ionicons name="folder-outline" size={18} color={f.color} />
                </View>
                <Text style={[styles.folderName, { color: colors.text }]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>{t(locale, 'common.cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 320 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  folderOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1,
  },
  folderIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  folderName: { fontSize: 15, fontWeight: '500' },
  cancelBtn: { width: '100%', height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
});
