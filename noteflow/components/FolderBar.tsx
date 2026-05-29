import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Folder } from '../types';
import { AppColors } from '../constants/theme';

interface Props {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onManage: () => void;
  colors: AppColors;
}

export default function FolderBar({ folders, selectedFolderId, onSelectFolder, onManage, colors }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity
          style={[styles.chip, !selectedFolderId && { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
          onPress={() => onSelectFolder(null)}
          activeOpacity={0.7}
        >
          <Ionicons name="folder-open-outline" size={16} color={!selectedFolderId ? colors.primary : colors.textTertiary} />
          <Text style={[styles.chipLabel, !selectedFolderId && { color: colors.primary, fontWeight: '700' }]}>Todas</Text>
        </TouchableOpacity>
        {folders.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.chip, { borderColor: f.color + '40' }, selectedFolderId === f.id && { backgroundColor: f.color + '20', borderColor: f.color }]}
            onPress={() => onSelectFolder(selectedFolderId === f.id ? null : f.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="folder-outline" size={16} color={f.color} />
            <Text style={[styles.chipLabel, { color: colors.text }, selectedFolderId === f.id && { color: f.color, fontWeight: '700' }]}>{f.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={onManage} activeOpacity={0.7}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { },
  scroll: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'transparent',
  },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  addBtn: { justifyContent: 'center', alignItems: 'center', paddingLeft: 4 },
});
