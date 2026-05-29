import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Folder } from '../types';
import { AppColors } from '../constants/theme';
import { useFolderStore } from '../store/folderStore';
import { useLocaleStore } from '../store/localeStore';
import { t } from '../i18n';

const FOLDER_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#78716C'];

interface Props {
  visible: boolean;
  onClose: () => void;
  folders: Folder[];
  colors: AppColors;
  type: 'note' | 'checklist' | 'idea';
}

export default function FolderModal({ visible, onClose, folders, colors, type }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const createFolder = useFolderStore((s) => s.createFolder);
  const updateFolder = useFolderStore((s) => s.updateFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);
  const locale = useLocaleStore((s) => s.locale);

  const reset = () => { setEditId(null); setName(''); setColor(FOLDER_COLORS[0]); };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editId) {
      await updateFolder(editId, { name: name.trim(), color });
    } else {
      await createFolder(name.trim(), color, type);
    }
    reset();
  };

  const handleEdit = (f: Folder) => {
    setEditId(f.id);
    setName(f.name);
    setColor(f.color);
  };

  const handleDelete = (f: Folder) => {
    Alert.alert(
      t(locale, 'common.delete'),
      `¿Eliminar carpeta "${f.name}"? Los elementos no se eliminarán.`,
      [
        { text: t(locale, 'common.cancel'), style: 'cancel' },
        { text: t(locale, 'common.delete'), style: 'destructive', onPress: () => { deleteFolder(f.id); if (editId === f.id) reset(); } },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{editId ? 'Editar carpeta' : 'Nueva carpeta'}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            placeholder="Nombre de la carpeta"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
          <View style={styles.colorRow}>
            {FOLDER_COLORS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setColor(c)} activeOpacity={0.7}>
                <View style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: name.trim() ? 1 : 0.4 }]} onPress={handleSave} disabled={!name.trim()} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>{editId ? 'Guardar cambios' : 'Crear carpeta'}</Text>
          </TouchableOpacity>

          {folders.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 20 }]}>Carpetas existentes</Text>
              <FlatList
                data={folders}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 200 }}
                renderItem={({ item }) => (
                  <View style={[styles.folderRow, { borderBottomColor: colors.borderLight }]}>
                    <View style={[styles.folderDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.folderName, { color: colors.text }]}>{item.name}</Text>
                    <TouchableOpacity onPress={() => handleEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.rowBtn}>
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.rowBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, fontSize: 15, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  saveBtn: { borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  folderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  folderDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  folderName: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowBtn: { paddingHorizontal: 8 },
});
