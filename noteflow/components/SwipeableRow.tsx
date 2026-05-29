import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import type { AppColors } from '../constants/theme';
import { useLocaleStore } from '../store/localeStore';
import { t, Locale } from '../i18n';

interface Props {
  children: React.ReactNode;
  archived: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onFolder?: () => void;
  colors: AppColors;
  variant?: 'buttons' | 'icons' | 'icons-horizontal';
}

export default function SwipeableRow({ children, archived, onArchive, onRestore, onDelete, onEdit, onFolder, colors, variant = 'buttons' }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  if (variant === 'icons') {
    return (
      <Swipeable renderRightActions={(_, dragX) => <IconsActions dragX={dragX} archived={archived} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} onEdit={onEdit} onFolder={onFolder} colors={colors} />} rightThreshold={10} overshootRight={false}>
        {children}
      </Swipeable>
    );
  }

  if (variant === 'icons-horizontal') {
    return (
      <Swipeable renderRightActions={() => <IconsHorizontalActions archived={archived} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} onEdit={onEdit} onFolder={onFolder} colors={colors} />} rightThreshold={10} overshootRight={false}>
        {children}
      </Swipeable>
    );
  }

  return (
    <Swipeable renderRightActions={() => <ButtonsActions archived={archived} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} colors={colors} locale={locale} />} rightThreshold={40} overshootRight={false}>
      {children}
    </Swipeable>
  );
}

function IconsActions({ archived, onArchive, onRestore, onDelete, onEdit, onFolder, colors }: { dragX: Animated.AnimatedInterpolation<number>; archived: boolean; onArchive: () => void; onRestore: () => void; onDelete: () => void; onEdit?: () => void; onFolder?: () => void; colors: AppColors }) {
  return (
    <View style={[stylesIcons.wrapper, { marginBottom: 10 }]}>
      <TouchableOpacity style={[stylesIcons.iconBtn, { backgroundColor: 'rgba(239,68,68,0.15)' }]} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
      <TouchableOpacity style={[stylesIcons.iconBtn, { backgroundColor: colors.primary + '15' }]} onPress={onEdit}>
        <Ionicons name="create-outline" size={20} color={colors.text} />
      </TouchableOpacity>
      {onFolder && (
        <TouchableOpacity style={[stylesIcons.iconBtn, { backgroundColor: colors.primary + '15' }]} onPress={onFolder}>
          <Ionicons name="folder-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[stylesIcons.iconBtn, { backgroundColor: colors.primary + '15' }]} onPress={archived ? onRestore : onArchive}>
        <Ionicons name={archived ? "refresh-outline" : "archive-outline"} size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

function IconsHorizontalActions({ archived, onArchive, onRestore, onDelete, onEdit, onFolder, colors }: { archived: boolean; onArchive: () => void; onRestore: () => void; onDelete: () => void; onEdit?: () => void; onFolder?: () => void; colors: AppColors }) {
  return (
    <View style={[stylesH.wrapper, { marginBottom: 10 }]}>
      <TouchableOpacity style={[stylesH.iconBtn, { backgroundColor: colors.primary + '15' }]} onPress={onEdit}>
        <Ionicons name="create-outline" size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={stylesH.divider} />
      {onFolder && (
        <>
          <TouchableOpacity style={[stylesH.iconBtn, { backgroundColor: colors.primary + '15' }]} onPress={onFolder}>
            <Ionicons name="folder-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={stylesH.divider} />
        </>
      )}
      <TouchableOpacity style={[stylesH.iconBtn, { backgroundColor: colors.primary + '15' }]} onPress={archived ? onRestore : onArchive}>
        <Ionicons name={archived ? "refresh-outline" : "archive-outline"} size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={stylesH.divider} />
      <TouchableOpacity style={[stylesH.iconBtn, { backgroundColor: 'rgba(239,68,68,0.15)' }]} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

function ButtonsActions({ archived, onArchive, onRestore, onDelete, colors, locale }: { archived: boolean; onArchive: () => void; onRestore: () => void; onDelete: () => void; colors: AppColors; locale: Locale }) {
  return (
    <View style={[stylesBtns.actionsOuter, { marginBottom: 10 }]}>
      <View style={stylesBtns.actionsContainer}>
        <TouchableOpacity style={[stylesBtns.action, { backgroundColor: colors.primary }]} onPress={archived ? onRestore : onArchive}>
          <Text style={stylesBtns.actionText}>{archived ? t(locale, 'swipe.restore') : t(locale, 'swipe.archive')}</Text>
        </TouchableOpacity>
        <View style={stylesBtns.actionDivider} />
        <TouchableOpacity style={[stylesBtns.action, { backgroundColor: '#EF4444' }]} onPress={onDelete}>
          <Text style={stylesBtns.actionText}>{t(locale, 'swipe.delete')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const stylesIcons = StyleSheet.create({
  wrapper: {
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const stylesH = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  iconBtn: {
    width: 36,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '30%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

const stylesBtns = StyleSheet.create({
  actionsOuter: { borderRadius: 16, overflow: 'hidden' },
  actionsContainer: { flexDirection: 'row', alignItems: 'center', height: '100%' },
  action: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22, height: '100%' },
  actionDivider: { width: 1, height: '40%', backgroundColor: 'rgba(255,255,255,0.25)' },
  actionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
